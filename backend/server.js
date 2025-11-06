// backend/server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { Connector } from "@google-cloud/cloud-sql-connector";

// Auth route modules (must exist in the same folder)
import makeGoogleAuthRoutes from "./auth-google.js";
import makePasswordAuthRoutes from "./auth-password.js";

dotenv.config();

async function start() {
  const app = express();

  /* --------------------------- CORS (IMPORTANT) --------------------------- */
  // Add any additional frontend origins you serve from.
 // CORS (update this block)
const allowedOrigins = [
  "http://localhost:3000",
  "https://storage.googleapis.com",
  "https://truetrace.storage.googleapis.com", // Add your bucket origin
  process.env.FRONTEND_ORIGIN?.trim(),
].filter(Boolean);
  app.use(
    cors({
      origin(origin, cb) {
        // allow requests without Origin (health checks, curl, server-to-server)
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Fast preflight
  app.options("*", cors({ origin: allowedOrigins, credentials: true }));

  /* ------------------------------- Middleware ------------------------------ */
  app.use(cookieParser());
  app.use(express.json());

  /* -------------------------- Cloud SQL Connection ------------------------ */
  // Supports both Cloud Run (Unix socket) and local development (TCP)
  
const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  INSTANCE_CONNECTION_NAME,
} = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error("Missing one or more DB env vars.", {
    DB_HOST: !!DB_HOST,
    DB_USER: !!DB_USER,
    DB_PASSWORD: !!DB_PASSWORD,
    DB_NAME,
    INSTANCE_CONNECTION_NAME: !!INSTANCE_CONNECTION_NAME,
  });
  process.exit(1);
}

// Determine connection method: Cloud Run uses socket, local uses TCP
const isCloudRun = !!INSTANCE_CONNECTION_NAME && !DB_HOST;
let pool;

if (isCloudRun) {
  // Cloud Run: Use Unix socket connection
  console.log('Using Cloud Run socket connection');
  pool = mysql.createPool({
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    socketPath: `/cloudsql/${INSTANCE_CONNECTION_NAME}`,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  });
} else {
  // Local development: Use TCP connection
  console.log('Using TCP connection for local development');
  const dbConfig = {
    host: DB_HOST || '34.31.129.80',
    port: 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    charset: 'utf8mb4',
    ssl: {
      rejectUnauthorized: false
    }
  };
  
  console.log('Database config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
  });
  
  pool = mysql.createPool(dbConfig);
}

// Test the connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connection successful');
    connection.query('SELECT NOW() as now')
      .then(([result]) => {
        console.log('✅ Database query successful:', result[0].now);
        connection.release();
      })
      .catch(err => {
        console.warn('⚠️ Database query failed:', err);
      });
  })
  .catch(err => {
    console.warn('⚠️ Database connection failed:', err);
  });

  /* ------------------------------ Health / Debug --------------------------- */
  app.get("/api/ping", (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true });
  });

  app.get("/api/test-db", async (_req, res) => {
    try {
      const [rows] = await pool.query("SELECT NOW() AS now");
      res.json({ status: "connected", now: rows[0]?.now });
    } catch (err) {
      console.error("DB test error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  /* --------------------------------- Routes -------------------------------- */
  // IMPORTANT: Your auth route modules should use cookies like:
  // res.cookie('tt_session', token, { httpOnly:true, secure:true, sameSite:'None', maxAge: 86400000 });
  app.use("/api/auth", makeGoogleAuthRoutes(pool));
  app.use("/api/auth", makePasswordAuthRoutes(pool));

  // Example products route
  app.get("/api/products", async (_req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT
          ProductID   AS id,
          SKU         AS sku,
          ProductName AS name,
          Category    AS category,
          UnitPrice   AS price,
          ImageUrl    AS imageUrl,
          Description AS description,
          qty         AS quantity
        FROM products
        ORDER BY ProductID DESC
      `);
      res.json(rows);
    } catch (e) {
      console.error("Products error:", e);
      res.status(500).json({
        error: "Failed to load products",
        code: e.code || null,
        sqlMessage: e.sqlMessage || e.message || null,
      });
    }
  });

  // Update product stock
  app.post("/api/products/:id/stock", async (req, res) => {
    try {
      const { id } = req.params;
      const { operation, amount } = req.body;

      // Validate input
      if (!operation || !["add", "remove", "set"].includes(operation)) {
        return res.status(400).json({ 
          error: "Invalid operation. Must be 'add', 'remove', or 'set'" 
        });
      }

      const parsedAmount = parseInt(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({ 
          error: "Invalid amount. Must be a positive number" 
        });
      }

      // Get current quantity
      const [current] = await pool.query(
        "SELECT qty FROM products WHERE ProductID = ?",
        [id]
      );

      if (current.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      let newQuantity;
      const currentQty = current[0].qty;

      // Calculate new quantity based on operation
      if (operation === "add") {
        newQuantity = currentQty + parsedAmount;
      } else if (operation === "remove") {
        newQuantity = Math.max(0, currentQty - parsedAmount); // Don't go below 0
      } else if (operation === "set") {
        newQuantity = parsedAmount;
      }

      // Update the quantity
      await pool.query(
        "UPDATE products SET qty = ? WHERE ProductID = ?",
        [newQuantity, id]
      );

      // Return updated product
      const [updated] = await pool.query(
        `SELECT
          ProductID   AS id,
          SKU         AS sku,
          ProductName AS name,
          Category    AS category,
          UnitPrice   AS price,
          ImageUrl    AS imageUrl,
          Description AS description,
          qty         AS quantity
        FROM products
        WHERE ProductID = ?`,
        [id]
      );

      res.json({
        success: true,
        message: `Stock ${operation === 'set' ? 'updated' : operation === 'add' ? 'increased' : 'decreased'} successfully`,
        product: updated[0],
        previousQuantity: currentQty,
        newQuantity: newQuantity
      });
    } catch (e) {
      console.error("Stock update error:", e);
      res.status(500).json({
        error: "Failed to update stock",
        code: e.code || null,
        sqlMessage: e.sqlMessage || e.message || null,
      });
    }
  });

  /* ------------------------------ Error handler ---------------------------- */
  app.use((err, _req, res, _next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  });

  /* --------------------------------- Server -------------------------------- */
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log("==============================================");
    console.log(`✅ Server listening on :${PORT}`);
    console.log(`✅ Database: ${DB_NAME}`);
    console.log(`✅ DB Host: ${DB_HOST || '34.31.129.80'}`);
    console.log(`✅ DB User: ${DB_USER}`);
    console.log("==============================================");
  });
}

// Boot
start().catch((err) => {
  console.error("Fatal init error:", err);
  process.exit(1);
});
