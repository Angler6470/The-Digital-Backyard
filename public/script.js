// File: script.js

// PlantPal: Combined Plant Selection + Virtual Plant Logic

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

let activePlant = null;
const careProfileCache = {};

const gallery = document.getElementById("plant-gallery");
const selectionSection = document.getElementById("plant-selection");
const activePlantSection = document.getElementById("active-plant");
const plantInfo = document.getElementById("plant-info");
const loadingSpinner = document.getElementById("loading-spinner");

function populateDropdown(id) {
  const select = document.getElementById(id);
  if (!select) return;
  plantOptions.forEach(plant => {
    const option = document.createElement("option");
    option.value = plant.name.toLowerCase();
    option.textContent = plant.name;
    select.appendChild(option);
  });
}

populateDropdown("species");
populateDropdown("profileSpecies");

plantOptions.forEach((plant, index) => {
  const card = document.createElement("button");
  card.className = "plant-card";
  card.innerHTML = `<div class="emoji">${plant.image}</div>`;
  card.title = plant.name;
  card.onclick = () => selectPlant(plant, index);
  gallery.appendChild(card);
});

function selectPlant(plant, id) {
  selectionSection.style.display = "none";
  document.getElementById("env-select").style.display = "block";
  const selectedPlant = {
    id,
    species: plant.name,
    nickname: plant.name
  };
  window.selectedPlant = selectedPlant;
  document.getElementById("nickname").value = selectedPlant.nickname;
  document.getElementById("species").value = selectedPlant.species.toLowerCase();
}

function setEnvironment(env) {
  const plant = window.selectedPlant;
  const cacheKey = `${plant.species.toLowerCase()}-${env}`;
  loadingSpinner.style.display = "block";
  loadingSpinner.classList.add("spinner-animate");

  const useProfile = (care, isOffline = false) => {
    activePlant = {
      id: plant.id,
      species: plant.species,
      nickname: plant.nickname,
      environment: env,
      temp: env === "indoor" ? 72 : 65,
      stage: "Seed",
      happiness: 100,
      stageCare: { water: 0, sun: 0 },
      sunlightType: care.sunlightType,
      tempRange: care.tempRange,
      stageNeeds: care.stageNeeds,
      minLightHours: care.minLightHours,
      maxLightHours: care.maxLightHours,
      sunRisk: care.sunRisk,
      currentLight: "indirect"
    };
    document.getElementById("env-select").style.display = "none";
    activePlantSection.style.display = "block";
    updatePlantInfo();
    loadingSpinner.style.display = "none";
    loadingSpinner.classList.remove("spinner-animate");
  };

  if (careProfileCache[cacheKey]) {
    useProfile(careProfileCache[cacheKey]);
  } else {
    fetch('/plant-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ species: plant.species, environment: env })
    })
      .then(res => res.json())
      .then(care => {
        careProfileCache[cacheKey] = care;
        useProfile(care);
      })
      .catch(err => {
        console.warn('Offline fallback triggered. Using default care profile.');
        const defaultCare = {
          sunlightType: "indirect",
          tempRange: "60–75°F",
          stageNeeds: {
            Seed: { water: 1, sun: 1 },
            Seedling: { water: 2, sun: 2 },
            Sprout: { water: 2, sun: 2 },
            Bud: { water: 3, sun: 3 },
            Bloom: { water: 3, sun: 3 },
            Mature: { water: 4, sun: 4 }
          },
          minLightHours: 2,
          maxLightHours: 6,
          sunRisk: "Leaves may burn with too much direct sunlight."
        };
        useProfile(defaultCare, true);
      });
  }
}

function generateProfile() {
  const species = document.getElementById('profileSpecies').value;
  const environment = document.getElementById('profileEnvironment').value;
  const key = `${species}-${environment}`;
  const output = document.getElementById('profileOutput');

  if (careProfileCache[key]) {
    output.innerText = JSON.stringify(careProfileCache[key], null, 2);
    return;
  }

  fetch('/plant-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ species, environment })
  })
    .then(res => res.json())
    .then(data => {
      careProfileCache[key] = data;
      output.innerText = JSON.stringify(data, null, 2);
    })
    .catch(err => {
      console.warn("Offline fallback for profile generation");
      const defaultProfile = {
        sunlightType: "indirect",
        tempRange: "60–75°F",
        stageNeeds: {
          Seed: { water: 1, sun: 1 },
          Seedling: { water: 2, sun: 2 },
          Sprout: { water: 2, sun: 2 },
          Bud: { water: 3, sun: 3 },
          Bloom: { water: 3, sun: 3 },
          Mature: { water: 4, sun: 4 }
        },
        minLightHours: 2,
        maxLightHours: 6,
        sunRisk: "Leaves may burn with too much direct sunlight."
      };
      const offlineNote = { ...defaultProfile, note: "(offline default data)" };
      output.innerText = JSON.stringify(offlineNote, null, 2);
    });
}

function setLightIntensity(value) {
  activePlant.currentLight = value;
  if (value !== activePlant.sunlightType) {
    plantInfo.style.border = "3px dashed orange";

    const alert = document.createElement("div");
    alert.id = "light-warning";
    alert.textContent = `⚠️ ${activePlant.nickname} prefers ${activePlant.sunlightType} light!`;
    alert.className = "sunlight-alert";
    if (!document.getElementById("light-warning")) {
      plantInfo.prepend(alert);
    }
    setTimeout(() => {
      alert.classList.add("flash");
    }, 50);
  } else {
    plantInfo.style.border = "2px solid transparent";
    const alert = document.getElementById("light-warning");
    if (alert) alert.remove();
  }
}

function updatePlantInfo() {
  const lightSelector = `
    <div style="margin: 0.5rem 0;">
      <label>Light Level:</label>
      <select id="light-level" onchange="setLightIntensity(this.value)">
        <option value="shade">🌑 Shade</option>
        <option value="indirect">⛅ Indirect</option>
        <option value="direct">☀️ Direct</option>
      </select>
    </div>`;
  const visual = document.getElementById("plant-visual");
  let stageEmoji = "🌱";
  switch (activePlant.stage) {
    case "Seed": stageEmoji = "🫘"; break;
    case "Seedling": stageEmoji = "🌱"; break;
    case "Sprout": stageEmoji = "🌿"; break;
    case "Bud": stageEmoji = "🌾"; break;
    case "Bloom": stageEmoji = "🌸"; break;
    case "Mature": stageEmoji = "🌳"; break;
  }
  visual.innerHTML = stageEmoji;
  const stats = `
    <div style="margin-top: 0.5rem;">
      <h3>${activePlant.nickname} (${activePlant.species})</h3>
      <p>Stage: ${activePlant.stage}</p>
      <p>Sunlight: ${activePlant.sunlightType} (${activePlant.minLightHours}-${activePlant.maxLightHours} hrs/day)</p>
      <p style="font-size: 0.9rem; color: #666;">⚠️ ${activePlant.sunRisk}</p>
      <p>Temp: ${activePlant.temp}°F (Ideal: ${activePlant.tempRange})</p>
      <p>Current Light: ${activePlant.currentLight}</p>
      <p>Happiness: ${activePlant.happiness}%</p>
      <p>Watered ${activePlant.stageCare.water}x / Sunlight ${activePlant.stageCare.sun}x</p>
      <button onclick="giveWater()">💧 Water</button>
      <button onclick="giveSunlight()">☀️ Sunlight</button>
    </div>`;
  plantInfo.innerHTML = lightSelector + stats;
  document.getElementById("light-level").value = activePlant.currentLight;
  setLightIntensity(activePlant.currentLight);
}

function giveWater() {
  activePlant.stageCare.water++;
  activePlant.happiness = Math.min(100, activePlant.happiness + 5);
  updatePlantInfo();
  checkGrowthStage();
}

function giveSunlight() {
  activePlant.stageCare.sun++;
  activePlant.happiness = Math.min(100, activePlant.happiness + 3);
  updatePlantInfo();
  checkGrowthStage();
}

function checkGrowthStage() {
  const current = activePlant.stage;
  const order = ["Seed", "Seedling", "Sprout", "Bud", "Bloom", "Mature"];
  const index = order.indexOf(current);
  if (index === -1 || index === order.length - 1) return;
  const needs = activePlant.stageNeeds[current];
  if (
    activePlant.stageCare.water >= needs.water &&
    activePlant.stageCare.sun >= needs.sun
  ) {
    const plantVisual = document.getElementById("plant-visual");
    plantVisual.classList.add("level-up-flash");
    const msg = document.createElement("div");
    msg.id = "level-up-text";
    msg.textContent = "🌟 LEVEL UP! 🌟";
    plantVisual.before(msg);
    setTimeout(() => {
      plantVisual.classList.remove("level-up-flash");
      msg.remove();
    }, 2000);
    activePlant.stage = order[index + 1];
    activePlant.stageCare = { water: 0, sun: 0 };
    updatePlantInfo();
  }
}

const aiForm = document.getElementById("ai-form");
aiForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nickname = document.getElementById("nickname").value;
  const species = document.getElementById("species").value;
  const issue = document.getElementById("issue").value;

  try {
    const res = await fetch("/plant-tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, species, issue })
    });
    const data = await res.json();

    let moodIcon = "🪴";
    const text = data.tip.toLowerCase();
    if (text.includes("great") || text.includes("thriving")) moodIcon = "😄";
    else if (text.includes("sad") || text.includes("drooping") || text.includes("struggling")) moodIcon = "😢";
    else if (text.includes("burn") || text.includes("overwater")) moodIcon = "⚠️";
    else if (text.includes("happy") || text.includes("love")) moodIcon = "💚";

    document.getElementById("ai-response").innerText = `${moodIcon} ${data.tip}`;
  } catch (err) {
    console.error("Error fetching plant tip:", err);
    document.getElementById("ai-response").innerText = "Failed to fetch tip.";
  }
}
