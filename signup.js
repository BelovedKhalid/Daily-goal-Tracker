const STORAGE_KEY = 'dailyGoalsAppData';
const signupForm = document.getElementById('signupForm');
const signupName = document.getElementById('signupName');
const signupClearButton = document.getElementById('signupClearButton');
const signupMessage = document.getElementById('signupMessage');
const continueButton = document.getElementById('continueButton');

function getStoredState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Could not parse stored signup state', error);
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function initSignupPage() {
  const stored = getStoredState();
  if (stored?.userName) {
    signupMessage.textContent = `Welcome back, ${stored.userName}!`;
    signupMessage.style.color = '#15803d';
    signupName.value = stored.userName;
    continueButton.classList.remove('hidden');
    continueButton.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  signupForm.addEventListener('submit', event => {
    event.preventDefault();
    submitSignup();
  });

  signupClearButton.addEventListener('click', () => {
    signupName.value = '';
    signupMessage.textContent = '';
  });
}

function submitSignup() {
  const name = signupName.value.trim();
  if (!name) {
    signupMessage.textContent = 'Please enter your name to continue.';
    signupMessage.style.color = '#b91c1c';
    return;
  }

  const stored = getStoredState() || {};
  const updated = {
    ...stored,
    userName: name,
    theme: stored?.theme || 'light',
    date: stored?.date || new Date().toISOString().slice(0, 10),
    goals: stored?.goals || [],
    history: stored?.history || [],
  };

  saveState(updated);
  window.location.href = 'index.html';
}

initSignupPage();
