// backend/auth-google.js
// SQL Server version — pool is now an mssql ConnectionPool instead of a mysql2 pool.
import express from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import sql from "mssql";

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

      // Upsert user into your table.
      // T-SQL has no ON DUPLICATE KEY UPDATE — MERGE keyed on google_id is the equivalent,
      // matching the unique filtered index on users.google_id in the schema.
      await pool
        .request()
        .input("googleId", sql.NVarChar(64), googleId)
        .input("email", sql.NVarChar(255), email)
        .input("name", sql.NVarChar(255), name)
        .input("avatar", sql.NVarChar(512), avatar)
        .query(
          `MERGE dbo.users AS target
           USING (SELECT @googleId AS google_id) AS src
             ON target.google_id = src.google_id
           WHEN MATCHED THEN
             UPDATE SET name = @name, avatar_url = @avatar, last_login = SYSUTCDATETIME()
           WHEN NOT MATCHED THEN
             INSERT (google_id, email, name, avatar_url, is_active, last_login)
             VALUES (@googleId, @email, @name, @avatar, 1, SYSUTCDATETIME());`
        );

      const rows = await pool
        .request()
        .input("googleId", sql.NVarChar(64), googleId)
        .query("SELECT TOP 1 id, email, name, avatar_url FROM dbo.users WHERE google_id = @googleId");
      const user = rows.recordset[0];

      // Issue session cookie (httpOnly)
      const token = jwt.sign({ uid: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.cookie("tt_token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true, // true when behind HTTPS
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
