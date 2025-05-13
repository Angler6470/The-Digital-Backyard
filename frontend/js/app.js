// Main app logic for Virtual Backyard Bird Sanctuary
// Handles loading user yard, rendering birds/accessories, day/night cycle, etc.

document.addEventListener('DOMContentLoaded', () => {
  // TODO: Load user data, render yard, set up event listeners
  // Example: fetch('/api/yard')

  // UI event listeners
  document.getElementById('open-shop').addEventListener('click', showShopModal);
  document.getElementById('open-encyclopedia').addEventListener('click', showBirdEncyclopediaModal);
  document.getElementById('logout').addEventListener('click', logoutUser);
});

function renderBackyard() {
  const backyard = document.getElementById('backyard');
  backyard.innerHTML = '';
  // Fetch yard state
  const jwt = localStorage.getItem('jwt');
  fetch('http://localhost:3001/api/yard', {
    headers: { 'Authorization': 'Bearer ' + jwt }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.yard) return;
      // Show birdhouse if user owns one (for demo, check accessories for 'birdhouse')
      const hasBirdhouse = data.yard.accessories.some(a => a.type === 'birdhouse');
      if (hasBirdhouse) {
        const birdhouseImg = document.createElement('img');
        birdhouseImg.src = 'images/accessories/birdhouse1.png';
        birdhouseImg.alt = 'Birdhouse';
        birdhouseImg.style = 'width:120px;position:absolute;bottom:30px;left:40px;z-index:2;';
        backyard.appendChild(birdhouseImg);
      }
      // Show all placed accessories
      data.yard.accessories.forEach(a => {
        if (a.type !== 'birdhouse') {
          const accImg = document.createElement('img');
          accImg.src = `images/accessories/${a.image || 'birdhouse1.png'}`;
          accImg.alt = a.name;
          accImg.title = a.name;
          accImg.style = 'width:70px;position:absolute;bottom:30px;left:180px;z-index:2;';
          backyard.appendChild(accImg);
        }
      });
      // Show all placed food
      data.yard.food.forEach(f => {
        const foodImg = document.createElement('img');
        foodImg.src = `images/accessories/${f.image || 'birdhouse1.png'}`;
        foodImg.alt = f.name;
        foodImg.title = f.name;
        foodImg.style = 'width:50px;position:absolute;bottom:30px;left:270px;z-index:2;';
        backyard.appendChild(foodImg);
      });
      // Show attracted birds
      data.yard.birds.forEach(b => {
        const birdImg = document.createElement('img');
        birdImg.src = `images/birds/${b.image || 'bluejay.png'}`;
        birdImg.alt = b.name;
        birdImg.title = b.name;
        birdImg.style = 'width:60px;position:absolute;bottom:120px;left:100px;z-index:3;';
        backyard.appendChild(birdImg);
      });
    });
}

function updateDayNightCycle() {
  // TODO: Change background and bird activity based on real-world time/location
}

// --- Bird Encyclopedia ---
let encyclopediaBirds = [];
let userBackyardBirds = [];

async function showBirdEncyclopediaModal() {
  // Only run the offline part if offline, otherwise call the API the first time like normal
  if (encyclopediaBirds.length === 0) {
    if (!navigator.onLine) {
      // Offline: load from static JSON
      const res = await fetch('birds.json');
      encyclopediaBirds = await res.json();
    } else {
      // Online: fetch from API
      const res = await fetch('http://localhost:3001/api/birds/encyclopedia');
      encyclopediaBirds = await res.json();
    }
  }
  // Fetch user's backyard birds
  userBackyardBirds = await getUserBackyardBirdNames();

  let birdsHtml = encyclopediaBirds.map((bird, idx) => {
    const isInBackyard = userBackyardBirds.includes(bird.name);
    return `
      <div style='margin-bottom:1rem;cursor:pointer;display:flex;align-items:center;gap:12px;${isInBackyard ? "box-shadow:0 0 12px 4px #43cea2;border-radius:12px;outline:2px solid #43cea2;" : "border-radius:12px;"}' onclick='showBirdDetail(${idx})'>
        <img src='${bird.image}' alt='${bird.name}' style='width:48px;height:48px;vertical-align:middle;margin-right:10px;'>
        <div>
          <strong>${bird.name}</strong><br>
          <span style='font-size:0.95em;color:#555;'>${bird.climate ? `Climate: ${bird.climate}` : ''}${bird.food ? ` | Food: ${bird.food}` : ''}</span>
        </div>
      </div>
    `;
  }).join('');
  showModal('Bird Encyclopedia', birdsHtml);
}

window.showBirdDetail = function(idx) {
  const bird = encyclopediaBirds[idx];
  showModal(
    bird.name,
    `<img src='${bird.image}' alt='${bird.name}' style='width:80px;height:80px;display:block;margin:auto 0 1rem auto;'><p>${bird.description}</p>
    <ul style='list-style:none;padding:0;font-size:1.05em;'>
      ${bird.climate ? `<li><b>Climate:</b> ${bird.climate}</li>` : ''}
      ${bird.food ? `<li><b>Food:</b> ${bird.food}</li>` : ''}
      ${bird.properties ? `<li><b>Properties:</b> ${bird.properties}</li>` : ''}
    </ul>`
  );
};

async function getUserBackyardBirdNames() {
  const jwt = localStorage.getItem('jwt');
  if (!jwt) return [];
  const res = await fetch('http://localhost:3001/api/yard', { headers: { 'Authorization': 'Bearer ' + jwt } });
  const data = await res.json();
  if (!data.yard || !Array.isArray(data.yard.birds)) return [];
  return data.yard.birds.map(b => b.name);
}

function showModal(title, content) {
  const modalContainer = document.getElementById('modal-container');
  modalContainer.innerHTML = `
    <div class="modal-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
      <div class="modal" style="background:#fff;padding:2rem;border-radius:10px;min-width:300px;max-width:90vw;">
        <h2>${title}</h2>
        <div>${content}</div>
        <div style="margin-top:1rem;display:flex;gap:1rem;">
          <button id="close-modal">Close</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('close-modal').onclick = () => {
    modalContainer.innerHTML = '';
  };
}

let isLoggedIn = false;

function showLoginButton() {
  const header = document.querySelector('header');
  if (!document.getElementById('main-login-btn')) {
    const btn = document.createElement('button');
    btn.id = 'main-login-btn';
    btn.textContent = 'Login';
    btn.onclick = showLoginModal;
    header.appendChild(btn);
  }
}

function hideLoginButton() {
  const btn = document.getElementById('main-login-btn');
  if (btn) btn.remove();
}

document.addEventListener('DOMContentLoaded', () => {
  // ...existing code...
  if (!isLoggedIn) showLoginButton();
  if (isLoggedIn) showEarnMeterButton();
  // Always show earn meter button for demo/testing
  showEarnMeterButton();
});

function showLocationSelectionModal() {
  const cities = [
    'New Milford, CT',
    'New York, NY',
    'Boston, MA',
    'Chicago, IL',
    'Miami, FL',
    'Seattle, WA',
    'Los Angeles, CA',
    'Anchorage, AK'
  ];
  const options = cities.map(city => `<option value="${city}">${city}</option>`).join('');
  showModal('Choose Your Backyard Location', `
    <label for="city-select">Select a city to start your backyard:</label><br>
    <select id="city-select" style="margin:1rem 0;width:80%;font-size:1.1rem;">${options}</select><br>
    <button id="choose-location-btn">Start Here</button>
  `);
  document.getElementById('choose-location-btn').onclick = async () => {
    const city = document.getElementById('city-select').value;
    await createUserYard(city);
    document.getElementById('modal-container').innerHTML = '';
    await goToBackyard();
  };
}

async function createUserYard(location) {
  const jwt = localStorage.getItem('jwt');
  await fetch('http://localhost:3001/api/yard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify({ location })
  });
}

async function goToBackyard() {
  await updateWeatherAndBackground();
  renderBackyard();
}

// After login/signup, check if user has a yard, else prompt for location
async function onLoginSuccess() {
  isLoggedIn = true;
  hideLoginButton();
  document.getElementById('logout').style.display = 'inline-block';
  document.getElementById('open-shop').style.display = 'inline-block';
  document.getElementById('open-encyclopedia').style.display = 'inline-block';
  showEarnMeterButton();
  // Check for yard
  const jwt = localStorage.getItem('jwt');
  const res = await fetch('http://localhost:3001/api/yard', {
    headers: { 'Authorization': 'Bearer ' + jwt }
  });
  const data = await res.json();
  if (!data.yard) {
    showLocationSelectionModal();
  } else {
    await goToBackyard();
  }
}

// --- Earn Meter Mini-game ---
function showEarnMeterButton() {
  const header = document.querySelector('header');
  if (!document.getElementById('earn-meter-btn')) {
    const btn = document.createElement('button');
    btn.id = 'earn-meter-btn';
    btn.textContent = 'Earn Pup Coins';
    btn.onclick = showEarnMeterModal;
    // Insert after currency display for better placement
    const currencyDisplay = document.getElementById('currency-display');
    if (currencyDisplay && currencyDisplay.nextSibling) {
      header.insertBefore(btn, currencyDisplay.nextSibling);
    } else {
      header.appendChild(btn);
    }
  }
}
function hideEarnMeterButton() {
  const btn = document.getElementById('earn-meter-btn');
  if (btn) btn.remove();
}

function showEarnMeterModal() {
  const modalContainer = document.getElementById('modal-container');
  modalContainer.innerHTML = `
    <div class="modal-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
      <div class="modal" style="background:#fff;padding:2rem;border-radius:10px;min-width:350px;max-width:95vw;">
        <h2>Earn Pup Coins!</h2>
        <div id="meter-game" style="margin:1.5rem 0;"></div>
        <button id="close-modal" style="margin-top:1rem;">Close</button>
      </div>
    </div>
  `;
  document.getElementById('close-modal').onclick = () => {
    modalContainer.innerHTML = '';
  };
  startMeterGame();
}

function startMeterGame() {
  const meterDiv = document.getElementById('meter-game');
  meterDiv.innerHTML = `
    <div style="position:relative;width:320px;height:40px;background:#e0e0e0;border-radius:20px;overflow:hidden;margin:auto;">
      <div id="meter-center" style="position:absolute;left:50%;top:0;width:8px;height:100%;background:#ffb300;transform:translateX(-50%);"></div>
      <div id="meter-buffer" style="position:absolute;left:46%;top:0;width:32px;height:100%;background:rgba(255,179,0,0.18);"></div>
      <div id="meter-indicator" style="position:absolute;left:0;top:0;width:16px;height:100%;background:#43cea2;border-radius:8px;"></div>
    </div>
    <div style="text-align:center;margin-top:1rem;">
      <button id="meter-click" style="font-size:1.2rem;padding:0.5rem 2rem;">Click!</button>
      <div id="meter-result" style="margin-top:0.7rem;font-weight:bold;"></div>
    </div>
  `;
  let pos = 0;
  let direction = 1;
  let interval = null;
  let isStopped = false;
  const indicator = document.getElementById('meter-indicator');
  const bufferStart = 0.46 * 320;
  const bufferEnd = 0.54 * 320;
  const center = 0.5 * 320;
  function move() {
    if (isStopped) return;
    pos += direction * 4;
    if (pos <= 0) { pos = 0; direction = 1; }
    if (pos >= 320-16) { pos = 320-16; direction = -1; }
    indicator.style.left = pos + 'px';
  }
  interval = setInterval(move, 10);
  document.getElementById('meter-click').onclick = () => {
    if (isStopped) return;
    isStopped = true;
    clearInterval(interval);
    let indicatorCenter = pos + 8;
    let result = '';
    if (Math.abs(indicatorCenter - center) < 4) {
      earnPupCoins(2);
      result = '<span style="color:#43cea2;">Perfect! +2 Pup Coins</span>';
    } else if (indicatorCenter >= bufferStart && indicatorCenter <= bufferEnd) {
      earnPupCoins(1);
      result = '<span style="color:#ff9800;">Close! +1 Pup Coin</span>';
    } else {
      result = '<span style="color:#d32f2f;">Miss! No coins</span>';
    }
    document.getElementById('meter-result').innerHTML = result;
    setTimeout(() => {
      document.getElementById('meter-result').innerHTML = '';
      pos = 0;
      direction = 1;
      indicator.style.left = pos + 'px';
      isStopped = false;
      interval = setInterval(move, 10);
    }, 900);
  };
}

// --- Shop ---
async function fetchShopItems() {
  // Always fetch from backend API, no offline/static JSON fallback
  const jwt = localStorage.getItem('jwt');
  if (!jwt) return { accessories: [], food: [] };
  const [accRes, foodRes] = await Promise.all([
    fetch('http://localhost:3001/api/shop/accessories', { headers: { 'Authorization': 'Bearer ' + jwt } }),
    fetch('http://localhost:3001/api/shop/food', { headers: { 'Authorization': 'Bearer ' + jwt } })
  ]);
  const accessories = (await accRes.json()).accessories || [];
  const food = (await foodRes.json()).food || [];
  return { accessories, food };
}

async function fetchInventory() {
  const jwt = localStorage.getItem('jwt');
  if (!jwt) return { accessories: [], food: [] };
  const res = await fetch('http://localhost:3001/api/shop/inventory', { headers: { 'Authorization': 'Bearer ' + jwt } });
  return await res.json();
}

async function showShopModal() {
  const shopDiv = document.createElement('div');
  shopDiv.innerHTML = '<div>Loading shop...</div>';
  showModal('Shop', shopDiv.outerHTML);
  const { accessories, food } = await fetchShopItems();
  let itemsHtml = '<h3>Accessories</h3>';
  itemsHtml += accessories.map(item =>
    `<div style='margin-bottom:1.2rem;padding:0.7rem 0.5rem 0.7rem 0.5rem;border-radius:10px;background:#f7f7f7;box-shadow:0 1px 4px #e0e0e0;display:flex;align-items:center;gap:16px;'>
      <img src='images/accessories/${item.image}' alt='${item.name}' style='width:40px;height:40px;vertical-align:middle;margin-right:10px;'>
      <div style='flex:1;'>
        <strong>${item.name}</strong> <span style='color:#888;font-size:0.95em;'>(${item.type})</span><br>
        <span style='font-size:0.97em;color:#555;'>${item.description || ''}</span>
      </div>
      <div style='text-align:right;'>
        <span style='font-weight:bold;color:#43cea2;font-size:1.1em;'>${item.price} 🪙</span><br>
        <button onclick='buyShopItemDynamic("accessory",${item.id},"${item.name}")'>Buy</button>
      </div>
    </div>`
  ).join('');
  itemsHtml += '<h3>Food</h3>';
  itemsHtml += food.map(item =>
    `<div style='margin-bottom:1rem;'>
      <img src='images/accessories/${item.image}' alt='${item.name}' style='width:32px;vertical-align:middle;margin-right:8px;'>
      <strong>${item.name}</strong> (${item.type})
      <button onclick='buyShopItemDynamic("food",${item.id},"${item.name}")'>Buy</button>
    </div>`
  ).join('');
  showModal('Shop', itemsHtml);
}

window.buyShopItemDynamic = async function(itemType, itemId, itemName) {
  const jwt = localStorage.getItem('jwt');
  // For demo, use a fixed price or fetch from backend if you add price column
  const price = 10;
  const res = await fetch('http://localhost:3001/api/yard/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify({ itemType, itemId, price })
  });
  const data = await res.json();
  if (data.success) {
    alert(`You bought and placed a ${itemName} in your yard!`);
    renderBackyard();
    fetchAndDisplayPupCoins();
  } else {
    alert(data.error || 'Purchase failed');
  }
  showShopModal();
}

async function showInventoryModal() {
  const invDiv = document.createElement('div');
  invDiv.innerHTML = '<div>Loading inventory...</div>';
  showModal('Your Inventory', invDiv.outerHTML);
  const { accessories, food } = await fetchInventory();
  let html = '<h3>Accessories</h3>';
  html += accessories.length ? accessories.map(a =>
    `<div style='margin-bottom:1rem;'><img src='images/accessories/${a.image}' alt='${a.name}' style='width:32px;vertical-align:middle;margin-right:8px;'><strong>${a.name}</strong> (${a.type})</div>`
  ).join('') : '<div>None</div>';
  html += '<h3>Food</h3>';
  html += food.length ? food.map(f =>
    `<div style='margin-bottom:1rem;'><img src='images/accessories/${f.image}' alt='${f.name}' style='width:32px;vertical-align:middle;margin-right:8px;'><strong>${f.name}</strong> (${f.type})</div>`
  ).join('') : '<div>None</div>';
  showModal('Your Inventory', html);
}

// --- Admin Section ---
function showAdminModal() {
  fetch('http://localhost:3001/api/auth/users', {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('jwt') || '') }
  })
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data.users)) {
        showModal('Admin', '<p>Not authorized or error loading users.</p>');
        return;
      }
      let usersHtml = data.users.map(user => `
        <div style='margin-bottom:1rem;'>
          <input value='${user.username}' id='edit-username-${user.id}' style='width:120px;'>
          <input type='password' placeholder='New password' id='edit-password-${user.id}' style='width:120px;'>
          <button onclick='updateUser(${user.id})'>Update</button>
          <button onclick='deleteUser(${user.id})' style='color:red;'>Delete</button>
        </div>
      `).join('');
      usersHtml += `<div style='margin-top:2rem;'><h3>Add User</h3>
        <input id='new-username' placeholder='Username' style='width:120px;'>
        <input id='new-password' type='password' placeholder='Password' style='width:120px;'>
        <button onclick='addUser()'>Add</button></div>`;
      showModal('Admin', usersHtml);
    });
}

async function updateUser(id) {
  const username = document.getElementById('edit-username-' + id).value;
  const password = document.getElementById('edit-password-' + id).value;
  await fetch('http://localhost:3001/api/auth/users/' + id, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem('jwt') || '')
    },
    body: JSON.stringify({ username, password })
  });
  showAdminModal();
}

async function deleteUser(id) {
  await fetch('http://localhost:3001/api/auth/users/' + id, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('jwt') || '') }
  });
  showAdminModal();
}

async function addUser() {
  const username = document.getElementById('new-username').value;
  const password = document.getElementById('new-password').value;
  await fetch('http://localhost:3001/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  showAdminModal();
}

function addAdminButton() {
  const header = document.querySelector('header');
  if (!document.getElementById('admin-btn')) {
    const btn = document.createElement('button');
    btn.id = 'admin-btn';
    btn.textContent = 'Admin';
    btn.onclick = showAdminModal;
    header.appendChild(btn);
  }
}
document.addEventListener('DOMContentLoaded', addAdminButton);

// Weather and day/night cycle integration
async function updateWeatherAndBackground() {
  // Get user's yard to determine location
  const jwt = localStorage.getItem('jwt');
  if (!jwt) return;
  const yardRes = await fetch('http://localhost:3001/api/yard', {
    headers: { 'Authorization': 'Bearer ' + jwt }
  });
  const yardData = await yardRes.json();
  if (!yardData.yard || !yardData.yard.location) return;
  const location = yardData.yard.location;
  // Fetch weather from backend
  const weatherRes = await fetch(`http://localhost:3001/api/weather?location=${encodeURIComponent(location)}`);
  const weather = await weatherRes.json();
  // Set background image based on weather and day/night
  let bg = 'day.png';
  if (!weather.isDay) {
    bg = 'night.png';
  } else if (weather.weather && weather.weather.toLowerCase().includes('rain')) {
    bg = 'rain.png';
  }
  document.getElementById('backyard').style.backgroundImage = `url('images/backgrounds/${bg}')`;
  // Optionally, update UI with weather info
  let weatherBar = document.getElementById('weather-bar');
  if (!weatherBar) {
    weatherBar = document.createElement('div');
    weatherBar.id = 'weather-bar';
    weatherBar.style = 'position:absolute;top:0;right:0;padding:0.5rem 1rem;background:rgba(255,255,255,0.8);border-radius:0 0 0 12px;font-weight:bold;z-index:10;';
    document.getElementById('backyard').appendChild(weatherBar);
  }
  weatherBar.textContent = `${weather.location}: ${weather.weather}, ${Math.round(weather.temp)}°F, ${weather.isDay ? 'Day' : 'Night'}`;
}

document.addEventListener('DOMContentLoaded', () => {
  // ...existing code...
  updateWeatherAndBackground();
});
