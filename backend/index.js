// Express server setup for Virtual Backyard Bird Sanctuary
import dotenv from 'dotenv'; dotenv.config();
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.js';
import birdsRoutes from './routes/birds.js';
import economyRoutes from './routes/economy.js';
import weatherRoutes from './routes/weather.js';
import accessoriesRoutes from './routes/accessories.js';
import foodRoutes from './routes/food.js';
import shopRoutes from './routes/shop.js';
import yardRoutes from './routes/yard.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/birds', birdsRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/accessories', accessoriesRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/yard', yardRoutes);

app.get('/', (req, res) => {
  res.send('Virtual Backyard Bird Sanctuary API running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
