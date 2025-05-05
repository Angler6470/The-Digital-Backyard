// File: script.js

// PlantPal: Combined Plant Selection + Virtual Plant Logic

// List of plants the user can choose from
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

window.plantOptions = plantOptions;

let activePlant = null;
const careProfileCache = {}; // 🌿 Caches GPT responses for species+environment combos

const gallery = document.getElementById("plant-gallery");
const selectionSection = document.getElementById("plant-selection");
const activePlantSection = document.getElementById("active-plant");
const plantInfo = document.getElementById("plant-info");

plantOptions.forEach((plant, index) => {
  const card = document.createElement("button");
  card.className = "plant-card";
  card.innerHTML = `<div class="emoji">${plant.image}</div>`;
  card.title = plant.name;
  card.onclick = () => selectPlant(plant, index);
  gallery.appendChild(card);
});

function populateDropdown(id) {
  const select = document.getElementById(id);
  plantOptions.forEach(plant => {
    const option = document.createElement("option");
    option.value = plant.name.toLowerCase();
    option.textContent = plant.name;
    select.appendChild(option);
  });
}

populateDropdown("species");
populateDropdown("profileSpecies");

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

  const useProfile = (care) => {
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
      sunRisk: care.sunRisk
    };
    document.getElementById("env-select").style.display = "none";
    activePlantSection.style.display = "block";
    updatePlantInfo();
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
        console.error('Failed to load care profile:', err);
        alert("Failed to load care info. Please try again.");
      });
  }
}

function generateProfile() {
  const species = document.getElementById('profileSpecies').value;
  const environment = document.getElementById('profileEnvironment').value;
  const key = `${species}-${environment}`;

  if (careProfileCache[key]) {
    document.getElementById('profileOutput').innerText = JSON.stringify(careProfileCache[key], null, 2);
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
      document.getElementById('profileOutput').innerText = JSON.stringify(data, null, 2);
    })
    .catch(err => {
      console.error('Error generating profile:', err);
      document.getElementById('profileOutput').innerText = "Failed to get profile.";
    });
}

// AI form submission with personality/emotion feedback
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

    // Add emotion-based prefix
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
});
