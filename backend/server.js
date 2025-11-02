// backend/server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Auth route modules (these should exist in the same folder)
import makeGoogleAuthRoutes from "./auth-google.js";
import makePasswordAuthRoutes from "./auth-password.js";

dotenv.config();

const app = express();

/* --------------------------- CORS (VERY IMPORTANT) -------------------------- */
// Exact origins allowed to call the API with cookies.
// Add any custom domain you use later.
const allowedOrigins = [
  "http://localhost:3000",
  "https://storage.googleapis.com",
  // "https://your-custom-domain.com",
];

// One CORS middleware. Do not add another elsewhere.
app.use(
  cors({
    origin(origin, cb) {
      // allow requests without Origin (health checks, curl, server-to-server)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true, // allow cookies
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Fast preflight for all routes
app.options("*", cors({ origin: allowedOrigins, credentials: true }));

/* ------------------------------- Middleware -------------------------------- */
app.use(cookieParser());
app.use(express.json());

/* --------------------------------- Database -------------------------------- */
const pool = mysql.createPool({
  host: process.env.DB_HOST,     // Cloud SQL public IP or connector
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

/* ------------------------------ Health / Debug ----------------------------- */
app.get("/api/ping", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ok: true });
});

app.get("/api/test-db", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    res.json({ status: "connected", now: rows[0].now });
  } catch (err) {
    console.error("DB test error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* --------------------------------- Routes ---------------------------------- */
// Auth (Google + password). These modules must set/clear cookies with:
// { httpOnly: true, sameSite: "none", secure: true }
app.use("/api/auth", makeGoogleAuthRoutes(pool));
app.use("/api/auth", makePasswordAuthRoutes(pool));

/* ------------------------------- Error handler ------------------------------ */
app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// Return products from your table (alias to UI-friendly keys)
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

/* --------------------------------- Server ---------------------------------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
