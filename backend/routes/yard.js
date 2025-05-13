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

// GET /api/yard - Get user's yard state
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.userId;
  // Get yard
  const yardRes = await pool.query('SELECT * FROM user_yards WHERE user_id = $1', [userId]);
  if (yardRes.rows.length === 0) return res.json({ yard: null });
  const yard = yardRes.rows[0];
  // Get accessories
  const accessoriesRes = await pool.query('SELECT a.* FROM user_yard_accessories uya JOIN accessories a ON uya.accessory_id = a.id WHERE uya.yard_id = $1', [yard.id]);
  // Get food
  const foodRes = await pool.query('SELECT f.* FROM user_yard_food uyf JOIN food f ON uyf.food_id = f.id WHERE uyf.yard_id = $1', [yard.id]);
  // Get birds
  const birdsRes = await pool.query('SELECT b.* FROM user_yard_birds uyb JOIN bird_species b ON uyb.bird_id = b.id WHERE uyb.yard_id = $1', [yard.id]);
  res.json({
    yard: {
      ...yard,
      accessories: accessoriesRes.rows,
      food: foodRes.rows,
      birds: birdsRes.rows
    }
  });
});

// POST /api/yard - Create a new yard (location, name, color, bonusPlus, bonusMinus)
router.post('/', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const { location, name, color, bonusPlus, bonusMinus } = req.body;
  if (!location) return res.status(400).json({ error: 'Location required' });
  // Only allow one yard per user for now
  const exists = await pool.query('SELECT * FROM user_yards WHERE user_id = $1', [userId]);
  if (exists.rows.length > 0) return res.status(409).json({ error: 'Yard already exists' });
  const result = await pool.query(
    `INSERT INTO user_yards (user_id, location, name, color, bonus_plus, bonus_minus)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, location, name || null, color || null, bonusPlus || null, bonusMinus || null]
  );
  res.json({ yard: result.rows[0] });
});

// POST /api/yard/accessory - Place an accessory in the yard
router.post('/accessory', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const { accessory_id } = req.body;
  const yardRes = await pool.query('SELECT * FROM user_yards WHERE user_id = $1', [userId]);
  if (yardRes.rows.length === 0) return res.status(400).json({ error: 'No yard found' });
  const yardId = yardRes.rows[0].id;
  await pool.query('INSERT INTO user_yard_accessories (yard_id, accessory_id) VALUES ($1, $2)', [yardId, accessory_id]);
  res.json({ success: true });
});

// POST /api/yard/food - Place food in the yard
router.post('/food', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const { food_id } = req.body;
  const yardRes = await pool.query('SELECT * FROM user_yards WHERE user_id = $1', [userId]);
  if (yardRes.rows.length === 0) return res.status(400).json({ error: 'No yard found' });
  const yardId = yardRes.rows[0].id;
  await pool.query('INSERT INTO user_yard_food (yard_id, food_id) VALUES ($1, $2)', [yardId, food_id]);
  res.json({ success: true });
});

// POST /api/yard/attract - Attract birds based on current yard state
router.post('/attract', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const yardRes = await pool.query('SELECT * FROM user_yards WHERE user_id = $1', [userId]);
  if (yardRes.rows.length === 0) return res.status(400).json({ error: 'No yard found' });
  const yardId = yardRes.rows[0].id;
  // Get accessories and food in yard
  const accessoriesRes = await pool.query('SELECT accessory_id FROM user_yard_accessories WHERE yard_id = $1', [yardId]);
  const foodRes = await pool.query('SELECT food_id FROM user_yard_food WHERE yard_id = $1', [yardId]);
  const accessoryIds = accessoriesRes.rows.map(r => r.accessory_id);
  const foodIds = foodRes.rows.map(r => r.food_id);
  // Get all birds for the region
  const yard = yardRes.rows[0];
  let query = 'SELECT * FROM bird_species WHERE 1=1';
  let params = [];
  if (yard.location) {
    query += ' AND (region ILIKE $1 OR region IS NULL)';
    params.push(`%${yard.location}%`);
  }
  const birdsRes = await pool.query(query, params);
  // Get effectiveness for all accessories and food in yard
  const accEffRows = await pool.query('SELECT id, effectiveness FROM accessories WHERE id = ANY($1)', [accessoryIds]);
  const foodEffRows = await pool.query('SELECT id, effectiveness FROM food WHERE id = ANY($1)', [foodIds]);
  // Get already attracted birds
  const attractedRes = await pool.query('SELECT bird_id FROM user_yard_birds WHERE yard_id = $1', [yardId]);
  const attractedIds = attractedRes.rows.map(r => r.bird_id);
  // Calculate attraction odds for each bird
  let candidates = [];
  for (const bird of birdsRes.rows) {
    if (attractedIds.includes(bird.id)) continue; // skip already attracted
    let accScore = 0, accCount = 0;
    for (const acc of accEffRows.rows) {
      if (acc.effectiveness && acc.effectiveness[bird.id]) {
        accScore += parseFloat(acc.effectiveness[bird.id]);
        accCount++;
      }
    }
    let foodScore = 0, foodCount = 0;
    for (const f of foodEffRows.rows) {
      if (f.effectiveness && f.effectiveness[bird.id]) {
        foodScore += parseFloat(f.effectiveness[bird.id]);
        foodCount++;
      }
    }
    // Average the scores, penalize if mismatch (no relevant accessory/food)
    let totalScore = 0;
    let denom = 0;
    if (accCount > 0) { totalScore += accScore; denom += accCount; }
    if (foodCount > 0) { totalScore += foodScore; denom += foodCount; }
    if (denom === 0) continue; // can't attract this bird
    let avgScore = totalScore / denom;
    // Slightly penalize if only one type matches
    if (accCount === 0 || foodCount === 0) avgScore *= 0.7;
    candidates.push({ bird, odds: avgScore });
  }
  // Weighted random selection
  const totalOdds = candidates.reduce((sum, c) => sum + c.odds, 0);
  let pick = Math.random() * totalOdds;
  let attracted = null;
  for (const c of candidates) {
    if (pick < c.odds) {
      attracted = c.bird;
      break;
    }
    pick -= c.odds;
  }
  if (attracted) {
    await pool.query('INSERT INTO user_yard_birds (yard_id, bird_id) VALUES ($1, $2)', [yardId, attracted.id]);
    return res.json({ attracted });
  }
  res.json({ attracted: null });
});

// POST /api/yard/purchase - Securely buy and place accessory/food if user has enough coins
router.post('/purchase', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const { itemType, itemId, price } = req.body; // itemType: 'accessory' or 'food'
  if (!['accessory', 'food'].includes(itemType)) return res.status(400).json({ error: 'Invalid item type' });
  // Get user coins
  const userRes = await pool.query('SELECT pup_coins FROM users WHERE id = $1', [userId]);
  if (userRes.rows.length === 0) return res.status(400).json({ error: 'User not found' });
  const coins = userRes.rows[0].pup_coins;
  if (coins < price) return res.status(400).json({ error: 'Not enough Pup Coins' });
  // Deduct coins
  await pool.query('UPDATE users SET pup_coins = pup_coins - $1 WHERE id = $2', [price, userId]);
  // Place item in yard
  const yardRes = await pool.query('SELECT id FROM user_yards WHERE user_id = $1', [userId]);
  if (yardRes.rows.length === 0) return res.status(400).json({ error: 'No yard found' });
  const yardId = yardRes.rows[0].id;
  if (itemType === 'accessory') {
    await pool.query('INSERT INTO user_yard_accessories (yard_id, accessory_id) VALUES ($1, $2)', [yardId, itemId]);
  } else if (itemType === 'food') {
    await pool.query('INSERT INTO user_yard_food (yard_id, food_id) VALUES ($1, $2)', [yardId, itemId]);
  }
  res.json({ success: true });
});

// GET /api/yard/coins - Get user's pup coin balance
router.get('/coins', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const userRes = await pool.query('SELECT pup_coins FROM users WHERE id = $1', [userId]);
  if (userRes.rows.length === 0) return res.status(400).json({ error: 'User not found' });
  res.json({ pup_coins: userRes.rows[0].pup_coins });
});

// POST /api/yard/earn-coins - Add coins to user (for mini-game)
router.post('/earn-coins', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const { amount } = req.body;
  if (!amount || amount < 1) return res.status(400).json({ error: 'Invalid amount' });
  await pool.query('UPDATE users SET pup_coins = pup_coins + $1 WHERE id = $2', [amount, userId]);
  const userRes = await pool.query('SELECT pup_coins FROM users WHERE id = $1', [userId]);
  res.json({ pup_coins: userRes.rows[0].pup_coins });
});

export default router;
