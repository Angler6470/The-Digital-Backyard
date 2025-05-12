import express from 'express';
import pool from '../db/connection.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
const router = express.Router();

// Middleware to authenticate user
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

// Example: GET /api/birds/ping
router.get('/ping', (req, res) => {
  res.json({ message: 'Birds route working!' });
});

// GET /api/birds?location=...&accessories=...&food=...
router.get('/', authenticate, async (req, res) => {
  const { location, accessories, food } = req.query;
  // accessories, food: comma-separated ids
  let query = 'SELECT * FROM bird_species WHERE 1=1';
  let params = [];
  if (location) {
    query += ' AND (region ILIKE $1 OR region IS NULL)';
    params.push(`%${location}%`);
  }
  // Optionally filter by food/accessories (advanced: join with effectiveness)
  // For now, just return all birds for the region
  const result = await pool.query(query, params);
  res.json({ birds: result.rows });
});

// GET /api/birds/:id
router.get('/:id', authenticate, async (req, res) => {
  const result = await pool.query('SELECT * FROM bird_species WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// Public endpoint to serve static bird encyclopedia data
router.get('/encyclopedia', (req, res) => {
  const birdsPath = path.join(process.cwd(), 'backend', 'birds.json');
  if (!fs.existsSync(birdsPath)) {
    return res.status(404).json({ error: 'Bird encyclopedia not found' });
  }
  const data = fs.readFileSync(birdsPath, 'utf-8');
  res.json(JSON.parse(data));
});

export default router;
