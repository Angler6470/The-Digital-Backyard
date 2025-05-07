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

// GET /api/shop/accessories - List all accessories for shop
router.get('/accessories', authenticate, async (req, res) => {
  const result = await pool.query('SELECT id, name, type, image FROM accessories ORDER BY id');
  res.json({ accessories: result.rows });
});

// GET /api/shop/food - List all food for shop
router.get('/food', authenticate, async (req, res) => {
  const result = await pool.query('SELECT id, name, type, image FROM food ORDER BY id');
  res.json({ food: result.rows });
});

// GET /api/shop/inventory - Get user's owned accessories and food
router.get('/inventory', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const yardRes = await pool.query('SELECT id FROM user_yards WHERE user_id = $1', [userId]);
  if (yardRes.rows.length === 0) return res.json({ accessories: [], food: [] });
  const yardId = yardRes.rows[0].id;
  const accRes = await pool.query('SELECT a.id, a.name, a.type, a.image FROM user_yard_accessories uya JOIN accessories a ON uya.accessory_id = a.id WHERE uya.yard_id = $1', [yardId]);
  const foodRes = await pool.query('SELECT f.id, f.name, f.type, f.image FROM user_yard_food uyf JOIN food f ON uyf.food_id = f.id WHERE uyf.yard_id = $1', [yardId]);
  res.json({ accessories: accRes.rows, food: foodRes.rows });
});

export default router;
