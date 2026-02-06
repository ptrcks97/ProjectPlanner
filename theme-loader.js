const DEFAULT_THEME = 'White_Blue';
const ALLOWED_THEMES = new Set(['White_Blue', 'Fancy_Dark', 'Senfgelb_Black', 'Ocean_Thunder']);
const CONFIG_PATH = 'config.json';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// Set default immediately to avoid FOUC.
applyTheme(DEFAULT_THEME);

fetch(CONFIG_PATH, { cache: 'no-store' })
  .then((res) => (res.ok ? res.json() : null))
  .then((data) => {
    const theme = data?.theme;
    if (ALLOWED_THEMES.has(theme)) {
      applyTheme(theme);
    } else {
      applyTheme(DEFAULT_THEME);
    }
  })
  .catch(() => applyTheme(DEFAULT_THEME));
