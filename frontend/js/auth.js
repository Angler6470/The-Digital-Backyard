// Authentication logic for login/signup/logout
// Handles user session and communicates with backend

function showLoginModal() {
  const modalContainer = document.getElementById('modal-container');
  modalContainer.innerHTML = `
    <div class="modal-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
      <div class="modal" style="background:#fffbe7;padding:2.5rem 2rem 2rem 2rem;border-radius:18px;min-width:320px;max-width:95vw;box-shadow:0 8px 32px rgba(24,90,157,0.18),0 2px 8px #ffb300 inset;border:4px solid #ffb300;position:relative;">
        <button id="close-login-modal" style="position:absolute;top:10px;right:10px;background:#ffb300;color:#fff;border:none;border-radius:50%;width:32px;height:32px;font-size:1.3rem;cursor:pointer;box-shadow:0 2px 8px #ffb30055;">×</button>
        <h2 style="font-family:'Fredoka One',cursive;color:#185a9d;text-align:center;margin-bottom:1.5rem;">Login</h2>
        <input id="login-username" placeholder="Username" style="display:block;margin-bottom:1rem;width:100%;padding:0.6rem 1rem;font-size:1.1rem;border-radius:8px;border:1.5px solid #43cea2;">
        <input id="login-password" type="password" placeholder="Password" style="display:block;margin-bottom:1.2rem;width:100%;padding:0.6rem 1rem;font-size:1.1rem;border-radius:8px;border:1.5px solid #43cea2;">
        <div style="display:flex;justify-content:center;gap:1rem;">
          <button id="login-btn" style="background:linear-gradient(90deg,#43cea2,#185a9d);color:#fff;font-weight:bold;padding:0.7rem 1.5rem;border:none;border-radius:25px;font-size:1.1rem;cursor:pointer;">Login</button>
          <button id="signup-btn" style="background:linear-gradient(90deg,#ffb300,#ff9800);color:#fff;font-weight:bold;padding:0.7rem 1.5rem;border:none;border-radius:25px;font-size:1.1rem;cursor:pointer;">Sign Up</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('close-login-modal').onclick = () => {
    modalContainer.innerHTML = '';
  };
  document.getElementById('login-btn').onclick = () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    loginUser(username, password);
  };
  document.getElementById('signup-btn').onclick = () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    signupUser(username, password);
  };
}

// Show logged-in user in cartoonish badge in top right
function showLoggedInUserBadge(username) {
  let badge = document.getElementById('user-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'user-badge';
    badge.style = 'position:fixed;top:18px;right:18px;z-index:2000;background:linear-gradient(90deg,#43cea2,#ffb300);color:#fff;padding:0.7rem 1.5rem;border-radius:30px 12px 30px 12px;font-family:"Fredoka One",cursive;font-size:1.1rem;box-shadow:0 2px 12px #185a9d55,0 2px 8px #ffb30055;display:flex;align-items:center;gap:0.7rem;';
    badge.innerHTML = `<span style="font-size:1.5rem;">🐦</span> <span id="user-badge-name"></span>`;
    document.body.appendChild(badge);
  }
  document.getElementById('user-badge-name').textContent = username;
}

async function loginUser(username, password) {
  try {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem('jwt', data.token);
      onLoginSuccess();
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (err) {
    alert('Network error');
  }
}

async function signupUser(username, password) {
  try {
    const res = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem('jwt', data.token);
      onLoginSuccess();
    } else {
      alert(data.error || 'Signup failed');
    }
  } catch (err) {
    alert('Network error');
  }
}

function logoutUser() {
  localStorage.removeItem('jwt');
  // Optionally, reload the page or reset UI state
  showLoginModal();
}

// Patch onLoginSuccess to show badge
async function onLoginSuccess() {
  // ...existing code...
  // Fetch username from backend (or decode from JWT if available)
  const jwt = localStorage.getItem('jwt');
  let username = '';
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    username = payload.username;
  } catch {}
  if (username) showLoggedInUserBadge(username);
  // Show a login notification
  const badge = document.getElementById('user-badge');
  if (badge) {
    badge.style.boxShadow = '0 0 16px 4px #43cea2,0 2px 12px #185a9d55,0 2px 8px #ffb30055';
    badge.style.transition = 'box-shadow 0.5s';
    badge.innerHTML += '<span id="login-success-msg" style="margin-left:1rem;font-size:1em;color:#43cea2;font-weight:bold;">Logged in!</span>';
    setTimeout(() => {
      const msg = document.getElementById('login-success-msg');
      if
