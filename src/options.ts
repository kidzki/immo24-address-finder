import type { Settings, MapProvider, Position, Theme, LocaleOverride } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API: any = (typeof browser !== 'undefined') ? (browser as any) : chrome;

const FEEDBACK_MESSAGE_DURATION = 1500;

const DEFAULTS: Settings = {
  mapProvider: 'google',
  autoCopy: false,
  showEarth: true,
  showDates: true,
  position: 'bottom-right',
  theme: 'dark',
  localeOverride: 'auto'
};

async function loadLocaleBundle(locale: string): Promise<Record<string, string> | null> {
  try {
    const url = API.runtime.getURL(`_locales/${locale}/messages.json`);
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries<any>(data)) flat[k] = (v && v.message) || '';
    return flat;
  } catch {
    return null;
  }
}

async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    if (!API?.storage?.sync) {
      resolve(DEFAULTS);
      return;
    }
    API.storage.sync.get(DEFAULTS, (items: Settings) => {
      if (API.runtime.lastError) {
        resolve(DEFAULTS);
      } else {
        resolve(items);
      }
    });
  });
}

// Initialize translation function
let t = (k: string) => (API?.i18n?.getMessage ? API.i18n.getMessage(k) : k);

async function initializeTranslations() {
  const settings = await getSettings();
  
  if (settings.localeOverride && settings.localeOverride !== 'auto') {
    const bundle = await loadLocaleBundle(settings.localeOverride);
    if (bundle) {
      t = (k: string) => (k in bundle ? bundle[k] : k);
    }
  }
  
  applyTranslations();
}

function applyTranslations() {
  // i18n in DOM anwenden (Texte mit data-i18n ersetzen)
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    
    const msg = t(key);
    if (!msg) return;
    
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      (el as HTMLInputElement | HTMLTextAreaElement).placeholder = msg;
      return;
    }
    
    if (el.tagName === 'TITLE') {
      document.title = msg;
      return;
    }
    
    el.textContent = msg;
  });
}

const form = document.getElementById('form') as (HTMLFormElement & {
  mapProvider: HTMLSelectElement;
  autoCopy: HTMLInputElement;
  showEarth: HTMLInputElement;
  showDates: HTMLInputElement;
  position: HTMLSelectElement;
  theme: HTMLSelectElement;
  localeOverride?: HTMLSelectElement;
}) | null;
const status = document.getElementById('status') as HTMLElement | null;

// Store previous locale to detect changes
let previousLocale: string = DEFAULTS.localeOverride;

function load() {
  if (!form) return;
  
  try {
    API.storage.sync.get(DEFAULTS, (items: Settings) => {
      form.mapProvider.value = items.mapProvider;
      form.autoCopy.checked = !!items.autoCopy;
      form.showEarth.checked = !!items.showEarth;
      form.showDates.checked = items.showDates !== false;
      form.position.value = items.position;
      form.theme.value = items.theme;
      if ((form as any).localeOverride) {
        (form as any).localeOverride.value = items.localeOverride || 'auto';
        previousLocale = items.localeOverride || 'auto';
      }
    });
    return;
  } catch {
    // Fallback to defaults on error
  }
  
  form.mapProvider.value = DEFAULTS.mapProvider;
  form.autoCopy.checked = DEFAULTS.autoCopy;
  form.showEarth.checked = DEFAULTS.showEarth;
  form.showDates.checked = DEFAULTS.showDates;
  form.position.value = DEFAULTS.position;
  form.theme.value = DEFAULTS.theme;
  if ((form as any).localeOverride) {
    (form as any).localeOverride.value = DEFAULTS.localeOverride;
    previousLocale = DEFAULTS.localeOverride;
  }
}

function showSuccessMessage() {
  if (!status) return;
  
  status.textContent = t('optSaved') || 'Saved ✓';
  setTimeout(() => {
    if (status) status.textContent = '';
  }, FEEDBACK_MESSAGE_DURATION);
}

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form) return;
  
  const newLocale = (form as any).localeOverride 
    ? (form as any).localeOverride.value as LocaleOverride 
    : 'auto';
  
  const data: Settings = {
    mapProvider: form.mapProvider.value as MapProvider,
    autoCopy: form.autoCopy.checked,
    showEarth: form.showEarth.checked,
    showDates: form.showDates.checked,
    position: form.position.value as Position,
    theme: form.theme.value as Theme,
    localeOverride: newLocale
  };
  
  const localeChanged = newLocale !== previousLocale;
  
  try {
    API.storage.sync.set(data, () => {
      if (localeChanged) {
        // Reload page to apply new language
        window.location.reload();
      } else {
        showSuccessMessage();
      }
    });
  } catch {
    if (localeChanged) {
      window.location.reload();
    } else {
      showSuccessMessage();
    }
  }
});

// Display version number
function displayVersion() {
  const versionEl = document.getElementById('version');
  if (!versionEl) return;
  
  try {
    const manifest = API.runtime.getManifest();
    versionEl.textContent = manifest.version || 'dev';
  } catch {
    versionEl.textContent = 'dev';
  }
}

// Initialize app: translations first, then load form and display version
(async () => {
  await initializeTranslations();
  load();
  displayVersion();
})();
