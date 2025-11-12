// backend/server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { Connector } from "@google-cloud/cloud-sql-connector"; // (unused directly, but ok to keep)

// Auth route modules (must exist in the same folder)
import makeGoogleAuthRoutes from "./auth-google.js";
import makePasswordAuthRoutes from "./auth-password.js";

dotenv.config();

async function start() {
  const app = express();

  /* --------------------------- CORS (IMPORTANT) --------------------------- */
  const allowedOrigins = [
    "http://localhost:3000",
    "https://storage.googleapis.com",
    "https://truetrace.storage.googleapis.com",
    process.env.FRONTEND_ORIGIN?.trim(),
  ].filter(Boolean);

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true); // allow server-to-server, curl, health checks
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-email"],
    })
  );
  app.options("*", cors({ origin: allowedOrigins, credentials: true })); // fast preflight

  /* ------------------------------- Middleware ------------------------------ */
  app.use(cookieParser());
  app.use(express.json());

  /* -------------------------- Cloud SQL Connection ------------------------ */
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

  const isCloudRun = !!INSTANCE_CONNECTION_NAME && !DB_HOST;
  let pool;

  if (isCloudRun) {
    // Cloud Run: Unix socket
    console.log("Using Cloud Run socket connection");
    pool = mysql.createPool({
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      socketPath: `/cloudsql/${INSTANCE_CONNECTION_NAME}`,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4",
    });
  } else {
    // Local dev: TCP
    console.log("Using TCP connection for local development");
    const dbConfig = {
      host: DB_HOST || "34.31.129.80",
      port: 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      charset: "utf8mb4",
      ssl: { rejectUnauthorized: false },
    };

    console.log("Database config:", {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
    });

    pool = mysql.createPool(dbConfig);
  }

  // Test the connection on startup
  pool
    .getConnection()
    .then((connection) => {
      console.log("✅ Database connection successful");
      connection
        .query("SELECT NOW() as now")
        .then(([result]) => {
          console.log("✅ Database query successful:", result[0].now);
          connection.release();
        })
        .catch((err) => {
          console.warn("⚠️ Database query failed:", err);
        });
    })
    .catch((err) => {
      console.warn("⚠️ Database connection failed:", err);
    });

  /* ------------------------- Audit helper (IMPORTANT) ---------------------- */
  /**
   * Runs your write(s) on a single connection after setting
   * @app_user_id and @app_user_email so triggers can record the actor.
   * Usage: await runWithAudit(req.user, async (conn) => { ...writes... })
   */
  async function runWithAudit(user, fn) {
    const conn = await pool.getConnection();
    try {
      await conn.query("SET @app_user_id = ?", [user?.id ?? null]);
      await conn.query("SET @app_user_email = ?", [user?.email ?? null]);
      return await fn(conn);
    } finally {
      conn.release();
    }
  }

  /**
   * If your auth middleware sets req.user already, great.
   * This fallback lets you test by sending headers:
   *   x-user-id, x-user-email
   */
  app.use((req, _res, next) => {
    if (!req.user) {
      const id = req.header("x-user-id");
      const email = req.header("x-user-email");
      if (id || email) req.user = { id: id ? Number(id) : null, email };
    }
    next();
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
  // Auth routes (unchanged)
  app.use("/api/auth", makeGoogleAuthRoutes(pool));
  app.use("/api/auth", makePasswordAuthRoutes(pool));

  /* -------------------------- Products READ (list) ------------------------- */
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

  /* --------------------------- Products CREATE ----------------------------- */
  app.post("/api/products", async (req, res) => {
    try {
      const { name, sku, description, category, price, quantity, imageUrl } = req.body;

      if (!name || !sku) {
        return res.status(400).json({ error: "Name and SKU are required fields" });
      }

      const parsedPrice = parseFloat(price) || 0;
      const parsedQuantity = parseInt(quantity) || 0;
      if (parsedPrice < 0) return res.status(400).json({ error: "Price must be a positive number" });
      if (parsedQuantity < 0) return res.status(400).json({ error: "Quantity must be a positive number" });

      const result = await runWithAudit(req.user, async (conn) => {
        // Check SKU uniqueness
        const [existingSku] = await conn.query(
          "SELECT SKU FROM products WHERE SKU = ?",
          [sku]
        );
        if (existingSku.length > 0) {
          throw new Error("A product with this SKU already exists");
        }

        const [r] = await conn.query(
          `INSERT INTO products (ProductName, SKU, Description, Category, UnitPrice, qty, ImageUrl)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [name, sku, description || null, category || null, parsedPrice, parsedQuantity, imageUrl || null]
        );
        return r;
      });

      const [newProduct] = await pool.query(
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
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: newProduct[0],
      });
    } catch (e) {
      console.error("Product creation error:", e);
      const msg = e.sqlMessage || e.message || "Failed to create product";
      res.status(400).json({ error: msg });
    }
  });

  /* --------------------------- Products UPDATE ----------------------------- */
  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, sku, description, category, price, quantity, imageUrl } = req.body;

      if (!name || !sku) {
        return res.status(400).json({ error: "Name and SKU are required fields" });
      }

      const parsedPrice = parseFloat(price) || 0;
      const parsedQuantity = parseInt(quantity) || 0;
      if (parsedPrice < 0) return res.status(400).json({ error: "Price must be a positive number" });
      if (parsedQuantity < 0) return res.status(400).json({ error: "Quantity must be a positive number" });

      await runWithAudit(req.user, async (conn) => {
        // Ensure product exists
        const [existing] = await conn.query(
          "SELECT ProductID, SKU FROM products WHERE ProductID = ?",
          [id]
        );
        if (existing.length === 0) throw new Error("Product not found");

        // SKU uniqueness if changed
        if (sku !== existing[0].SKU) {
          const [existingSku] = await conn.query(
            "SELECT SKU FROM products WHERE SKU = ? AND ProductID != ?",
            [sku, id]
          );
          if (existingSku.length > 0) throw new Error("A product with this SKU already exists");
        }

        await conn.query(
          `UPDATE products 
           SET ProductName = ?, SKU = ?, Description = ?, Category = ?, 
               UnitPrice = ?, qty = ?, ImageUrl = ?
           WHERE ProductID = ?`,
          [name, sku, description || null, category || null, parsedPrice, parsedQuantity, imageUrl || null, id]
        );
      });

      const [updatedProduct] = await pool.query(
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
        message: "Product updated successfully",
        product: updatedProduct[0],
      });
    } catch (e) {
      console.error("Product update error:", e);
      const msg = e.sqlMessage || e.message || "Failed to update product";
      res.status(400).json({ error: msg });
    }
  });

  /* --------------------------- Products DELETE ----------------------------- */
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await runWithAudit(req.user, async (conn) => {
        const [existing] = await conn.query(
          "SELECT ProductID, ProductName FROM products WHERE ProductID = ?",
          [id]
        );
        if (existing.length === 0) throw new Error("Product not found");

        await conn.query("DELETE FROM products WHERE ProductID = ?", [id]);

        // You could return the deleted name here if needed by UI
      });

      res.json({
        success: true,
        message: "Product deleted successfully",
        deletedId: id,
      });
    } catch (e) {
      console.error("Product deletion error:", e);
      const msg = e.sqlMessage || e.message || "Failed to delete product";
      res.status(400).json({ error: msg });
    }
  });

  /* --------------------------- Product STOCK PATCH ------------------------- */
  app.post("/api/products/:id/stock", async (req, res) => {
    try {
      const { id } = req.params;
      const { operation, amount } = req.body;

      if (!operation || !["add", "remove", "set"].includes(operation)) {
        return res.status(400).json({ error: "Invalid operation. Must be 'add', 'remove', or 'set'" });
      }
      const parsedAmount = parseInt(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({ error: "Invalid amount. Must be a positive number" });
      }

      let updatedRow = null;
      let previousQuantity = null;
      let newQuantity = null;

      await runWithAudit(req.user, async (conn) => {
        const [current] = await conn.query(
          "SELECT qty FROM products WHERE ProductID = ?",
          [id]
        );
        if (current.length === 0) throw new Error("Product not found");

        previousQuantity = current[0].qty;

        if (operation === "add") newQuantity = previousQuantity + parsedAmount;
        else if (operation === "remove") newQuantity = Math.max(0, previousQuantity - parsedAmount);
        else newQuantity = parsedAmount;

        await conn.query("UPDATE products SET qty = ? WHERE ProductID = ?", [newQuantity, id]);

        const [after] = await conn.query(
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
        updatedRow = after[0];
      });

      res.json({
        success: true,
        message:
          `Stock ${operation === "set" ? "updated" : operation === "add" ? "increased" : "decreased"} successfully`,
        product: updatedRow,
        previousQuantity,
        newQuantity,
      });
    } catch (e) {
      console.error("Stock update error:", e);
      const msg = e.sqlMessage || e.message || "Failed to update stock";
      res.status(400).json({ error: msg });
    }
  });

  /* ----------------------------- Changes Feed ------------------------------ */
  // Reads from v_changes (created by your SQL earlier)
  app.get("/api/changes", async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const offset = Number(req.query.offset ?? 0);
    const { table, action, actor, since } = req.query;

    const where = [];
    const args = [];

    if (table) { where.push("table_name = ?"); args.push(table); }
    if (action) { where.push("action = ?"); args.push(String(action).toUpperCase()); }
    if (actor) { where.push("changed_by = ?"); args.push(Number(actor)); }
    if (since) { where.push("changed_at >= ?"); args.push(since); }

    const sql = `
      SELECT id, table_name, action, row_pk, changed_at,
             changed_by, actor_name, actor_email, old_data, new_data
      FROM v_changes
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY changed_at DESC
      LIMIT ? OFFSET ?`;

    try {
      const [rows] = await pool.query(sql, [...args, limit, offset]);
      res.json(rows);
    } catch (e) {
      console.error("Changes feed error:", e);
      res.status(500).json({ error: e.message });
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
    console.log(`✅ DB Host: ${DB_HOST || "34.31.129.80"}`);
    console.log(`✅ DB User: ${DB_USER}`);
    console.log("==============================================");
  });
}

// Boot
start().catch((err) => {
  console.error("Fatal init error:", err);
  process.exit(1);
});
