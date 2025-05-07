import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';
import express from 'express';
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Example: GET /api/auth/ping
router.get('/ping', (req, res) => {
  res.json({ message: 'Auth route working!' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid username or password' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username', [username, hash]);
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout (client just deletes token, but endpoint for completeness)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

// Middleware to check admin (for demo: first user is admin)
async function isAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token' });
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    // For demo: user with id=1 is admin
    if (payload.userId !== 1) return res.status(403).json({ error: 'Not admin' });
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// GET all users (admin only)
router.get('/users', isAdmin, async (req, res) => {
  const result = await pool.query('SELECT id, username FROM users ORDER BY id');
  res.json({ users: result.rows });
});

// PUT update user (admin only)
router.put('/users/:id', isAdmin, async (req, res) => {
  const { username, password } = req.body;
  const id = req.params.id;
  if (!username) return res.status(400).json({ error: 'Username required' });
  let query = 'UPDATE users SET username = $1';
  let params = [username];
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    query += ', password_hash = $2 WHERE id = $3';
    params = [username, hash, id];
  } else {
    query += ' WHERE id = $2';
    params = [username, id];
  }
  await pool.query(query, params);
  res.json({ success: true });
});

// DELETE user (admin only)
router.delete('/users/:id', isAdmin, async (req, res) => {
  const id = req.params.id;
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  res.json({ success: true });
});

export default router;
