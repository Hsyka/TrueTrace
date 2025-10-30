// server.js
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---- DB pool ----
const pool = mysql.createPool({
  host: process.env.DB_HOST,        // e.g. 127.0.0.1 when using Cloud SQL Proxy, or your instance public IP
  user: process.env.DB_USER,        // e.g. 'jpirt60' or 'root'
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,    // 'truetrace'
  waitForConnections: true,
  connectionLimit: 10,
});

// ---- Google client ----
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// quick DB ping
app.get("/test-db", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now, DATABASE() AS db");
    res.json(rows[0]);
  } catch (err) {
    console.error("DB test error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---- SIGN-IN: verify token, upsert user, return record ----
app.post("/api/auth/google-login", async (req, res) => {
  console.log("POST /api/auth/google-login hit", { hasToken: !!req.body?.idToken });
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "Missing idToken" });

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload(); // email, name, picture, sub

    const googleId = payload.sub;
    const email = payload.email || null;
    const name = payload.name || null;
    const avatarUrl = payload.picture || null;

    // Upsert into truetrace.users (email & google_id are UNIQUE)
    const upsertSql = `
      INSERT INTO users (email, name, google_id, avatar_url, is_active, last_login)
      VALUES (?, ?, ?, ?, 1, NOW())
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        avatar_url = VALUES(avatar_url),
        is_active = 1,
        last_login = NOW(),
        updated_at = CURRENT_TIMESTAMP
    `;
    await pool.execute(upsertSql, [email, name, googleId, avatarUrl]);

    // Return the user
    const [rows] = await pool.execute(
      `SELECT id, email, name, google_id AS googleId, avatar_url AS avatarUrl,
              is_active AS isActive, last_login AS lastLogin,
              created_at AS createdAt, updated_at AS updatedAt
       FROM users
       WHERE google_id = ? OR email = ?
       LIMIT 1`,
      [googleId, email]
    );

    res.json({ user: rows[0] || null });
  } catch (err) {
    console.error("google-login error:", err);
    res.status(401).json({ error: "Invalid Google token or DB error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
