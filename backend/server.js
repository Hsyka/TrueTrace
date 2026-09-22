// backend/server.js
// SQL Server version — rewritten from the Google Cloud SQL / mysql2 original as a base for
// Azure deployment. Local dev connects over plain TCP to SQL Server; when this moves to Azure
// SQL, only the .env values (DB_ENCRYPT=true, DB_TRUST_CERT=false, real host) need to change.
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import sql from "mssql";

// Auth route modules (must exist in the same folder)
import makeGoogleAuthRoutes from "./auth-google.js";
import makePasswordAuthRoutes from "./auth-password.js";

dotenv.config();

async function start() {
  const app = express();

  /* --------------------------- CORS (IMPORTANT) --------------------------- */
  // localhost:3000 covers local frontend dev. FRONTEND_ORIGIN is for deployed frontends
  // (e.g. your future Azure Static Web Apps URL) — set it as a comma-separated list in
  // the App Service Application Settings once that's live, e.g.:
  //   FRONTEND_ORIGIN=https://your-app.azurestaticapps.net,https://your-custom-domain.com
  const allowedOrigins = [
    "http://localhost:3000",
    ...(process.env.FRONTEND_ORIGIN?.split(",").map((o) => o.trim()).filter(Boolean) || []),
  ];
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

  /* ----------------------------- DB Connection ----------------------------- */
  const {
    DB_SERVER,
    DB_PORT,
    DB_USER,
    DB_PASS,
    DB_NAME,
    DB_ENCRYPT,
    DB_TRUST_CERT,
  } = process.env;

  if (!DB_USER || !DB_PASS || !DB_NAME) {
    console.error("Missing one or more DB env vars.", {
      DB_SERVER: !!DB_SERVER,
      DB_USER: !!DB_USER,
      DB_PASS: !!DB_PASS,
      DB_NAME,
    });
    process.exit(1);
  }

  const sqlConfig = {
    server: DB_SERVER || "localhost",
    port: Number(DB_PORT || 1433),
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: (DB_ENCRYPT || "false") === "true",              // set true for Azure SQL
      trustServerCertificate: (DB_TRUST_CERT || "true") === "true", // fine locally; set false on Azure
    },
  };

  console.log("Database config:", {
    server: sqlConfig.server,
    port: sqlConfig.port,
    user: sqlConfig.user,
    database: sqlConfig.database,
  });

  const pool = await new sql.ConnectionPool(sqlConfig)
    .connect()
    .catch((err) => {
      console.warn("⚠️ Database connection failed:", err.message);
      throw err;
    });

  // Test the connection on startup
  pool
    .request()
    .query("SELECT SYSUTCDATETIME() AS now")
    .then((result) => {
      console.log("✅ Database connection successful");
      console.log("✅ Database query successful:", result.recordset[0].now);
    })
    .catch((err) => {
      console.warn("⚠️ Database query failed:", err.message);
    });

  /* ------------------------------ Health / Debug --------------------------- */
  app.get("/api/ping", (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true });
  });

  app.get("/api/test-db", async (_req, res) => {
    try {
      const result = await pool.request().query("SELECT SYSUTCDATETIME() AS now");
      res.json({ status: "connected", now: result.recordset[0]?.now });
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
      const result = await pool.request().query(`
        SELECT
          ProductID   AS id,
          SKU         AS sku,
          ProductName AS name,
          Category    AS category,
          UnitPrice   AS price,
          ImageUrl    AS imageUrl,
          Description AS description,
          qty         AS quantity
        FROM dbo.products
        ORDER BY ProductID DESC
      `);
      res.json(result.recordset);
    } catch (e) {
      console.error("Products error:", e);
      res.status(500).json({
        error: "Failed to load products",
        code: e.code || null,
        sqlMessage: e.originalError?.message || e.message || null,
      });
    }
  });

  // Create new product
  app.post("/api/products", async (req, res) => {
    try {
      const { name, sku, description, category, price, quantity, imageUrl } = req.body;

      // Validate required fields
      if (!name || !sku) {
        return res.status(400).json({
          error: "Name and SKU are required fields",
        });
      }

      // Validate price and quantity
      const parsedPrice = parseFloat(price) || 0;
      const parsedQuantity = parseInt(quantity) || 0;

      if (parsedPrice < 0) {
        return res.status(400).json({
          error: "Price must be a positive number",
        });
      }

      if (parsedQuantity < 0) {
        return res.status(400).json({
          error: "Quantity must be a positive number",
        });
      }

      // Check if SKU already exists
      const existingSku = await pool
        .request()
        .input("sku", sql.NVarChar(32), sku)
        .query("SELECT SKU FROM dbo.products WHERE SKU = @sku");

      if (existingSku.recordset.length > 0) {
        return res.status(400).json({
          error: "A product with this SKU already exists",
        });
      }

      // Insert new product; OUTPUT INSERTED.ProductID replaces mysql2's result.insertId
      const insertResult = await pool
        .request()
        .input("name", sql.NVarChar(100), name)
        .input("sku", sql.NVarChar(32), sku)
        .input("description", sql.NVarChar(sql.MAX), description || null)
        .input("category", sql.NVarChar(50), category || null)
        .input("price", sql.Decimal(10, 2), parsedPrice)
        .input("qty", sql.Int, parsedQuantity)
        .input("imageUrl", sql.NVarChar(255), imageUrl || null)
        .query(
          `INSERT INTO dbo.products (ProductName, SKU, Description, Category, UnitPrice, qty, ImageUrl)
           OUTPUT INSERTED.ProductID
           VALUES (@name, @sku, @description, @category, @price, @qty, @imageUrl)`
        );
      const newId = insertResult.recordset[0].ProductID;

      // Return the created product
      const newProduct = await pool
        .request()
        .input("id", sql.Int, newId)
        .query(
          `SELECT
            ProductID   AS id,
            SKU         AS sku,
            ProductName AS name,
            Category    AS category,
            UnitPrice   AS price,
            ImageUrl    AS imageUrl,
            Description AS description,
            qty         AS quantity
          FROM dbo.products
          WHERE ProductID = @id`
        );

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: newProduct.recordset[0],
      });
    } catch (e) {
      console.error("Product creation error:", e);
      res.status(500).json({
        error: "Failed to create product",
        code: e.code || null,
        sqlMessage: e.originalError?.message || e.message || null,
      });
    }
  });

  // Update complete product
  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, sku, description, category, price, quantity, imageUrl } = req.body;

      // Check if product exists
      const existing = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT ProductID, SKU FROM dbo.products WHERE ProductID = @id");

      if (existing.recordset.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Validate required fields
      if (!name || !sku) {
        return res.status(400).json({
          error: "Name and SKU are required fields",
        });
      }

      // Validate price and quantity
      const parsedPrice = parseFloat(price) || 0;
      const parsedQuantity = parseInt(quantity) || 0;

      if (parsedPrice < 0) {
        return res.status(400).json({
          error: "Price must be a positive number",
        });
      }

      if (parsedQuantity < 0) {
        return res.status(400).json({
          error: "Quantity must be a positive number",
        });
      }

      // Check if SKU already exists for a different product
      if (sku !== existing.recordset[0].SKU) {
        const existingSku = await pool
          .request()
          .input("sku", sql.NVarChar(32), sku)
          .input("id", sql.Int, id)
          .query("SELECT SKU FROM dbo.products WHERE SKU = @sku AND ProductID != @id");

        if (existingSku.recordset.length > 0) {
          return res.status(400).json({
            error: "A product with this SKU already exists",
          });
        }
      }

      // Update the product
      await pool
        .request()
        .input("name", sql.NVarChar(100), name)
        .input("sku", sql.NVarChar(32), sku)
        .input("description", sql.NVarChar(sql.MAX), description || null)
        .input("category", sql.NVarChar(50), category || null)
        .input("price", sql.Decimal(10, 2), parsedPrice)
        .input("qty", sql.Int, parsedQuantity)
        .input("imageUrl", sql.NVarChar(255), imageUrl || null)
        .input("id", sql.Int, id)
        .query(
          `UPDATE dbo.products
           SET ProductName = @name, SKU = @sku, Description = @description, Category = @category,
               UnitPrice = @price, qty = @qty, ImageUrl = @imageUrl
           WHERE ProductID = @id`
        );

      // Return the updated product
      const updatedProduct = await pool
        .request()
        .input("id", sql.Int, id)
        .query(
          `SELECT
            ProductID   AS id,
            SKU         AS sku,
            ProductName AS name,
            Category    AS category,
            UnitPrice   AS price,
            ImageUrl    AS imageUrl,
            Description AS description,
            qty         AS quantity
          FROM dbo.products
          WHERE ProductID = @id`
        );

      res.json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct.recordset[0],
      });
    } catch (e) {
      console.error("Product update error:", e);
      res.status(500).json({
        error: "Failed to update product",
        code: e.code || null,
        sqlMessage: e.originalError?.message || e.message || null,
      });
    }
  });

  // Delete product
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Check if product exists
      const existing = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT ProductID, ProductName FROM dbo.products WHERE ProductID = @id");

      if (existing.recordset.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Delete the product
      await pool.request().input("id", sql.Int, id).query("DELETE FROM dbo.products WHERE ProductID = @id");

      res.json({
        success: true,
        message: `Product "${existing.recordset[0].ProductName}" deleted successfully`,
        deletedId: id,
      });
    } catch (e) {
      console.error("Product deletion error:", e);
      res.status(500).json({
        error: "Failed to delete product",
        code: e.code || null,
        sqlMessage: e.originalError?.message || e.message || null,
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
          error: "Invalid operation. Must be 'add', 'remove', or 'set'",
        });
      }

      const parsedAmount = parseInt(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({
          error: "Invalid amount. Must be a positive number",
        });
      }

      // Get current quantity
      const current = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT qty FROM dbo.products WHERE ProductID = @id");

      if (current.recordset.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      let newQuantity;
      const currentQty = current.recordset[0].qty;

      // Calculate new quantity based on operation
      if (operation === "add") {
        newQuantity = currentQty + parsedAmount;
      } else if (operation === "remove") {
        newQuantity = Math.max(0, currentQty - parsedAmount); // Don't go below 0
      } else if (operation === "set") {
        newQuantity = parsedAmount;
      }

      // Update the quantity
      await pool
        .request()
        .input("qty", sql.Int, newQuantity)
        .input("id", sql.Int, id)
        .query("UPDATE dbo.products SET qty = @qty WHERE ProductID = @id");

      // Return updated product
      const updated = await pool
        .request()
        .input("id", sql.Int, id)
        .query(
          `SELECT
            ProductID   AS id,
            SKU         AS sku,
            ProductName AS name,
            Category    AS category,
            UnitPrice   AS price,
            ImageUrl    AS imageUrl,
            Description AS description,
            qty         AS quantity
          FROM dbo.products
          WHERE ProductID = @id`
        );

      res.json({
        success: true,
        message: `Stock ${operation === "set" ? "updated" : operation === "add" ? "increased" : "decreased"} successfully`,
        product: updated.recordset[0],
        previousQuantity: currentQty,
        newQuantity: newQuantity,
      });
    } catch (e) {
      console.error("Stock update error:", e);
      res.status(500).json({
        error: "Failed to update stock",
        code: e.code || null,
        sqlMessage: e.originalError?.message || e.message || null,
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
    console.log(`✅ DB Server: ${DB_SERVER || "localhost"}`);
    console.log(`✅ DB User: ${DB_USER}`);
    console.log("==============================================");
  });
}

// Boot
start().catch((err) => {
  console.error("Fatal init error:", err);
  process.exit(1);
});
