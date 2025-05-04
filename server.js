// --- Backend (Express.js) ---
// File: server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// SQLite DB
const db = new sqlite3.Database('./plantpal.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    timezone TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    nickname TEXT,
    species TEXT,
    location TEXT,
    last_watered TEXT,
    watering_freq_days INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS care_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id INTEGER,
    date TEXT,
    type TEXT,
    notes TEXT,
    FOREIGN KEY(plant_id) REFERENCES plants(id)
  )`);
});

app.get('/plants/:userId', (req, res) => {
  db.all("SELECT * FROM plants WHERE user_id = ?", [req.params.userId], (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

app.post('/plant', (req, res) => {
  const { user_id, nickname, species, location, last_watered, watering_freq_days } = req.body;
  db.run("INSERT INTO plants (user_id, nickname, species, location, last_watered, watering_freq_days) VALUES (?, ?, ?, ?, ?, ?)",
    [user_id, nickname, species, location, last_watered, watering_freq_days],
    function (err) {
      if (err) return res.status(500).send(err);
      res.json({ id: this.lastID });
    });
});

app.listen(PORT, () => console.log(`PlantPal server running on port ${PORT}`));
