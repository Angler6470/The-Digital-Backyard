// File: script.js

// PlantPal: Combined Plant Selection + Virtual Plant Logic

const plantOptions = [{
  name: "Sunflower",
  image: "🌻"
},
{
  name: "Aloe Vera",
  image: "🪴"
},
{
  name: "Cactus",
  image: "🌵"
},
{
  name: "Orchid",
  image: "💐"
},
{
  name: "Rose",
  image: "🌹"
},
{
  name: "Daisy",
  image: "🌼"
},
{
  name: "Tulip",
  image: "🌷"
},
{
  name: "Palm",
  image: "🌴"
},
{
  name: "Lily",
  image: "🌸"
},
{
  name: "Maple Tree",
  image: "🍁"
},
{
  name: "Shamrock",
  image: "☘️"
},
{
  name: "Cherry Blossom",
  image: "🌸"
},
{
  name: "Hibiscus",
  image: "🌺"
},
{
  name: "Pine Tree",
  image : "🌲"
},
{
  name: "Deciduous Tree",
  image : "🌳"
},
{
  name: "Mushroom",
  image : "🍄"
},
{
  name: "Sprout",
  image : "🌱"
},
{
  name: "Herb",
  image : "🌿"
},
{
  name: "Seedling",
  image : "🌾"
},
{
  name: "Maple Leaf",
  image : "🍂"
}
];

let activePlant = null;
const careProfileCache = {};

const gallery = document.getElementById("plant-gallery");
const selectionSection = document.getElementById("plant-selection");
const activePlantSection = document.getElementById("active-plant");
const plantInfo = document.getElementById("plant-info");
const loadingSpinner = document.getElementById("loading-spinner");

// Constants for default values
const DEFAULT_TEMP_INDOOR = 72;
const DEFAULT_TEMP_OUTDOOR = 65;
const DEFAULT_PROFILE = {
sunlightType: "indirect",
tempRange: "60–75°F",
stageNeeds: {
  Seed: {
      water: 1,
      sun: 1,
      fertilizer: 1
  },
  Seedling: {
      water: 2,
      sun: 2,
      fertilizer: 1
  },
  Sprout: {
      water: 2,
      sun: 2,
      fertilizer: 2
  },
  Bud: {
      water: 3,
      sun: 3,
      fertilizer: 2
  },
  Bloom: {
      water: 3,
      sun: 3,
      fertilizer: 3
  },
  Mature: {
      water: 4,
      sun: 4,
      fertilizer: 3
  }
},
minLightHours: 2,
maxLightHours: 6,
sunRisk: "Leaves may burn with too much direct sunlight.",
fertilizer: {
  Seed: {
      npk: "5-5-5",
      frequency: "every 2 weeks",
      risk: "Low"
  },
  Seedling: {
      npk: "10-10-10",
      frequency: "weekly",
      risk: "Medium"
  },
  Sprout: {
      npk: "15-15-15",
      frequency: "weekly",
      risk: "High"
  },
  Bloom: {
      npk: "15-30-15",
      frequency: "every 5 days",
      risk: "High"
  },
  Mature: {
      npk: "10-10-10",
      frequency: "every 10 days",
      risk: "Low"
  }
}
};

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

let selectedPlant = null; // Renamed from window.selectedPlant and moved to local scope

function selectPlant(plant, id) {
selectedPlant = {
  id,
  species: plant.name,
  nickname: plant.name
};
selectionSection.style.display = "none";
document.getElementById("env-select").style.display = "block";

document.getElementById("nickname").value = selectedPlant.nickname;
document.getElementById("species").value = selectedPlant.species.toLowerCase();
}

// Utility function to display an alert message
function showAlert(message, isError = false) {
const alertDiv = document.createElement("div");
alertDiv.className = `alert ${isError ? "alert-error" : "alert-info"}`; // Add CSS classes for styling
alertDiv.textContent = message;
document.body.prepend(alertDiv); // Add to top of body for visibility
setTimeout(() => alertDiv.remove(), 5000); // Remove after 5 seconds
}

async function fetchPlantProfile(species, environment) {
const cacheKey = `${species.toLowerCase()}-${environment}`;
if (!navigator.onLine) {
  console.warn("App is offline. Using default plant profile.");
  showAlert("App is offline. Using default plant profile.", true);
  return DEFAULT_PROFILE; // Return the default profile immediately
}

if (careProfileCache[cacheKey]) {
  return careProfileCache[cacheKey];
}

try {
  const response = await fetch('/plant-profile', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          species,
          environment
      })
  });

  if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
  }

  const data = await response.json();
  careProfileCache[cacheKey] = data;
  return data;
} catch (error) {
  console.error("Error fetching plant profile:", error);
  showAlert("Failed to fetch plant profile. Using default settings.", true);
  return null; // Indicate failure to fetch
}
}

async function setEnvironment(env) {
if (!selectedPlant) {
  showAlert("Please select a plant before setting the environment.", true);
  return;
}

loadingSpinner.style.display = "block";
loadingSpinner.classList.add("spinner-animate");

const profile = await fetchPlantProfile(selectedPlant.species, env);

if (!profile) {
  // Use default profile if fetch fails
  useProfile(DEFAULT_PROFILE, env);
} else {
  useProfile(profile, env);
}
}

function useProfile(care, env) {
activePlant = {
  id: selectedPlant.id,
  species: selectedPlant.species,
  nickname: selectedPlant.nickname,
  environment: env,
  temp: env === "indoor" ? DEFAULT_TEMP_INDOOR : DEFAULT_TEMP_OUTDOOR,
  stage: "Seed",
  happiness: 100,
  stageCare: {
      water: 0,
      sun: 0,
      fertilizer: 0
  },
  ...care, // Use the spread operator to copy over fetched or default care profile.
  customNPK: {},
  currentLight: "indirect"
};

document.getElementById("env-select").style.display = "none";
activePlantSection.style.display = "block";
updatePlantInfo();
loadingSpinner.style.display = "none";
loadingSpinner.classList.remove("spinner-animate");

startLightTimer("indirect");
if (lightTimer) clearInterval(lightTimer);
lightTimer = setInterval(handleLightDuration, 3000);
}

async function generateProfile() {
const species = document.getElementById('profileSpecies').value;
const environment = document.getElementById('profileEnvironment').value;
const output = document.getElementById('profileOutput');

const profileData = await fetchPlantProfile(species, environment);

if (profileData) {
  output.innerText = JSON.stringify(profileData, null, 2);
} else {
  const offlineNote = { ...DEFAULT_PROFILE,
      note: "(offline default data)"
  };
  output.innerText = JSON.stringify(offlineNote, null, 2);
}
}

let isUpdatingLightIntensity = false; // Add a flag to prevent recursive calls

function setLightIntensity(value) {
if (!activePlant) {
  showAlert("No active plant selected!", true);
  return;
}
if (isUpdatingLightIntensity) return;
isUpdatingLightIntensity = true;
try {
  activePlant.currentLight = value;
  const lightWarning = document.getElementById("light-warning");

  if (value !== activePlant.sunlightType) {
      plantInfo.classList.add("plant-info-warning");

      if (!lightWarning) {
          const alert = document.createElement("div");
          alert.id = "light-warning";
          alert.textContent = `⚠️ ${activePlant.nickname} prefers ${activePlant.sunlightType} light!  `; // Added space and close button
          alert.className = "sunlight-alert";
          const closeButton = document.createElement("button");
          closeButton.textContent = "X";
          closeButton.onclick = () => {
              alert.remove();
              plantInfo.classList.remove("plant-info-warning"); // Remove the class when alert is dismissed
          };
          alert.appendChild(closeButton); // Add close button to alert
          plantInfo.prepend(alert);
      }

  } else {
      plantInfo.classList.remove("plant-info-warning");
      if (lightWarning) lightWarning.remove();
  }
  // Start/Reset light timer
  startLightTimer(value);
  if (lightTimer) clearInterval(lightTimer);
  lightTimer = setInterval(handleLightDuration, 3000); // check every 3 seconds
} finally {
  isUpdatingLightIntensity = false;
  updatePlantInfo();
}
}

function handleLightDuration() {
if (!activePlant) return;
const min = activePlant.minLightHours || 2;
const max = activePlant.maxLightHours || 6;
const type = activePlant.currentLight;
lightDuration = ((Date.now() - lightStartTime) / (1000 * 60 * 60)); // hours

// Direct sunlight: wilting if over max
if (type === "direct" && lightDuration > max && !wiltingActive) {
    wiltingActive = true;
    showAlert(`${activePlant.nickname} is wilting from too much direct sunlight! Move to shade or indirect light.`, true);
    startWilting("direct");
}
// Shade: too little light if over max
if (type === "shade" && lightDuration > max && !wiltingActive) {
    wiltingActive = true;
    showAlert(`${activePlant.nickname} is becoming sluggish from too little light! Move to indirect or direct light.`, true);
    startWilting("shade");
}
// Indirect: reset wilting if within range
if ((type === "indirect" && lightDuration <= max) || (type !== activePlant.lastLightType)) {
    stopWilting();
}
}

function startWilting(reason) {
if (!activePlant) return;
if (wiltingInterval) clearInterval(wiltingInterval);
wiltingInterval = setInterval(() => {
    if (!activePlant) return;
    activePlant.happiness = Math.max(0, activePlant.happiness - 5);
    updatePlantInfo();
    if (activePlant.happiness === 0) {
        showAlert(`${activePlant.nickname} has wilted!`, true);
        stopWilting();
    }
}, 3000); // decrease happiness every 3 seconds
}

function stopWilting() {
if (wiltingInterval) {
    clearInterval(wiltingInterval);
    wiltingInterval = null;
}
wiltingActive = false;
}

function updatePlantInfo() {
if (!activePlant) {
  plantInfo.innerHTML = "<p>No plant selected.</p>";
  return;
}

const stage = activePlant.stage;
const fert = activePlant.fertilizer ?.[stage];
const userNPK = activePlant.customNPK ?.[stage];

const fertInfo = fert ? `
<div class="fertilizer-info">
<p><strong>Fertilizer Info:</strong></p>
<p>Recommended NPK: ${fert.npk}</p>
<p>Your NPK:</p>
<div class="npk-sliders">
    <div class="npk-slider-group">
        <label for="n-slider">N:</label>
        <input type="range" id="n-slider" min="0" max="5" value="${getUserNValue(stage) || 0}" onchange="updateNPK('${stage}')">
        <span id="n-value">${getUserNValue(stage) || 0}</span>
    </div>
    <div class="npk-slider-group">
        <label for="p-slider">P:</label>
        <input type="range" id="p-slider" min="0" max="5" value="${getUserPValue(stage) || 0}" onchange="updateNPK('${stage}')">
        <span id="p-value">${getUserPValue(stage) || 0}</span>
    </div>
    <div class="npk-slider-group">
        <label for="k-slider">K:</label>
        <input type="range" id="k-slider" min="0" max="5" value="${getUserKValue(stage) || 0}" onchange="updateNPK('${stage}')">
        <span id="k-value">${getUserKValue(stage) || 0}</span>
    </div>
</div>
<p>Feed: ${fert.frequency}</p>
<p>Overfeeding Risk: ${fert.risk}</p>
<p>Fed: ${activePlant.stageCare.fertilizer}x</p>
<button onclick="giveFertilizer()">🌾 Fertilize</button>
</div>` : "";

const lightSelector = `
<div class="light-selector">
<label>Light Level:</label>
<select id="light-level" onchange="setLightIntensity(this.value)">
  <option value="shade">🌑 Shade</option>
  <option value="indirect">⛅ Indirect</option>
  <option value="direct">☀️ Direct</option>
</select>
</div>`;

let stageEmoji = "🌱";
switch (stage) {
  case "Seed":
      stageEmoji = "🫘";
      break;
  case "Seedling":
      stageEmoji = "🌱";
      break;
  case "Sprout":
      stageEmoji = "🌿";
      break;
  case "Bud":
      stageEmoji = "🌾";
      break;
  case "Bloom":
      stageEmoji = "🌸";
      break;
  case "Mature":
      stageEmoji = "🌳";
      break
}
document.getElementById("plant-visual").innerHTML = stageEmoji; // Set visual

const stats = `
<div class="plant-stats">
<h3>${activePlant.nickname} (${activePlant.species})</h3>
<p>Stage: ${stage}</p>
<p>Sunlight: ${activePlant.sunlightType} (${activePlant.minLightHours}-${activePlant.maxLightHours} hrs/day)</p>
<p class="sun-risk">⚠️ ${activePlant.sunRisk}</p>
<p>Temp: ${activePlant.temp}°F (Ideal: ${activePlant.tempRange})</p>
<p>Current Light: ${activePlant.currentLight}</p>
<p>Happiness: ${activePlant.happiness}%</p>
<p>Watered ${activePlant.stageCare.water}x / Sunlight ${activePlant.stageCare.sun}x / Fertilizer ${activePlant.stageCare.fertilizer}x</p>
<div class="plant-actions">
  <button onclick="giveWater()">💧 Water</button>
  <button onclick="giveSunlight()">☀️ Sunlight</button>
  <button onclick="giveFertilizer()">🌱 Fertilize</button>
</div>
</div>`;

plantInfo.innerHTML = lightSelector + stats + fertInfo;
const lightLevel = document.getElementById("light-level");
if (lightLevel) {
  lightLevel.value = activePlant.currentLight;
}

}

function giveWater() {
if (!activePlant) {
  showAlert("No active plant selected!", true);
  return;
}
activePlant.stageCare.water++;
activePlant.happiness = Math.min(100, activePlant.happiness + 5);
updatePlantInfo();
checkGrowthStage();
}

function giveSunlight() {
if (!activePlant) {
  showAlert("No active plant selected!", true);
  return;
}
activePlant.stageCare.sun++;
activePlant.happiness = Math.min(100, activePlant.happiness + 3);
updatePlantInfo();
checkGrowthStage();
}

function giveFertilizer() {
if (!activePlant) {
  showAlert("No active plant selected!", true);
  return;
}
activePlant.stageCare.fertilizer++;
activePlant.happiness = Math.min(100, activePlant.happiness + 4);
updatePlantInfo();
checkGrowthStage();
}

function checkGrowthStage() {
if (!activePlant) return;

const current = activePlant.stage;
const order = ["Seed", "Seedling", "Sprout", "Bud", "Bloom", "Mature"];
const index = order.indexOf(current);

if (index === -1 || index === order.length - 1) return;

const needs = activePlant.stageNeeds[current];
if (
  activePlant.stageCare.water >= needs.water &&
  activePlant.stageCare.sun >= needs.sun &&
  activePlant.stageCare.fertilizer >= needs.fertilizer
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
  activePlant.stageCare = {
      water: 0,
      sun: 0,
      fertilizer: 0
  };
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
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          nickname,
          species,
          issue
      })
  });

  if (!res.ok) {
      throw new Error(`Failed to fetch AI tip: ${res.status}`);
  }

  const data = await res.json();

  let moodIcon = "🪴";
  const text = data.tip.toLowerCase();
  if (text.includes("great") || text.includes("thriving")) moodIcon = "😄";
  else if (text.includes("sad") || text.includes("drooping") || text.includes("struggling")) moodIcon = "😢";
  else if (text.includes("burn") || text.includes("overwater")) moodIcon = "⚠️";
  else if (text.includes("happy") || text.includes("love")) moodIcon = "💚";

  const aiResponse = document.getElementById("ai-response");
  aiResponse.innerText = `${moodIcon} ${data.tip}`;
  aiResponse.classList.remove("ai-response-error"); // Remove error styling, if present


} catch (err) {
  console.error("Error fetching plant tip:", err);
  const aiResponse = document.getElementById("ai-response");
  aiResponse.innerText = "Failed to fetch plant tip. Please try again later.";
  aiResponse.classList.add("ai-response-error"); // add class for error styling

}
});

function setCustomNPK(stage, value) {
if (!activePlant) {
  showAlert("No active plant selected!", true);
  return;
}
if (!activePlant.customNPK) activePlant.customNPK = {};
activePlant.customNPK[stage] = value;
}

function updateNPK(stage) {
if (!activePlant) return;

const n = document.getElementById('n-slider').value;
const p = document.getElementById('p-slider').value;
const k = document.getElementById('k-slider').value;

document.getElementById('n-value').innerText = n;
document.getElementById('p-value').innerText = p;
document.getElementById('k-value').innerText = k;

const npkValue = `${n}-${p}-${k}`;
setCustomNPK(stage, npkValue);
updatePlantInfo(); //re-render so the information persists to the screen
}

function getUserNValue(stage) {
if (!activePlant || !activePlant.customNPK || !activePlant.customNPK[stage]) {
  return 0;
}
return activePlant.customNPK[stage].split('-')[0] || 0;
}

function getUserPValue(stage) {
if (!activePlant || !activePlant.customNPK || !activePlant.customNPK[stage]) {
  return 0;
}
return activePlant.customNPK[stage].split('-')[1] || 0;
}

function getUserKValue(stage) {
if (!activePlant || !activePlant.customNPK || !activePlant.customNPK[stage]) {
  return 0;
}
return activePlant.customNPK[stage].split('-')[2] || 0;
}

// Timer logic for light exposure
let lightTimer = null;
let lightDuration = 0; // in hours
let lightStartTime = null;
let wiltingInterval = null;
let wiltingActive = false;

function startLightTimer(lightType) {
    if (!activePlant) return;
    clearLightTimer();
    lightStartTime = Date.now();
    activePlant.lastLightType = lightType;
    lightDuration = 0;
    wiltingActive = false;
}

function clearLightTimer() {
    if (lightTimer) {
        clearInterval(lightTimer);
        lightTimer = null;
    }
    if (wiltingInterval) {
        clearInterval(wiltingInterval);
        wiltingInterval = null;
    }
}

console.log("PlantPal script with fertilizer logic loaded ✅");



function updateFertilizerInfo(stage) {
  const fert = activePlant.fertilizer?.[stage];
  const fertilizerSection = document.querySelector('.fertilizer-info');

  if (!fert || !fertilizerSection) return;

  // Update recommended NPK
  document.getElementById("recommended-npk").textContent = fert.npk;

  // Update NPK sliders and values
  const n = getUserNValue(stage) || 0;
  const p = getUserPValue(stage) || 0;
  const k = getUserKValue(stage) || 0;

  document.getElementById("n-slider").value = n;
  document.getElementById("p-slider").value = p;
  document.getElementById("k-slider").value = k;

  document.getElementById("n-value").textContent = n;
  document.getElementById("p-value").textContent = p;
  document.getElementById("k-value").textContent = k;

  // Update feed count
  document.getElementById("fert-count").textContent = activePlant.stageCare.fertilizer;

  // Finally reveal the section
  fertilizerSection.style.display = "block";
}
