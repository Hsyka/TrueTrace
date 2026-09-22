// backend/auth-password.js
// SQL Server version — pool is now an mssql ConnectionPool instead of a mysql2 pool.
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import sql from "mssql";

const router = express.Router();

export default function makePasswordAuthRoutes(pool) {
  /**
   * REGISTER  ➜  POST /api/auth/register
   */
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

      try {
        // Check if email already exists
        const existing = await pool
          .request()
          .input("email", sql.NVarChar(255), lowerEmail)
          .query("SELECT TOP 1 id, provider FROM dbo.users WHERE email = @email");
        if (existing.recordset.length) {
          return res
            .status(409)
            .json({ error: `Email already registered via ${existing.recordset[0].provider}` });
        }

        // Hash password
        const hash = await bcrypt.hash(password, 12);

        // Insert new user (note: using password_hash column). google_id stays NULL —
        // the schema's filtered unique index allows many NULLs there, unlike a plain
        // UNIQUE constraint in SQL Server.
        const result = await pool
          .request()
          .input("email", sql.NVarChar(255), lowerEmail)
          .input("hash", sql.NVarChar(255), hash)
          .input("name", sql.NVarChar(255), name || null)
          .query(
            `INSERT INTO dbo.users (google_id, email, password_hash, name, provider, is_active, last_login)
             OUTPUT INSERTED.id
             VALUES (NULL, @email, @hash, @name, 'password', 1, SYSUTCDATETIME())`
          );
        const newId = result.recordset[0].id;

        if (!process.env.JWT_SECRET) {
          console.warn("JWT_SECRET not set; issuing unsigned token fallback for dev only");
        }

        const token = jwt.sign(
          { uid: newId, email: lowerEmail },
          process.env.JWT_SECRET || "dev-only-secret",
          { expiresIn: "7d" }
        );

        res.cookie("tt_token", token, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
          user: { id: newId, email: lowerEmail, name: name || null },
        });
      } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  /**
   * LOGIN  ➜  POST /api/auth/login
   */
  router.post(
    "/login",
    [
      body("email").isEmail().normalizeEmail(),
      body("password").isString().isLength({ min: 1 }),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const lowerEmail = email.toLowerCase();

      try {
        const rows = await pool
          .request()
          .input("email", sql.NVarChar(255), lowerEmail)
          .query("SELECT TOP 1 id, email, name, password_hash, provider FROM dbo.users WHERE email = @email");

        const user = rows.recordset?.[0];
        if (!user || user.provider !== "password" || !user.password_hash) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // password_hash comes back as a plain string from mssql (NVARCHAR column),
        // but keep the same defensive coercion as the original in case that ever changes.
        const storedHash = user.password_hash
          ? (Buffer.isBuffer(user.password_hash)
              ? user.password_hash.toString()
              : String(user.password_hash))
          : "";

        // Optional: guard against non-bcrypt legacy values (shouldn't happen with your schema)
        if (!storedHash.startsWith("$2")) {
          console.error("Unexpected non-bcrypt hash format in password_hash for user id", user.id);
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const ok = await bcrypt.compare(password, storedHash);
        if (!ok) return res.status(401).json({ error: "Invalid credentials" });

        await pool
          .request()
          .input("id", sql.Int, user.id)
          .query("UPDATE dbo.users SET last_login = SYSUTCDATETIME() WHERE id = @id");

        if (!process.env.JWT_SECRET) {
          console.warn("JWT_SECRET not set; issuing unsigned token fallback for dev only");
        }

        const token = jwt.sign(
          { uid: user.id, email: user.email },
          process.env.JWT_SECRET || "dev-only-secret",
          { expiresIn: "7d" }
        );

        res.cookie("tt_token", token, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ user: { id: user.id, email: user.email, name: user.name } });
      } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  /**
   * LOGOUT  ➜  POST /api/auth/logout
   */
  router.post("/logout", (req, res) => {
    try {
      res.clearCookie("tt_token", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.json({ ok: true });
    } catch (err) {
      console.error("Logout error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
}
