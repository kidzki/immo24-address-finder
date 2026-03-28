import { decodeAddress } from '@immo24/decoder';
import { extractMetadata, parseIS24FromScripts } from '@immo24/metadata';
import type { ExposeMetadata } from '@immo24/metadata';
import type { Address, Settings, ToggleOverlayMessage } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API: any = (typeof browser !== 'undefined') ? (browser as any) : chrome;

// Constants
const MUTATION_OBSERVER_DELAY = 300;
const URL_CHECK_INTERVAL = 500;
const FEEDBACK_MESSAGE_DURATION = 1500;

(async function () {
  const DEFAULTS: Settings = {
    mapProvider: 'google',
    autoCopy: false,
    showEarth: true,
    showDates: true,
    position: 'bottom-right',
    theme: 'dark',
    localeOverride: 'auto'
  };

  function getSettings(): Promise<Settings> {
    return new Promise(resolve => {
      try {
        API.storage.sync.get(DEFAULTS, (items: Partial<Settings>) => resolve({ ...DEFAULTS, ...items }));
      } catch {
        resolve(DEFAULTS);
      }
    });
  }

  async function loadLocaleBundle(locale: string): Promise<Record<string, string> | null> {
    try {
      const response = await API.runtime.sendMessage({ 
        type: 'getLocaleData', 
        locale: locale
      });
      
      if (response && response.data) {
        return response.data;
      }
      
      return null;
    } catch (e) {
      console.error('[ImmoScout24 Decoder] Failed to load locale bundle:', e);
      return null;
    }
  }

  const settings = await getSettings();

  let t = (k: string) => (API?.i18n?.getMessage ? API.i18n.getMessage(k) : k);
  
  if (settings.localeOverride && settings.localeOverride !== 'auto') {
    const bundle = await loadLocaleBundle(settings.localeOverride);
    if (bundle) {
      t = (k: string) => (k in bundle ? bundle[k] : k);
    }
  }

  function extractEncodedFromScripts(): string | null {
    const re = /"obj_telekomInternetUrlAddition"\s*:\s*"([^"]+)"/g;
    for (const s of Array.from(document.scripts)) {
      const txt = s.textContent || '';
      let m: RegExpExecArray | null;
      while ((m = re.exec(txt)) !== null) {
        if (m[1]) return m[1];
      }
    }
    const html = document.documentElement.innerHTML;
    const m2 = html.match(/"obj_telekomInternetUrlAddition"\s*:\s*"([^"]+)"/);
    return m2 ? m2[1] : null;
  }

  function extractIs24Object(): unknown {
    return parseIS24FromScripts(document);
  }

  async function copyToClipboard(text: string): Promise<boolean> {
    // Try modern Clipboard API first
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to legacy method
      }
    }
    
    // Fallback to legacy execCommand method
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.readOnly = true;
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      
      return ok;
    } catch {
      return false;
    }
  }

  let overlayEl: HTMLDivElement | null = null;
  let overlayState: 'hidden' | 'visible' | 'dismissed' = 'hidden';

  function overlayBaseStyle(theme: Settings['theme'], position: Settings['position']) {
    const palette = (theme === 'light')
      ? { bg: '#ffffff', fg: '#111827', border: 'rgba(0,0,0,.1)', shadow: 'rgba(0,0,0,.15)' }
      : { bg: '#111827', fg: '#ffffff', border: 'rgba(255,255,255,.08)', shadow: 'rgba(0,0,0,.25)' };
    const insetMap: Record<string, string> = {
      'bottom-right': 'inset: auto 16px 16px auto;',
      'bottom-left': 'inset: auto auto 16px 16px;',
      'top-right': 'inset: 16px 16px auto auto;',
      'top-left': 'inset: 16px auto auto 16px;'
    };
    return `
      position: fixed; ${insetMap[position] || insetMap['bottom-right']} z-index: 2147483647;
      background: ${palette.bg}; color: ${palette.fg}; font: 13px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;
      border-radius: 12px; box-shadow: 0 8px 24px ${palette.shadow}; padding: 12px 14px; min-width: 280px; max-width: 360px;
      border: 1px solid ${palette.border}; display: none;
    `;
  }
  function buttonStyle(theme: Settings['theme']) {
    const primaryBg = '#2563eb';
    return `
      appearance: none; border: 0; border-radius: 10px; padding: 8px 10px; cursor: pointer;
      background: ${primaryBg}; color: #fff; font-weight: 600;
    `;
  }
  function ghostStyle(theme: Settings['theme']) {
    const border = (theme === 'light') ? 'rgba(17,24,39,.2)' : 'rgba(255,255,255,.2)';
    const text = (theme === 'light') ? '#111827' : '#fff';
    return `
      appearance: none; border: 1px solid ${border}; border-radius: 10px; padding: 8px 10px; cursor: pointer;
      background: transparent; color: ${text}; font-weight: 600;
    `;
  }
  function earthCornerStyle(theme: Settings['theme']) {
    const border = (theme === 'light') ? 'rgba(17,24,39,.2)' : 'rgba(255,255,255,.2)';
    return `
      position: absolute; top: 6px; right: 8px; width: 24px; height: 24px;
      border: 1px solid ${border}; border-radius: 6px; background: transparent;
      font-size: 14px; line-height: 1; cursor: pointer; text-decoration: none;
      display: inline-flex; align-items: center; justify-content: center;
    `;
  }

  function buildMapHref(provider: Settings['mapProvider'], parts: string[]) {
    const q = encodeURIComponent(parts.filter(Boolean).join(' '));
    if (provider === 'osm') return `https://www.openstreetmap.org/search?query=${q}`;
    if (provider === 'apple') return `https://maps.apple.com/?q=${q}`;
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  function buildEarthHref(parts: string[]) {
    const q = encodeURIComponent(parts.filter(Boolean).join(' '));
    return `https://earth.google.com/web/search/${q}`;
  }

  function createOverlay(address: Address | null, metadata?: ExposeMetadata) {
    const { theme, position, mapProvider, showEarth, showDates } = settings;
    const style = overlayBaseStyle(theme, position);
    const btn = buttonStyle(theme);
    const ghost = ghostStyle(theme);

    const div = document.createElement('div');
    div.id = 'is24-address-decoder-overlay';
    div.setAttribute('style', style);

    const title = document.createElement('div');
    title.style.fontWeight = '700';
    title.style.marginBottom = '6px';
    title.textContent = address ? t('uiTitle') : t('uiTitleNoAddress');

    // Address section — only shown when address is available
    let addrLine = '';
    if (address) {
      const { street, houseNumber, postalCode, city, district } = address;
      addrLine =
        [street, houseNumber].filter(Boolean).join(' ') +
        ((postalCode || city) ? `\n${[postalCode, city].filter(Boolean).join(' ')}` : '') +
        (district ? `\n(${district})` : '');

      const line = document.createElement('div');
      line.style.margin = '6px 0 10px';
      line.style.whiteSpace = 'pre-wrap';
      line.textContent = addrLine || t('uiNoAddress');
      div.append(title, line);
    } else {
      div.append(title);
    }

    // Metadata section
    const metadataDiv = document.createElement('div');
    if (showDates && metadata && (metadata.publishedAt || metadata.lastModifiedAt)) {
      metadataDiv.style.margin = address ? '0 0 10px' : '6px 0 10px';
      metadataDiv.style.fontSize = '12px';
      metadataDiv.style.opacity = '0.85';

      if (metadata.publishedAt) {
        const publishedLine = document.createElement('div');
        publishedLine.style.margin = '2px 0';
        publishedLine.textContent = `📅 ${t('uiPublished')}: ${metadata.publishedAt}`;
        metadataDiv.appendChild(publishedLine);
      }

      if (metadata.lastModifiedAt) {
        const modifiedLine = document.createElement('div');
        modifiedLine.style.margin = '2px 0';
        modifiedLine.textContent = `🔄 ${t('uiModified')}: ${metadata.lastModifiedAt}`;
        metadataDiv.appendChild(modifiedLine);
      }
    }
    if (metadataDiv.children.length > 0) {
      div.appendChild(metadataDiv);
    }

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.flexWrap = 'wrap';

    // Copy and map buttons only when address is available
    if (address) {
      const copyBtn = document.createElement('button');
      copyBtn.setAttribute('style', btn);
      copyBtn.textContent = t('uiCopy');
      copyBtn.addEventListener('click', async () => {
        const ok = await copyToClipboard(addrLine);
        copyBtn.textContent = ok ? t('uiCopied') : t('uiCopyFail');
        setTimeout(() => {
          copyBtn.textContent = t('uiCopy');
        }, FEEDBACK_MESSAGE_DURATION);
      });

      const { street, houseNumber, postalCode, city } = address;
      const mapBtn = document.createElement('a');
      mapBtn.setAttribute('style', ghost + ' text-decoration:none; display:inline-flex; align-items:center; justify-content:center;');
      mapBtn.href = buildMapHref(mapProvider, [street, houseNumber, postalCode, city]);
      mapBtn.target = '_blank';
      mapBtn.rel = 'noopener';
      mapBtn.textContent = t('uiOpenMap');

      actions.append(copyBtn, mapBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.setAttribute('style', ghost);
    closeBtn.textContent = t('uiClose');
    closeBtn.addEventListener('click', () => {
      overlayState = 'dismissed';
      hideOverlay();
    });

    actions.appendChild(closeBtn);
    div.appendChild(actions);

    if (address && showEarth) {
      const { street, houseNumber, postalCode, city } = address;
      const earthCornerBtn = document.createElement('a');
      earthCornerBtn.setAttribute('style', earthCornerStyle(theme));
      earthCornerBtn.href = buildEarthHref([street, houseNumber, postalCode, city]);
      earthCornerBtn.target = '_blank';
      earthCornerBtn.rel = 'noopener';
      earthCornerBtn.title = t('uiOpenEarth');
      earthCornerBtn.textContent = '🌍';
      div.appendChild(earthCornerBtn);
    }

    document.documentElement.appendChild(div);
    overlayEl = div;
  }

  function showOverlay() {
    if (!overlayEl) return;
    
    overlayEl.style.display = 'block';
    overlayState = 'visible';
  }
  
  function hideOverlay() {
    if (!overlayEl) return;
    
    overlayEl.style.display = 'none';
    overlayState = (overlayState === 'dismissed') ? 'dismissed' : 'hidden';
  }
  
  function toggleOverlay() {
    if (!overlayEl) return;
    
    if (overlayState === 'visible') {
      hideOverlay();
      return;
    }
    
    overlayState = 'hidden';
    showOverlay();
  }

  let lastUrl = location.href;
  setInterval(() => {
    if (location.href === lastUrl) return;
    
    lastUrl = location.href;
    overlayState = 'hidden';
    
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
    }
    
    setTimeout(runDecoderOnce, MUTATION_OBSERVER_DELAY);
  }, URL_CHECK_INTERVAL);

  function runDecoderOnce() {
    if (overlayState === 'dismissed') return;
    if (overlayEl) return;

    // Try to decode address — may be null if not available on this page
    const enc = extractEncodedFromScripts();
    const address = enc ? decodeAddress(enc) : null;

    // Extract metadata — may contain dates even without an address
    const is24 = extractIs24Object();
    const metadata = is24 ? extractMetadata(is24) : undefined;

    // Nothing to show at all
    const hasDates = settings.showDates && metadata && (metadata.publishedAt || metadata.lastModifiedAt);
    if (!address && !hasDates) return;

    if (address && settings.autoCopy) {
      const addressParts = [address.street, address.houseNumber, address.postalCode, address.city]
        .filter(Boolean)
        .join(' ');
      copyToClipboard(addressParts);
    }

    createOverlay(address, metadata);
    showOverlay();
  }

  const start = () => setTimeout(runDecoderOnce, 0);
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  }

  const mo = new MutationObserver(() => {
    if (overlayState === 'dismissed') return;
    if (overlayEl) return;
    
    setTimeout(runDecoderOnce, MUTATION_OBSERVER_DELAY);
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  if (API.runtime && API.runtime.onMessage) {
    API.runtime.onMessage.addListener((msg: ToggleOverlayMessage) => {
      if (!msg || msg.type !== 'IS24_TOGGLE_OVERLAY') return;
      
      if (!overlayEl) runDecoderOnce();
      toggleOverlay();
    });
  }

  if (API.storage && API.storage.onChanged) {
    API.storage.onChanged.addListener((changes: Record<string, { newValue: unknown }>, area: string) => {
      if (area !== 'sync') return;
      
      Object.assign(settings, ...Object.keys(changes).map(k => ({ [k]: (changes as any)[k].newValue })));
      
      if ('localeOverride' in changes) {
        const newLocale = settings.localeOverride;
        
        if (newLocale && newLocale !== 'auto') {
          // Load custom locale
          loadLocaleBundle(newLocale).then(bundle => {
            if (!bundle) {
              // Fallback to browser default
              t = (k: string) => (API?.i18n?.getMessage ? API.i18n.getMessage(k) : k);
            } else {
              t = (k: string) => (k in bundle ? bundle[k] : k);
            }
            
            // Recreate overlay with new translations
            if (overlayEl) {
              overlayEl.remove();
              overlayEl = null;
            }
            if (overlayState !== 'dismissed') {
              runDecoderOnce();
            }
          });
        } else {
          // Switch back to browser default (auto)
          t = (k: string) => (API?.i18n?.getMessage ? API.i18n.getMessage(k) : k);
          
          // Recreate overlay with new translations
          if (overlayEl) {
            overlayEl.remove();
            overlayEl = null;
          }
          if (overlayState !== 'dismissed') {
            runDecoderOnce();
          }
        }
        return;
      }
      
      // Handle other settings changes (theme, position, etc.)
      if (overlayEl) {
        overlayEl.remove();
        overlayEl = null;
      }
      if (overlayState !== 'dismissed') {
        runDecoderOnce();
      }
    });
  }
})();
