// backend/auth-google.js
import express from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const router = express.Router();

export default function makeGoogleAuthRoutes(pool) {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  router.post("/google-login", async (req, res) => {
    try {
      const { idToken } = req.body;
      if (!idToken) return res.status(400).json({ error: "Missing idToken" });

      // Verify Google token
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload(); // sub, email, name, picture, email_verified

      const googleId = payload.sub;
      const email = (payload.email || "").toLowerCase();
      const name = payload.name || null;
      const avatar = payload.picture || null;

      if (!email) return res.status(400).json({ error: "Google token had no email" });

      // Upsert user into your table
      const sql = `
        INSERT INTO users (google_id, email, name, avatar_url, is_active, last_login)
        VALUES (?, ?, ?, ?, 1, NOW())
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          avatar_url = VALUES(avatar_url),
          last_login = NOW()
      `;
      await pool.query(sql, [googleId, email, name, avatar]);

      const [rows] = await pool.query(
        "SELECT id, email, name, avatar_url FROM users WHERE google_id = ? LIMIT 1",
        [googleId]
      );
      const user = rows[0];

      // Issue session cookie (httpOnly)
      const token = jwt.sign({ uid: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.cookie("tt_token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,           // true when behind HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ user });
    } catch (err) {
      console.error("Google login error:", err);
      res.status(401).json({ error: "Invalid Google token" });
    }
  });

  return router;
}
