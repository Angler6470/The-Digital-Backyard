import express from 'express';
import pool from '../db/connection.js';
import jwt from 'jsonwebtoken';
const router = express.Router();

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// GET /api/accessories
router.get('/', authenticate, async (req, res) => {
  const result = await pool.query('SELECT * FROM accessories ORDER BY id');
  res.json({ accessories: result.rows });
});

// GET /api/accessories/:id
router.get('/:id', authenticate, async (req, res) => {
  const result = await pool.query('SELECT * FROM accessories WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

export default router;
