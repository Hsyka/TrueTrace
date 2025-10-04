// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const multer = require('multer');
const fs = require('fs');
app.use(cors());            // keep if you're not using the Angular proxy
app.use(express.json());

// Allow cross-origin access to uploaded images (useful in dev when frontend runs on different port)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Ensure uploads folder exists and serve it
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// Multer file storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safe = file.originalname.replace(/[^a-z0-9.\-\_]/gi, '_');
    cb(null, `${unique}-${safe}`);
  }
});
const upload = multer({ storage });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'truetrace',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10
});

// Toggle verbose debug logs: set VERBOSE=true in env to see info logs (otherwise only errors are printed)
const VERBOSE = (process.env.VERBOSE === 'true');

// startup DB ping to catch credential/DB errors early
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
  if (VERBOSE) console.log('✅ DB connection OK');
  } catch (e) {
    console.error('❌ DB connection failed:', e.code, e.message);
  }
})();

// optional friendly root
app.get('/', (_req, res) => {
  res.send('Inventory API is running. Try GET /api/products');
});

// MASTER list
app.get('/api/products', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         p.ProductID   AS id,
         p.SKU         AS sku,
         p.ProductName AS name,
         p.Category    AS category,
         p.UnitPrice   AS unitPrice,
         COALESCE(i.QuantityOnHand, 0) AS quantity,
         p.ImageUrl    AS imageUrl,
         p.Description AS description
       FROM Products p
       LEFT JOIN Inventory i ON i.ProductID = p.ProductID
       ORDER BY p.ProductName`
    );
  // log imageUrl presence for debugging
  if (VERBOSE) console.log('GET /api/products returning', rows.length, 'rows; sample imageUrl:', rows[0] && rows[0].imageUrl);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/products DB error:', err.code, err.message);
    res.status(500).json({ error: 'DB_ERROR', code: err.code, message: err.message });
  }
});

// DETAIL
app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         p.ProductID   AS id,
         p.SKU         AS sku,
         p.ProductName AS name,
         p.Category    AS category,
         p.UnitPrice   AS unitPrice,
         COALESCE(i.QuantityOnHand, 0) AS quantity,
         p.ImageUrl    AS imageUrl,
         p.Description AS description
       FROM Products p
       LEFT JOIN Inventory i ON i.ProductID = p.ProductID
       WHERE p.ProductID = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
  if (VERBOSE) console.log('GET /api/products/:id', req.params.id, 'imageUrl:', rows[0].imageUrl);
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/products/:id DB error:', err.code, err.message);
    res.status(500).json({ error: 'DB_ERROR', code: err.code, message: err.message });
  }
});

// UPSERT quantity
app.put('/api/products/:id/quantity', async (req, res) => {
  const id = Number(req.params.id);
  const qty = Number(req.body.quantity);
  if (!Number.isFinite(id) || !Number.isFinite(qty)) {
    return res.status(400).json({ error: 'Invalid id or quantity' });
  }
  try {
    await pool.query(
      `INSERT INTO Inventory (ProductID, QuantityOnHand)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE QuantityOnHand = VALUES(QuantityOnHand)`,
      [id, qty]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/products/:id/quantity DB error:', err.code, err.message);
    res.status(500).json({ error: 'DB_ERROR', code: err.code, message: err.message });
  }
});
// CREATE product (+ optional initial quantity)
// Create product (+ optional initial quantity and optional image upload)
app.post('/api/products', upload.single('image'), async (req, res) => {
  // Accept multipart/form-data (file) or JSON body fields
  const body = req.body || {};
  if (VERBOSE) console.log('POST /api/products body:', Object.keys(body).length ? body : '[empty]');
  if (VERBOSE) console.log('POST /api/products file:', req.file ? { filename: req.file.filename, size: req.file.size } : 'no-file');
  const sku = body.sku;
  const name = body.name;
  const category = body.category;
  const unitPrice = body.unitPrice != null ? Number(body.unitPrice) : undefined;
  const quantity = body.quantity != null ? Number(body.quantity) : undefined;
  const description = body.description;

  if (!sku || !name || category == null || unitPrice == null) {
    return res.status(400).json({ error: 'Missing required fields (sku, name, category, unitPrice)' });
  }

  // If a file was uploaded, compute its public URL path
  let imageUrl = body.imageUrl; // optional existing URL
  if (req.file && req.file.filename) {
    // Use absolute URL so the frontend (different origin) can load the image directly
    const host = req.get('host');
    const proto = req.protocol;
    imageUrl = `${proto}://${host}/uploads/${req.file.filename}`;
    // extra debug: verify the file exists and is readable
    try {
      const fp = path.join(uploadsDir, req.file.filename);
  const stat = fs.statSync(fp);
  if (VERBOSE) console.log('Saved upload file stat:', { path: fp, size: stat.size, mtime: stat.mtime });
    } catch (fsErr) {
      console.error('Uploaded file not accessible after save:', fsErr);
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Log the exact parameters used for the INSERT to aid debugging when DB fails
    const insertParams = [sku, name, category, Number(unitPrice), imageUrl || null, description || null];
  if (VERBOSE) console.log('INSERT INTO Products params:', insertParams.map(p => (p === null ? 'NULL' : p)));
    const [r] = await conn.query(
      `INSERT INTO Products (SKU, ProductName, Category, UnitPrice, ImageUrl, Description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      insertParams
    );
  if (VERBOSE) console.log('Inserted product result:', r);
    const newId = r.insertId;
    const qty = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;

    await conn.query(
      `INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE QuantityOnHand = VALUES(QuantityOnHand)`,
      [newId, qty]
    );

    await conn.commit();

    const [[row]] = await conn.query(
      `SELECT p.ProductID AS id, p.SKU AS sku, p.ProductName AS name,
              p.Category AS category, p.UnitPrice AS unitPrice,
              COALESCE(i.QuantityOnHand,0) AS quantity, p.ImageUrl AS imageUrl, p.Description AS description
         FROM Products p
         LEFT JOIN Inventory i ON i.ProductID = p.ProductID
        WHERE p.ProductID = ?`, [newId]
    );
    res.status(201).json(row);
  } catch (e) {
    await conn.rollback();
    console.error('POST /api/products error:', e.code, e.message, e.sqlMessage || e.stack || 'no stack');
    // If file was saved but DB failed, remove the saved file to avoid orphans
    try {
      if (req.file && req.file.filename) {
        const fp = path.join(uploadsDir, req.file.filename);
        if (fs.existsSync(fp)) {
          fs.unlinkSync(fp);
          if (VERBOSE) console.log('Removed uploaded file due to DB error:', fp);
        }
      }
    } catch (rmErr) {
      console.error('Failed to remove uploaded file after DB error:', rmErr);
    }
    // Return detailed error to client for debugging (trim in production)
    res.status(500).json({ error: 'DB_ERROR', code: e.code, message: e.message, sqlMessage: e.sqlMessage || null });
  } finally {
    conn.release();
  }
});

// DELETE product (removes inventory row first)
app.delete('/api/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM Inventory WHERE ProductID = ?`, [id]);
    const [r] = await conn.query(`DELETE FROM Products WHERE ProductID = ?`, [id]);
    await conn.commit();

    if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error('DELETE /api/products/:id error:', e.code, e.message);
    res.status(500).json({ error: 'DB_ERROR', code: e.code, message: e.message });
  } finally {
    conn.release();
  }
});


const port = Number(process.env.PORT || 3000);
app.listen(port, () => { if (VERBOSE) console.log(`API listening on http://localhost:${port}`); });
