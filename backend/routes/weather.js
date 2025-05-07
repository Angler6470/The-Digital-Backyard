import express from 'express';
import fetch from 'node-fetch';
const router = express.Router();

// Example: GET /api/weather/ping
router.get('/ping', (req, res) => {
  res.json({ message: 'Weather route working!' });
});

// GET /api/weather?location=city,state,country
router.get('/', async (req, res) => {
  const { location } = req.query;
  if (!location) return res.status(400).json({ error: 'Location required' });
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Weather API key not set' });
  try {
    // Use OpenWeatherMap Geocoding API to get lat/lon
    const geoResp = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`);
    const geoData = await geoResp.json();
    if (!geoData[0]) return res.status(404).json({ error: 'Location not found' });
    const { lat, lon } = geoData[0];
    // Get current weather
    const weatherResp = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`);
    const weatherData = await weatherResp.json();
    // Get local time (OpenWeatherMap returns timezone offset in seconds)
    const nowUTC = new Date();
    const localTime = new Date(nowUTC.getTime() + 1000 * weatherData.timezone);
    // Determine day/night
    const isDay = localTime > new Date(weatherData.sys.sunrise * 1000) && localTime < new Date(weatherData.sys.sunset * 1000);
    res.json({
      weather: weatherData.weather[0].main,
      temp: weatherData.main.temp,
      isDay,
      localTime: localTime.toISOString(),
      sunrise: new Date(weatherData.sys.sunrise * 1000).toISOString(),
      sunset: new Date(weatherData.sys.sunset * 1000).toISOString(),
      location: geoData[0].name
    });
  } catch (err) {
    res.status(500).json({ error: 'Weather API error' });
  }
});

export default router;
