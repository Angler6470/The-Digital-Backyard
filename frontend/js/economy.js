// Economy and shop logic for pup coins and accessories
// Handles earning, spending, and displaying currency

let pupCoins = 0;

const pupDenominations = [
  { value: 50, image: 'images/pups/pup4.png' },
  { value: 25, image: 'images/pups/pup3.png' },
  { value: 10, image: 'images/pups/pup2.png' },
  { value: 5, image: 'images/pups/pup1.png' }
];

async function fetchAndDisplayPupCoins() {
  const jwt = localStorage.getItem('jwt');
  if (!jwt) return;
  const res = await fetch('http://localhost:3001/api/yard/coins', {
    headers: { 'Authorization': 'Bearer ' + jwt }
  });
  const data = await res.json();
  if (data.pup_coins !== undefined) {
    pupCoins = data.pup_coins;
    updatePupCoinDisplay();
  }
}

// Patch earnPupCoins to use backend
async function earnPupCoins(amount) {
  const jwt = localStorage.getItem('jwt');
  if (!jwt) return;
  const res = await fetch('http://localhost:3001/api/yard/earn-coins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify({ amount })
  });
  const data = await res.json();
  if (data.pup_coins !== undefined) {
    pupCoins = data.pup_coins;
    updatePupCoinDisplay();
  }
}

function spendPupCoins(amount) {
  if (pupCoins >= amount) {
    pupCoins -= amount;
    updatePupCoinDisplay();
    return true;
  }
  return false;
}

function updatePupCoinDisplay() {
  const display = document.getElementById('pup-coins');
  if (!display) return;
  let remaining = pupCoins;
  let html = '';
  pupDenominations.forEach(denom => {
    const count = Math.floor(remaining / denom.value);
    if (count > 0) {
      html += `<img src='${denom.image}' alt='${denom.value} Pup Coin' style='width:28px;vertical-align:middle;margin-right:2px;'> x${count} `;
      remaining -= count * denom.value;
    }
  });
  if (html === '') html = '0';
  display.innerHTML = html;
}

// TODO: Shop logic for buying food, accessories, upgrades
// TODO: Use different 'pup' denominations for higher values

// On login, fetch real coin balance
async function onLoginSuccess() {
  // ...existing code...
  await fetchAndDisplayPupCoins();
  // ...existing code...
}

// After purchases, refresh coin display
function buyShopItem(idx) {
  // ...existing code...
      if (data.success) {
        alert(`You bought and placed a ${item.name} in your yard!`);
        renderBackyard();
        fetchAndDisplayPupCoins();
      } else {
        alert(data.error || 'Purchase failed');
      }
      showShopModal(); // Refresh shop modal
// ...existing code...
}
