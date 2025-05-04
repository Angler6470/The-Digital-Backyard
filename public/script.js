// --- Load Plants to Choose From ---
const plantOptions = [
  { name: "Sunflower", image: "🌻" },
  { name: "Aloe Vera", image: "🪴" },
  { name: "Cactus", image: "🌵" },
  { name: "Orchid", image: "💐" },
  { name: "Rose", image: "🌹" },
  { name: "Daisy", image: "🌼" },
  { name: "Tulip", image: "🌷" },
  { name: "Palm", image: "🌴" },
  { name: "Lily", image: "🌸" },
  { name: "Maple Tree", image: "🍁" },
  { name: "Shamrock", image: "☘️" },
  { name: "Cherry Blossom", image: "🌸" },
  { name: "Hibiscus", image: "🌺" },
  { name: "Pine Tree", image: "🌲" },
  { name: "Deciduous Tree", image: "🌳" },
  { name: "Mushroom", image: "🍄" },
  { name: "Sprout", image: "🌱" },
  { name: "Herb", image: "🌿" },
  { name: "Seedling", image: "🌾" },
  { name: "Maple Leaf", image: "🍂" }
];

let plantStats = {
  happiness: 100,
  thirst: 0,
  sunlight: 50,
  stage: "Seedling"
};

const gallery = document.getElementById('plant-gallery');
const selectionSection = document.getElementById('plant-selection');
const activePlantSection = document.getElementById('active-plant');
const careFormSection = document.getElementById('care-form');
const plantInfo = document.getElementById('plant-info');

plantOptions.forEach(plant => {
  const card = document.createElement('button');
  card.className = 'plant-card';
  card.innerHTML = `<div class="emoji">${plant.image}</div>`;
  card.title = plant.name;
  card.onclick = () => selectPlant(plant);
  gallery.appendChild(card);
});

function selectPlant(plant) {
  selectionSection.style.display = 'none';
  activePlantSection.style.display = 'block';
  updatePlantInfo(plant);

  // Send selected plant to backend
  fetch('/digital-plant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 1, // Replace with actual user ID logic later
      species: plant.name,
      nickname: plant.name
    })
  })
    .then(res => res.json())
    .then(data => console.log('Digital plant saved:', data))
    .catch(err => console.error('Error saving digital plant:', err));

  addCareButtons();
}

function updatePlantInfo(plant) {
  plantInfo.innerHTML = `
    <h3>${plant.name} ${plant.image}</h3>
    <p>Stage: ${plantStats.stage}</p>
    <p>Happiness: ${plantStats.happiness}%</p>
    <p>Thirst: ${plantStats.thirst}%</p>
    <p>Sunlight: ${plantStats.sunlight}%</p>
  `;
}

function addCareButtons() {
  const actions = document.createElement('div');
  actions.id = 'care-actions';

  const waterBtn = document.createElement('button');
  waterBtn.innerText = '💧 Water';
  waterBtn.onclick = () => {
    plantStats.thirst = Math.max(0, plantStats.thirst - 20);
    plantStats.happiness = Math.min(100, plantStats.happiness + 5);
    updatePlantInfo({ name: "", image: "" });
  };

  const sunBtn = document.createElement('button');
  sunBtn.innerText = '☀️ Sunlight';
  sunBtn.onclick = () => {
    plantStats.sunlight = Math.min(100, plantStats.sunlight + 10);
    plantStats.happiness = Math.min(100, plantStats.happiness + 3);
    updatePlantInfo({ name: "", image: "" });
  };

  const shadeBtn = document.createElement('button');
  shadeBtn.innerText = '🌥️ Shade';
  shadeBtn.onclick = () => {
    plantStats.sunlight = Math.max(0, plantStats.sunlight - 10);
    plantStats.happiness = Math.min(100, plantStats.happiness + 2);
    updatePlantInfo({ name: "", image: "" });
  };

  actions.appendChild(waterBtn);
  actions.appendChild(sunBtn);
  actions.appendChild(shadeBtn);

  plantInfo.appendChild(actions);
}

function showCareForm() {
  careFormSection.style.display = 'block';
}

// Handle AI form submission
const aiForm = document.getElementById('ai-form');
aiForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nickname = document.getElementById('nickname').value;
  const species = document.getElementById('species').value;
  const issue = document.getElementById('issue').value;
  const responseDiv = document.getElementById('ai-response');

  responseDiv.innerHTML = 'Thinking... 🌱';

  try {
    const res = await fetch('/plant-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, species, issue })
    });

    const data = await res.json();
    responseDiv.innerText = data.tip;
  } catch (err) {
    responseDiv.innerText = 'Something went wrong. Please try again.';
  }
});
