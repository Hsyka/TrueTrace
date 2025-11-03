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

  /* -------------------------- Cloud SQL (Connector) ------------------------ */
  // Uses IAM to connect; no DB_HOST or socketPath needed.
  // backend/server.js (DB section)

// Remove: import { Connector } from "@google-cloud/cloud-sql-connector";
// …and all the connector code

const {
  INSTANCE_CONNECTION_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

if (!INSTANCE_CONNECTION_NAME || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error("Missing one or more DB env vars.", {
    INSTANCE_CONNECTION_NAME,
    DB_USER: !!DB_USER,
    DB_PASSWORD: !!DB_PASSWORD,
    DB_NAME,
  });
  process.exit(1);
}

// Use the Cloud Run + Cloud SQL integration via socket
const pool = mysql.createPool({
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  socketPath: `/cloudsql/${INSTANCE_CONNECTION_NAME}`, // <— key line
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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
    console.log(`✅ Using Cloud SQL connector to ${INSTANCE_CONNECTION_NAME}`);
    console.log(`✅ DB: ${DB_NAME}  User: ${DB_USER}`);
    console.log("==============================================");
  });
}

// Boot
start().catch((err) => {
  console.error("Fatal init error:", err);
  process.exit(1);
});
