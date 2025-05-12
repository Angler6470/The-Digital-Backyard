// Script to fetch bird data from OpenAI and save to birds.json
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BIRDS = [
  'Blue Jay',
  'Cardinal',
  // Add more bird species as needed
];

const birdsFile = path.join(__dirname, 'birds.json');
const openaiApiKey = process.env.OPENAI_API_KEY;

async function fetchBirdInfo(birdName) {
  const prompt = `Give a fun, concise encyclopedia entry (max 80 words) for the bird species: ${birdName}. Include its appearance, habitat, and a fun fact.`;
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 120,
      temperature: 0.7,
    },
    {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.choices[0].message.content.trim();
}

async function main() {
  const birdsData = [];
  for (const bird of BIRDS) {
    console.log(`Fetching info for ${bird}...`);
    try {
      const description = await fetchBirdInfo(bird);
      birdsData.push({
        name: bird,
        description,
        image: `images/birds/${bird.toLowerCase().replace(/ /g, '')}.png`,
      });
    } catch (err) {
      console.error(`Failed to fetch info for ${bird}:`, err.message);
    }
  }
  fs.writeFileSync(birdsFile, JSON.stringify(birdsData, null, 2));
  console.log('Bird data saved to birds.json');
}

if (!openaiApiKey) {
  console.error('Missing OpenAI API key in .env (OPENAI_API_KEY)');
  process.exit(1);
}

main();
