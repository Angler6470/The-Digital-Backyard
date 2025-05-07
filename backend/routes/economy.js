import express from 'express';
const router = express.Router();

// Example: GET /api/economy/ping
router.get('/ping', (req, res) => {
  res.json({ message: 'Economy route working!' });
});

export default router;
