// backend/auth-password.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

const router = express.Router();

export default function makePasswordAuthRoutes(pool) {
  // Register
  router.post(
    "/register",
    [
      body("email").isEmail().normalizeEmail(),
      body("password").isLength({ min: 8 }),
      body("name").optional().isLength({ max: 255 }),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password, name } = req.body;
      const lowerEmail = email.toLowerCase();

      const [existing] = await pool.query("SELECT id, provider FROM users WHERE email = ? LIMIT 1", [lowerEmail]);
      if (existing.length) {
        return res.status(409).json({ error: `Email already registered via ${existing[0].provider}` });
      }

      const hash = await bcrypt.hash(password, 12);
      const [result] = await pool.query(
        `INSERT INTO users (google_id, email, password_hash, name, provider, is_active, last_login)
         VALUES (NULL, ?, ?, ?, 'password', 1, NOW())`,
        [lowerEmail, hash, name || null]
      );

      const token = jwt.sign({ uid: result.insertId, email: lowerEmail }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.cookie("tt_token", token, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 7 * 24 * 3600 * 1000 });
      res.status(201).json({ user: { id: result.insertId, email: lowerEmail, name: name || null } });
    }
  );

  // Login
  router.post(
    "/login",
    [body("email").isEmail().normalizeEmail(), body("password").isString().isLength({ min: 1 })],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const lowerEmail = email.toLowerCase();

      const [rows] = await pool.query(
        "SELECT id, email, name, password_hash, provider FROM users WHERE email = ? LIMIT 1",
        [lowerEmail]
      );
      const user = rows[0];
      if (!user || user.provider !== "password" || !user.password_hash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const ok = await bcrypt.compare(password, Buffer.from(user.password_hash));
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });

      await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

      const token = jwt.sign({ uid: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.cookie("tt_token", token, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 7 * 24 * 3600 * 1000 });
      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    }
  );

  // Logout
  router.post("/logout", (_req, res) => {
    res.clearCookie("tt_token", { httpOnly: true, sameSite: "lax", secure: true });
    res.json({ ok: true });
  });

  return router;
}
