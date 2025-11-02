import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import makeGoogleAuthRoutes from "./auth-google.js";
import makePasswordAuthRoutes from "./auth-password.js";

dotenv.config();

const app = express();

// ✅ CORS CONFIG — allows both local dev and your hosted GCS site
const allowedOrigins = [
  "http://localhost:3000",
  "https://storage.googleapis.com",  // your deployed React site
  // Add a custom domain if you map one later:
  // "https://truetrace.app",
];

app.use(
  cors({
    origin(origin, cb) {
      // allow requests without Origin (like Postman, curl)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight quickly
app.options("*", cors({ origin: allowedOrigins, credentials: true }));

// ✅ General middleware
app.use(cookieParser());
app.use(express.json());

// ✅ Database pool (Cloud SQL)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// ✅ Test DB endpoint
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    res.json({ status: "connected", now: rows[0].now });
  } catch (err) {
    console.error("DB connection error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Simple ping route to debug CORS
app.get("/api/ping", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ok: true });
});

// ✅ Auth routes (Google + Password)
app.use("/api/auth", makeGoogleAuthRoutes(pool));
app.use("/api/auth", makePasswordAuthRoutes(pool));

// ✅ Default error handling
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ✅ Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
