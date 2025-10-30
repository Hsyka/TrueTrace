// server.js
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---- DB pool ----
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Health check endpoint
app.get("/test-db", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    res.json({ status: "connected", timestamp: rows[0].now });
  } catch (err) {
    console.error("DB test error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---- PRODUCTS API ----
app.get("/api/products", async (_req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT ProductID as id, SKU as sku, ProductName as name, Description as description, 
             Category as category, UnitPrice as price, ImageUrl as imageUrl, qty as quantity
      FROM products 
      ORDER BY ProductID DESC
    `);
    res.json({ products: rows });
  } catch (err) {
    console.error("Get products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT ProductID as id, SKU as sku, ProductName as name, Description as description, 
             Category as category, UnitPrice as price, ImageUrl as imageUrl, qty as quantity
      FROM products 
      WHERE ProductID = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json({ product: rows[0] });
  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const { sku, name, description, category, price, imageUrl, quantity } = req.body;
    
    if (!sku || !name || !category || !price) {
      return res.status(400).json({ error: "Missing required fields (sku, name, category, price)" });
    }
    
    const [result] = await pool.execute(`
      INSERT INTO products (SKU, ProductName, Description, Category, UnitPrice, ImageUrl, qty)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [sku, name, description, category, price, imageUrl, quantity || 0]);
    
    res.status(201).json({ 
      message: "Product created successfully", 
      productId: result.insertId 
    });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));