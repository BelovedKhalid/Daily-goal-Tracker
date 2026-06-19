const STORAGE_KEY = 'dailyGoalsAppData';
const settingsThemeToggle = document.getElementById('settingsThemeToggle');
const wallpaperFile = document.getElementById('wallpaperFile');
const wallpaperPreview = document.getElementById('wallpaperPreview');
const wallpaperClearButton = document.getElementById('wallpaperClearButton');
const notificationToggle = document.getElementById('notificationToggle');
const notificationSoundSelect = document.getElementById('notificationSoundSelect');
const soundPreviewButton = document.getElementById('soundPreviewButton');
const backButton = document.getElementById('backButton');
const settingsMessage = document.getElementById('settingsMessage');

let appState = {
  theme: 'light',
  wallpaperImage: '',
  notificationsEnabled: false,
  notificationSound: 'chime',
};

function getStoredState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Could not parse stored settings', error);
    return null;
  }
}

function saveSettingsState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  appState.theme = theme;
  if (settingsThemeToggle) {
    settingsThemeToggle.textContent = theme === 'dark' ? '☀' : '☾';
    settingsThemeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

function applyWallpaper(image) {
  appState.wallpaperImage = image || '';
  if (image) {
    document.body.style.setProperty('--wallpaper', `url("${image}")`);
    document.body.classList.add('has-wallpaper');
  } else {
    document.body.style.setProperty('--wallpaper', 'none');
    document.body.classList.remove('has-wallpaper');
  }
  updateWallpaperPreview(image);
}

function updateNotificationToggle(enabled) {
  appState.notificationsEnabled = enabled;
  if (notificationToggle) {
    notificationToggle.textContent = enabled ? 'On' : 'Off';
    notificationToggle.setAttribute('aria-label', enabled ? 'Turn notifications off' : 'Turn notifications on');
  }
}

function updateWallpaperPreview(image) {
  if (!wallpaperPreview) return;
  if (image) {
    wallpaperPreview.style.backgroundImage = `url("${image}")`;
    wallpaperPreview.textContent = '';
  } else {
    wallpaperPreview.style.backgroundImage = 'none';
    wallpaperPreview.textContent = 'No wallpaper selected';
  }
}

function showSettingsMessage(message, type = 'info') {
  if (!settingsMessage) return;
  settingsMessage.textContent = message;
  settingsMessage.style.color = type === 'error' ? 'var(--danger)' : 'var(--muted)';
}

function handleThemeToggle() {
  const nextTheme = appState.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  saveSettingsState();
  showSettingsMessage(`Theme switched to ${nextTheme}.`);
}

const NOTIFICATION_SOUNDS = ['chime', 'bell', 'ping'];
let audioContext = null;

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
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.4);
  } else if (soundKey === 'ping') {
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(1700, now + 0.3);
    gain.gain.setValueAtTime(0.0001, now + 0.4);
  } else {
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
  }

  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.5);
}

function handleNotificationSoundChange(event) {
  const selected = event.target.value;
  if (!NOTIFICATION_SOUNDS.includes(selected)) return;
  appState.notificationSound = selected;
  saveSettingsState();
  showSettingsMessage(`Notification sound set to ${selected}.`);
}

function handleNotificationToggle() {
  if (!('Notification' in window)) {
    showSettingsMessage('Notifications are not supported in this browser.', 'error');
    return;
  }

  const nextEnabled = !appState.notificationsEnabled;
  if (nextEnabled && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        updateNotificationToggle(true);
        saveSettingsState();
        showSettingsMessage('Notifications are on. You will receive reminders when due.');
      } else {
        updateNotificationToggle(false);
        saveSettingsMessage('Notifications remain off. Permission was not granted.', 'error');
      }
    });
  } else if (nextEnabled && Notification.permission === 'denied') {
    updateNotificationToggle(false);
    saveSettingsMessage('Notifications are blocked in your browser settings.', 'error');
  } else {
    updateNotificationToggle(nextEnabled);
    saveSettingsState();
    showSettingsMessage(nextEnabled ? 'Notifications are on.' : 'Notifications are off.');
  }
}

function handleWallpaperFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const value = reader.result;
    applyWallpaper(value);
    saveSettingsState();
    showSettingsMessage('Wallpaper updated.');
  };
  reader.readAsDataURL(file);
}

function handleWallpaperClear() {
  if (wallpaperFile) wallpaperFile.value = '';
  applyWallpaper('');
  saveSettingsState();
  showSettingsMessage('Wallpaper cleared.');
}

function initSettingsPage() {
  const stored = getStoredState();
  if (stored) {
    appState = {
      ...appState,
      ...stored,
      theme: stored.theme || appState.theme,
      wallpaperImage: stored.wallpaperImage || appState.wallpaperImage,
      notificationsEnabled: typeof stored.notificationsEnabled === 'boolean' ? stored.notificationsEnabled : appState.notificationsEnabled,
    };
  }

  applyTheme(appState.theme);
  applyWallpaper(appState.wallpaperImage);
  updateNotificationToggle(appState.notificationsEnabled);
  if (notificationSoundSelect) {
    notificationSoundSelect.value = appState.notificationSound || 'chime';
  }

  settingsThemeToggle?.addEventListener('click', handleThemeToggle);
  notificationToggle?.addEventListener('click', handleNotificationToggle);
  notificationSoundSelect?.addEventListener('change', handleNotificationSoundChange);
  soundPreviewButton?.addEventListener('click', () => playSoundPreset(appState.notificationSound || 'chime'));
  wallpaperFile?.addEventListener('change', handleWallpaperFile);
  wallpaperClearButton?.addEventListener('click', handleWallpaperClear);
  backButton?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

initSettingsPage();
