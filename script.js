const STORAGE_KEY = 'dailyGoalsAppData';
const goalText = document.getElementById('goalText');
const goalTime = document.getElementById('goalTime');
const addGoalButton = document.getElementById('addGoalButton');
const goalList = document.getElementById('goalList');
const pendingCount = document.getElementById('pendingCount');
const completedCount = document.getElementById('completedCount');
const missedCount = document.getElementById('missedCount');
const finalMessage = document.getElementById('finalMessage');
const successList = document.getElementById('successList');
const missedList = document.getElementById('missedList');
const settingsButton = document.getElementById('settingsButton');
const notificationsButton = document.getElementById('notifyButton');
const notificationWarning = document.getElementById('notificationWarning');
const progressSummary = document.getElementById('progressSummary');
const userWelcome = document.getElementById('userWelcome');
const currentTime = document.getElementById('currentTime');
const currentDateDisplay = document.getElementById('currentDate');
const calendarMonthYear = document.getElementById('calendarMonthYear');
const calendarGrid = document.getElementById('calendarGrid');
const calendarPrev = document.getElementById('calendarPrev');
const calendarNext = document.getElementById('calendarNext');

let appState = {
  date: getTodayKey(),
  goals: [],
  history: [],
  theme: 'light',
  userName: '',
  wallpaperImage: '',
  notificationsEnabled: false,
  notificationSound: 'chime',
};

let calendarDate = new Date();

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed) {
        appState = { ...appState, ...parsed };
      }
    } catch (error) {
      console.error('Could not parse stored goals', error);
    }
  }

  if (!appState.theme) {
    appState.theme = 'light';
  }
  if (!appState.userName) {
    appState.userName = '';
  }
  if (!appState.wallpaperImage) {
    appState.wallpaperImage = '';
  }
  if (typeof appState.notificationsEnabled !== 'boolean') {
    appState.notificationsEnabled = false;
  }

  setTheme(appState.theme);
  applyWallpaper();
  renderUserGreeting();

  if (appState.date !== getTodayKey()) {
    finalizePreviousDay(appState);
    appState = {
      date: getTodayKey(),
      goals: [],
      history: appState.history || [],
      theme: appState.theme,
      userName: appState.userName || '',
    };
    saveState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  appState.theme = theme;
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀' : '☾';
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

function toggleTheme() {
  const nextTheme = appState.theme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
  saveState();
}

function applyWallpaper() {
  const wallpaperValue = appState.wallpaperImage ? `url("${appState.wallpaperImage}")` : 'none';
  document.body.style.setProperty('--wallpaper', wallpaperValue);
  if (appState.wallpaperImage) {
    document.body.classList.add('has-wallpaper');
  } else {
    document.body.classList.remove('has-wallpaper');
  }
}

function finalizePreviousDay(previousState) {
  const completed = previousState.goals.filter(goal => goal.status === 'completed').length;
  const missed = previousState.goals.filter(goal => goal.status !== 'completed').length;
  const date = previousState.date;
  if (!date || previousState.goals.length === 0) return;

  if (missed === 0) {
    showSummaryMessage(`Nice work! All goals were done. Add tomorrow’s goals when you're ready.`);
    addHistoryItem('successes', `${date} - ${completed} goals completed`, date);
  } else {
    showSummaryMessage(`Keep going. ${missed} goal${missed === 1 ? '' : 's'} were not accomplished today; try again tomorrow.`);
    addHistoryItem('missed', `${date} - ${missed} not accomplished`, date);
  }

  saveHistory();
}

function addHistoryItem(type, text, date) {
  appState.history = appState.history || [];
  appState.history.push({ type, text, date, id: crypto.randomUUID() });
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function showSummaryMessage(message) {
  finalMessage.textContent = message;
}

function renderUserGreeting() {
  if (!userWelcome) return;
  if (appState.userName) {
    userWelcome.textContent = `Welcome back, ${appState.userName}! Let’s crush today.`;
  } else {
    userWelcome.textContent = 'Welcome! Sign up to personalize your experience.';
  }
}

function formatTime(value) {
  return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(value) {
  return value.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function updateClock() {
  const now = new Date();
  if (currentTime) currentTime.textContent = formatTime(now);
  if (currentDateDisplay) currentDateDisplay.textContent = formatDate(now);
}

function renderCalendar(date) {
  if (!calendarMonthYear || !calendarGrid) return;
  const year = date.getFullYear();
  const month = date.getMonth();
  calendarMonthYear.textContent = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const highlightedDates = new Set((appState.history || []).map(entry => entry.date));

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarGrid.innerHTML = weekdays.map(day => `<div class="calendar-weekday">${day}</div>`).join('');

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const totalCells = 42;
  let cells = '';

  for (let i = 0; i < firstDay; i++) {
    const day = prevMonthDays - firstDay + 1 + i;
    cells += `<div class="calendar-day calendar-inactive">${day}</div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
    const hasGoals = highlightedDates.has(dateKey) || (dateKey === getTodayKey() && appState.goals.length > 0);
    cells += `<div class="calendar-day${isToday ? ' calendar-today' : ''}${hasGoals ? ' calendar-highlight' : ''}">${day}</div>`;
  }

  const nextDays = totalCells - firstDay - daysInMonth;
  for (let day = 1; day <= nextDays; day++) {
    cells += `<div class="calendar-day calendar-inactive">${day}</div>`;
  }

  calendarGrid.innerHTML += cells;
}

function changeCalendarMonth(offset) {
  calendarDate.setMonth(calendarDate.getMonth() + offset);
  renderCalendar(calendarDate);
}


function renderGoals() {
  goalList.innerHTML = '';

  appState.goals.sort((a, b) => a.time.localeCompare(b.time));

  let pending = 0;
  let completed = 0;
  let missed = 0;

  appState.goals.forEach(goal => {
    const item = document.createElement('li');
    item.className = 'goal-item';

    const description = document.createElement('div');
    description.className = 'goal-description';
    description.innerHTML = `<span>${goal.text}</span><span class="goal-time">${goal.time}</span>`;

    const status = document.createElement('span');
    status.className = `goal-status status-${goal.status}`;
    status.textContent = goal.status.replace('_', ' ');

    if (goal.status === 'pending') pending += 1;
    if (goal.status === 'completed') completed += 1;
    if (goal.status === 'missed') missed += 1;

    const actions = document.createElement('div');
    actions.className = 'goal-actions';

    const completeButton = document.createElement('button');
    completeButton.className = 'complete';
    if (goal.status === 'completed') {
      completeButton.textContent = 'Completed';
      completeButton.disabled = true;
    } else {
      completeButton.textContent = 'Complete';
      completeButton.addEventListener('click', () => markCompleted(goal.id));
    }

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete';
    deleteButton.addEventListener('click', () => deleteGoal(goal.id));

    actions.appendChild(completeButton);
    actions.appendChild(deleteButton);

    item.appendChild(description);
    item.appendChild(status);
    item.appendChild(actions);
    goalList.appendChild(item);
  });

  pendingCount.textContent = pending;
  completedCount.textContent = completed;
  missedCount.textContent = missed;
  updateProgressSummary();
}

function updateProgressSummary() {
  if (!progressSummary) return;
  const total = appState.goals.length;
  const completed = appState.goals.filter(goal => goal.status === 'completed').length;
  const pending = appState.goals.filter(goal => goal.status === 'pending').length;

  if (total === 0) {
    progressSummary.textContent = 'Add your first goal to get started.';
  } else if (pending === 0) {
    progressSummary.textContent = `Awesome work, ${appState.userName || 'champ'}! You completed all ${completed} goal${completed === 1 ? '' : 's'} today.`;
  } else {
    progressSummary.textContent = `${completed} of ${total} goals complete. Keep the momentum going.`;
  }
}

function renderHistory() {
  successList.innerHTML = '';
  missedList.innerHTML = '';

  (appState.history || []).forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry.text;
    if (entry.type === 'successes') successList.appendChild(li);
    if (entry.type === 'missed') missedList.appendChild(li);
  });
}

let audioContext = null;
const NOTIFICATION_SOUNDS = ['chime', 'bell', 'ping'];

function initAudioContext() {
  if (audioContext) return audioContext;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  audioContext = new AudioCtx();
  return audioContext;
}

function playSoundPreset(soundKey) {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  gain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = 'sine';

  if (soundKey === 'bell') {
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.35);
  } else if (soundKey === 'ping') {
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.25);
  } else {
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
  }

  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.5);
}

function playNotificationSound() {
  const sound = NOTIFICATION_SOUNDS.includes(appState.notificationSound) ? appState.notificationSound : 'chime';
  playSoundPreset(sound);
}

function updateReminderBadge() {
  const pending = appState.goals.filter(goal => goal.status === 'pending').length;
  document.title = pending ? `(${pending}) Daily Goals Tracker` : 'Daily Goals Tracker';
}

function timeDiffMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  return Math.round((target - now) / 60000);
}

function addGoal() {
  const text = goalText.value.trim();
  const time = goalTime.value;

  if (!text || !time) {
    alert('Please enter both a goal and a time.');
    return;
  }

  appState.goals.push({
    id: crypto.randomUUID(),
    text,
    time,
    status: 'pending',
    alerted: false,
  });

  goalText.value = '';
  goalTime.value = '';
  saveState();
  renderGoals();
  requestNotificationPermission();
}

function deleteGoal(id) {
  appState.goals = appState.goals.filter(goal => goal.id !== id);
  saveState();
  renderGoals();
}

function markCompleted(id) {
  const goal = appState.goals.find(goal => goal.id === id);
  if (!goal) return;
  goal.status = 'completed';
  saveState();
  renderGoals();
}

let serviceWorkerRegistration = null;

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register('sw.js');
    console.log('Service worker registered');
  } catch (error) {
    console.error('Service worker registration failed:', error);
  }
}

function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function isSecureAppContext() {
  const host = location.hostname;
  return window.isSecureContext || host === 'localhost' || host === '127.0.0.1';
}

function updateNotificationWarning() {
  if (!notificationWarning) return;
  if (!('Notification' in window)) {
    notificationWarning.textContent = 'This browser does not support notifications.';
    notificationWarning.classList.remove('hidden');
    return;
  }
  if (!isSecureAppContext()) {
    notificationWarning.textContent = 'Notifications and service workers require HTTPS or localhost. Open the app via http://localhost or install it as a PWA to enable full reminders.';
    notificationWarning.classList.remove('hidden');
  } else {
    notificationWarning.classList.add('hidden');
  }
}

function showNotification(title, body) {
  if (!appState.notificationsEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (serviceWorkerRegistration?.showNotification) {
    serviceWorkerRegistration.showNotification(title, { body });
  } else {
    new Notification(title, { body });
  }
}

function updateNotificationsButton() {
  if (!notificationsButton) return;
  if (!('Notification' in window)) {
    notificationsButton.textContent = 'Notifications unavailable';
    notificationsButton.disabled = true;
  } else if (Notification.permission === 'granted') {
    notificationsButton.textContent = 'Notifications enabled';
    notificationsButton.disabled = true;
  } else {
    notificationsButton.textContent = 'Activate notifications';
    notificationsButton.disabled = false;
  }
  updateNotificationWarning();
}

function enableNotifications() {
  if (!('Notification' in window)) return;
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      showNotification('Notifications active', 'You will now receive reminders when goals are due.');
    }
    updateNotificationsButton();
  });
}

function checkReminders() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);

  let changed = false;
  appState.goals.forEach(goal => {
    if (goal.status === 'pending' && !goal.alerted && currentTime >= goal.time) {
      showNotification('Daily Goals Reminder', `${goal.text} - scheduled for ${goal.time}`);
      playNotificationSound();
      goal.alerted = true;
      changed = true;
    }
  });

  if (changed) {
    saveState();
  }
  renderGoals();
}

function scheduleDayEnd() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const delay = tomorrow - now;
  setTimeout(() => {
    appState.goals.forEach(goal => {
      if (goal.status === 'pending') {
        goal.status = 'missed';
      }
    });
    finalizePreviousDay(appState);
    appState = {
      date: getTodayKey(),
      goals: [],
      history: appState.history || [],
    };
    saveState();
    renderGoals();
    renderHistory();
    scheduleDayEnd();
  }, delay);
}

function init() {
  loadState();
  if (!appState.userName) {
    window.location.href = 'signup.html';
    return;
  }

  renderGoals();
  renderHistory();
  showSummaryMessage('Enter your goals for today, and the app will remind you when the time arrives.');

  registerServiceWorker();
  addGoalButton.addEventListener('click', addGoal);
  settingsButton?.addEventListener('click', () => window.location.href = 'settings.html');
  calendarPrev?.addEventListener('click', () => changeCalendarMonth(-1));
  calendarNext?.addEventListener('click', () => changeCalendarMonth(1));
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  requestNotificationPermission();

  updateNotificationsButton();
  updateNotificationWarning();
  updateClock();
  setInterval(updateClock, 1000);
  renderCalendar(calendarDate);
  checkReminders();
  setInterval(checkReminders, 30000);
  scheduleDayEnd();
  setupInstallPrompt();
}

let deferredPrompt = null;

function setupInstallPrompt() {
  const installPrompt = document.getElementById('installPrompt');
  const installButton = document.getElementById('installButton');
  const dismissInstallButton = document.getElementById('dismissInstallButton');

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    if (installPrompt) {
      installPrompt.classList.remove('hidden');
    }
  });

  installButton?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    deferredPrompt = null;
    if (installPrompt) {
      installPrompt.classList.add('hidden');
    }
  });

  dismissInstallButton?.addEventListener('click', () => {
    deferredPrompt = null;
    if (installPrompt) {
      installPrompt.classList.add('hidden');
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('App was installed');
    deferredPrompt = null;
    if (installPrompt) {
      installPrompt.classList.add('hidden');
    }
  });
}

init();
