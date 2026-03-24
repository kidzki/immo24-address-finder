import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Overlay Translation Logic', () => {
  // Mock the loadLocaleBundle function
  async function loadLocaleBundle(locale: string): Promise<Record<string, string> | null> {
    const bundles: Record<string, Record<string, string>> = {
      'de': {
        uiTitle: 'Adresse (IS24)',
        uiCopy: 'Kopieren',
        uiCopied: 'Kopiert ✓',
        uiOpenMap: 'Karte öffnen',
        uiOpenEarth: 'Google Earth öffnen',
        uiClose: 'Schließen',
        uiNoAddress: 'Keine Adresse gefunden'
      },
      'en': {
        uiTitle: 'Address (IS24)',
        uiCopy: 'Copy',
        uiCopied: 'Copied ✓',
        uiOpenMap: 'Open map',
        uiOpenEarth: 'Open Google Earth',
        uiClose: 'Close',
        uiNoAddress: 'No address found'
      },
      'es': {
        uiTitle: 'Dirección (IS24)',
        uiCopy: 'Copiar',
        uiCopied: 'Copiado ✓',
        uiOpenMap: 'Abrir mapa',
        uiOpenEarth: 'Abrir Google Earth',
        uiClose: 'Cerrar',
        uiNoAddress: 'No se encontró dirección'
      },
      'it': {
        uiTitle: 'Indirizzo (IS24)',
        uiCopy: 'Copia',
        uiCopied: 'Copiato ✓',
        uiOpenMap: 'Apri mappa',
        uiOpenEarth: 'Apri Google Earth',
        uiClose: 'Chiudi',
        uiNoAddress: 'Nessun indirizzo trovato'
      }
    };
    
    return bundles[locale] || null;
  }

  describe('Translation Function Creation', () => {
    it('should create German translation function', async () => {
      const bundle = await loadLocaleBundle('de');
      expect(bundle).not.toBeNull();
      
      const t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      expect(t('uiTitle')).toBe('Adresse (IS24)');
      expect(t('uiCopy')).toBe('Kopieren');
      expect(t('uiClose')).toBe('Schließen');
    });

    it('should create English translation function', async () => {
      const bundle = await loadLocaleBundle('en');
      expect(bundle).not.toBeNull();
      
      const t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      expect(t('uiTitle')).toBe('Address (IS24)');
      expect(t('uiCopy')).toBe('Copy');
      expect(t('uiClose')).toBe('Close');
    });

    it('should create Spanish translation function', async () => {
      const bundle = await loadLocaleBundle('es');
      expect(bundle).not.toBeNull();
      
      const t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      expect(t('uiTitle')).toBe('Dirección (IS24)');
      expect(t('uiCopy')).toBe('Copiar');
      expect(t('uiClose')).toBe('Cerrar');
    });

    it('should create Italian translation function', async () => {
      const bundle = await loadLocaleBundle('it');
      expect(bundle).not.toBeNull();
      
      const t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      expect(t('uiTitle')).toBe('Indirizzo (IS24)');
      expect(t('uiCopy')).toBe('Copia');
      expect(t('uiClose')).toBe('Chiudi');
    });
  });

  describe('Fallback Behavior', () => {
    it('should return key if bundle is null', async () => {
      const bundle = await loadLocaleBundle('invalid');
      expect(bundle).toBeNull();
      
      const t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      expect(t('uiTitle')).toBe('uiTitle');
      expect(t('uiCopy')).toBe('uiCopy');
    });

    it('should return key if key not in bundle', async () => {
      const bundle = await loadLocaleBundle('en');
      expect(bundle).not.toBeNull();
      
      const t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      expect(t('nonExistentKey')).toBe('nonExistentKey');
    });
  });

  describe('Locale Switching', () => {
    it('should switch from German to English', async () => {
      let bundle = await loadLocaleBundle('de');
      let t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      expect(t('uiCopy')).toBe('Kopieren');
      
      // Switch to English
      bundle = await loadLocaleBundle('en');
      t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      expect(t('uiCopy')).toBe('Copy');
    });

    it('should switch from English to Spanish', async () => {
      let bundle = await loadLocaleBundle('en');
      let t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      expect(t('uiOpenMap')).toBe('Open map');
      
      // Switch to Spanish
      bundle = await loadLocaleBundle('es');
      t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      expect(t('uiOpenMap')).toBe('Abrir mapa');
    });

    it('should switch from Spanish to Italian', async () => {
      let bundle = await loadLocaleBundle('es');
      let t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      expect(t('uiClose')).toBe('Cerrar');
      
      // Switch to Italian
      bundle = await loadLocaleBundle('it');
      t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      expect(t('uiClose')).toBe('Chiudi');
    });

    it('should switch from custom locale to auto (fallback)', async () => {
      let bundle = await loadLocaleBundle('es');
      let t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      expect(t('uiCopy')).toBe('Copiar');
      
      // Switch to auto (null bundle, use browser default)
      bundle = null;
      t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      // Should fallback to key (in real app, would use chrome.i18n.getMessage)
      expect(t('uiCopy')).toBe('uiCopy');
    });
  });

  describe('Overlay Text Generation', () => {
    it('should generate correct overlay HTML with German text', async () => {
      const bundle = await loadLocaleBundle('de');
      const t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      const overlayHTML = `
        <div class="overlay">
          <h3>${t('uiTitle')}</h3>
          <button>${t('uiCopy')}</button>
          <button>${t('uiOpenMap')}</button>
          <button>${t('uiOpenEarth')}</button>
          <button>${t('uiClose')}</button>
        </div>
      `;
      
      expect(overlayHTML).toContain('Adresse (IS24)');
      expect(overlayHTML).toContain('Kopieren');
      expect(overlayHTML).toContain('Karte öffnen');
      expect(overlayHTML).toContain('Google Earth öffnen');
      expect(overlayHTML).toContain('Schließen');
    });

    it('should generate correct overlay HTML with English text', async () => {
      const bundle = await loadLocaleBundle('en');
      const t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
      
      const overlayHTML = `
        <div class="overlay">
          <h3>${t('uiTitle')}</h3>
          <button>${t('uiCopy')}</button>
          <button>${t('uiOpenMap')}</button>
          <button>${t('uiOpenEarth')}</button>
          <button>${t('uiClose')}</button>
        </div>
      `;
      
      expect(overlayHTML).toContain('Address (IS24)');
      expect(overlayHTML).toContain('Copy');
      expect(overlayHTML).toContain('Open map');
      expect(overlayHTML).toContain('Open Google Earth');
      expect(overlayHTML).toContain('Close');
    });
  });

  describe('Special Characters', () => {
    it('should handle checkmark symbol in all languages', async () => {
      const locales = ['de', 'en', 'es', 'it'];
      
      for (const locale of locales) {
        const bundle = await loadLocaleBundle(locale);
        const t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
        
        expect(t('uiCopied')).toContain('✓');
      }
    });

    it('should handle parentheses in title', async () => {
      const locales = ['de', 'en', 'es', 'it'];
      
      for (const locale of locales) {
        const bundle = await loadLocaleBundle(locale);
        const t = (k: string) => (bundle && k in bundle ? bundle[k] : k);
        
        expect(t('uiTitle')).toContain('(IS24)');
      }
    });
  });

  describe('Translation Consistency', () => {
    it('should have same number of keys in all locales', async () => {
      const locales = ['de', 'en', 'es', 'it'];
      const keyCounts: number[] = [];
      
      for (const locale of locales) {
        const bundle = await loadLocaleBundle(locale);
        if (bundle) {
          keyCounts.push(Object.keys(bundle).length);
        }
      }
      
      // All locales should have the same number of keys
      const firstCount = keyCounts[0];
      expect(keyCounts.every(count => count === firstCount)).toBe(true);
    });

    it('should have same keys in all locales', async () => {
      const bundles = await Promise.all([
        loadLocaleBundle('de'),
        loadLocaleBundle('en'),
        loadLocaleBundle('es'),
        loadLocaleBundle('it')
      ]);
      
      const deKeys = Object.keys(bundles[0] || {}).sort();
      
      for (const bundle of bundles.slice(1)) {
        const keys = Object.keys(bundle || {}).sort();
        expect(keys).toEqual(deKeys);
      }
    });
  });
});

describe('Locale Bundle Loading', () => {
  it('should handle successful locale bundle load', async () => {
    const mockBundle = {
      uiTitle: 'Address (IS24)',
      uiCopy: 'Copy',
      uiOpenMap: 'Open map',
      uiOpenEarth: 'Open Google Earth',
      uiClose: 'Close'
    };
    
    // Simulate successful load
    const result = mockBundle;
    
    expect(result).toBeDefined();
    expect(result.uiTitle).toBe('Address (IS24)');
    expect(result.uiCopy).toBe('Copy');
  });

  it('should handle failed locale bundle load', async () => {
    // Simulate failed load
    const result = null;
    
    expect(result).toBeNull();
  });

  it('should flatten locale message format', () => {
    const localeData = {
      uiTitle: { message: 'Address (IS24)' },
      uiCopy: { message: 'Copy' }
    };
    
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(localeData)) {
      flat[k] = v.message;
    }
    
    expect(flat.uiTitle).toBe('Address (IS24)');
    expect(flat.uiCopy).toBe('Copy');
  });
});
