// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());            // keep if you're not using the Angular proxy
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'truetrace',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10
});

// startup DB ping to catch credential/DB errors early
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ DB connection OK');
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
         COALESCE(i.QuantityOnHand, 0) AS quantity
       FROM Products p
       LEFT JOIN Inventory i ON i.ProductID = p.ProductID
       ORDER BY p.ProductName`
    );
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
         COALESCE(i.QuantityOnHand, 0) AS quantity
       FROM Products p
       LEFT JOIN Inventory i ON i.ProductID = p.ProductID
       WHERE p.ProductID = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
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
app.post('/api/products', async (req, res) => {
  const { sku, name, category, unitPrice, quantity } = req.body || {};
  if (!sku || !name || category == null || unitPrice == null) {
    return res.status(400).json({ error: 'Missing required fields (sku, name, category, unitPrice)' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO Products (SKU, ProductName, Category, UnitPrice)
       VALUES (?, ?, ?, ?)`,
      [sku, name, category, Number(unitPrice)]
    );
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
              COALESCE(i.QuantityOnHand,0) AS quantity
         FROM Products p
         LEFT JOIN Inventory i ON i.ProductID = p.ProductID
        WHERE p.ProductID = ?`, [newId]
    );
    res.status(201).json(row);
  } catch (e) {
    await conn.rollback();
    console.error('POST /api/products error:', e.code, e.message);
    res.status(500).json({ error: 'DB_ERROR', code: e.code, message: e.message });
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
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
