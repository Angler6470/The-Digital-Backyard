// File: server.js
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// OpenAI Configuration (v4)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Ensure tables exist
const initializeDb = async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT,
    timezone TEXT
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS plants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    nickname TEXT,
    species TEXT,
    location TEXT,
    last_watered DATE,
    watering_freq_days INTEGER
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS care_logs (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER REFERENCES plants(id),
    date DATE,
    type TEXT,
    notes TEXT
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS digital_plants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    species TEXT NOT NULL,
    nickname TEXT,
    happiness INTEGER DEFAULT 100,
    thirst_level INTEGER DEFAULT 0,
    sunlight_level INTEGER DEFAULT 0,
    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stage TEXT DEFAULT 'Seedling'
  )`);
};

initializeDb().catch(err => console.error('Error initializing DB', err));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get plants by user ID
app.get('/plants/:userId', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM plants WHERE user_id = $1', [req.params.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Add a new plant
app.post('/plant', async (req, res) => {
  const { user_id, nickname, species, location, last_watered, watering_freq_days } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO plants (user_id, nickname, species, location, last_watered, watering_freq_days)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [user_id, nickname, species, location, last_watered, watering_freq_days]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Add a new digital plant
app.post('/digital-plant', async (req, res) => {
  const { user_id, species, nickname } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO digital_plants (user_id, species, nickname)
       VALUES ($1, $2, $3) RETURNING *`,
      [user_id, species, nickname]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GPT-powered plant care tip endpoint using OpenAI v4
app.post('/plant-tips', async (req, res) => {
  const { nickname, species, issue } = req.body;
  try {
    const prompt = `Give personalized care advice for a plant named "${nickname}" (${species}). The owner says: "${issue}".`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const tip = response.choices[0].message.content;
    res.json({ tip });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GPT-powered plant profile endpoint with code block strip
app.post("/plant-profile", async (req, res) => {
  const { species, environment } = req.body;

  const prompt = `You are a plant care expert. Provide a care profile for a ${species} kept in ${environment} conditions. Include:
- How often it should be watered (in hours)
- How often it should get sunlight (in hours)
- Type of sunlight it prefers (e.g. direct, indirect, shade)
- Ideal temperature range (°F)
- Minimum and maximum daily sunlight exposure in hours
- Risk or damage from overexposure (e.g. leaf burn)
- Evolving care needs across growth stages (Seed, Seedling, Sprout, Bud, Bloom, Mature)

Respond in JSON format with these keys: waterInterval, sunInterval, sunlightType, minLightHours, maxLightHours, sunRisk, tempRange, stageNeeds.`;

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful plant care assistant." },
        { role: "user", content: prompt }
      ]
    });

    let jsonText = chat.choices[0].message.content.trim();

    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```(?:json)?/gi, "").replace(/```$/, "").trim();
    }

    const clean = JSON.parse(jsonText);
    res.json(clean);
  } catch (err) {
    console.error("Error fetching GPT plant profile:", err);
    res.status(500).json({ error: "Failed to get plant care data." });
  }
});

app.listen(PORT, () => console.log(`PlantPal server running on port ${PORT}`));
