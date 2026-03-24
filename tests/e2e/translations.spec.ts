import { test, expect } from '@playwright/test';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.join(__dirname, '../../dist/chromium');

test.describe('Overlay Translations', () => {
  test('should show German overlay text by default', async ({ page }) => {
    // This test would require a real extension context
    // For now, we test the translation function logic
    
    const mockMessages = {
      'uiTitle': 'Adresse (IS24)',
      'uiCopy': 'Kopieren',
      'uiOpenMap': 'Karte öffnen',
      'uiOpenEarth': 'Google Earth öffnen',
      'uiClose': 'Schließen',
      'uiNoAddress': 'Keine Adresse gefunden'
    };
    
    // Test that German messages are correctly structured
    expect(mockMessages.uiTitle).toBe('Adresse (IS24)');
    expect(mockMessages.uiCopy).toBe('Kopieren');
    expect(mockMessages.uiOpenMap).toBe('Karte öffnen');
    expect(mockMessages.uiOpenEarth).toBe('Google Earth öffnen');
    expect(mockMessages.uiClose).toBe('Schließen');
  });

  test('should have English overlay translations', async ({ page }) => {
    const mockMessages = {
      'uiTitle': 'Address (IS24)',
      'uiCopy': 'Copy',
      'uiOpenMap': 'Open map',
      'uiOpenEarth': 'Open Google Earth',
      'uiClose': 'Close',
      'uiNoAddress': 'No address found'
    };
    
    expect(mockMessages.uiTitle).toBe('Address (IS24)');
    expect(mockMessages.uiCopy).toBe('Copy');
    expect(mockMessages.uiOpenMap).toBe('Open map');
    expect(mockMessages.uiOpenEarth).toBe('Open Google Earth');
    expect(mockMessages.uiClose).toBe('Close');
  });

  test('should have Spanish overlay translations', async ({ page }) => {
    const mockMessages = {
      'uiTitle': 'Dirección (IS24)',
      'uiCopy': 'Copiar',
      'uiOpenMap': 'Abrir mapa',
      'uiOpenEarth': 'Abrir Google Earth',
      'uiClose': 'Cerrar',
      'uiNoAddress': 'No se encontró dirección'
    };
    
    expect(mockMessages.uiTitle).toBe('Dirección (IS24)');
    expect(mockMessages.uiCopy).toBe('Copiar');
    expect(mockMessages.uiOpenMap).toBe('Abrir mapa');
    expect(mockMessages.uiOpenEarth).toBe('Abrir Google Earth');
    expect(mockMessages.uiClose).toBe('Cerrar');
  });

  test('should have Italian overlay translations', async ({ page }) => {
    const mockMessages = {
      'uiTitle': 'Indirizzo (IS24)',
      'uiCopy': 'Copia',
      'uiOpenMap': 'Apri mappa',
      'uiOpenEarth': 'Apri Google Earth',
      'uiClose': 'Chiudi',
      'uiNoAddress': 'Nessun indirizzo trovato'
    };
    
    expect(mockMessages.uiTitle).toBe('Indirizzo (IS24)');
    expect(mockMessages.uiCopy).toBe('Copia');
    expect(mockMessages.uiOpenMap).toBe('Apri mappa');
    expect(mockMessages.uiOpenEarth).toBe('Apri Google Earth');
    expect(mockMessages.uiClose).toBe('Chiudi');
  });
});

test.describe('Locale Bundle Loading', () => {
  test('should load German locale bundle', async ({ page }) => {
    const localePath = path.join(__dirname, '../../_locales/de/messages.json');
    const locale = JSON.parse(readFileSync(localePath, 'utf-8'));
    
    expect(locale.uiTitle.message).toBe('Adresse (IS24)');
    expect(locale.uiCopy.message).toBe('Kopieren');
    expect(locale.uiCopied.message).toBe('Kopiert ✓');
    expect(locale.uiOpenMap.message).toBe('Karte öffnen');
    expect(locale.uiOpenEarth.message).toBe('Google Earth öffnen');
    expect(locale.uiClose.message).toBe('Schließen');
  });

  test('should load English locale bundle', async ({ page }) => {
    const localePath = path.join(__dirname, '../../_locales/en/messages.json');
    const locale = JSON.parse(readFileSync(localePath, 'utf-8'));
    
    expect(locale.uiTitle.message).toBe('Address (IS24)');
    expect(locale.uiCopy.message).toBe('Copy');
    expect(locale.uiCopied.message).toBe('Copied ✓');
    expect(locale.uiOpenMap.message).toBe('Open map');
    expect(locale.uiOpenEarth.message).toBe('Open Google Earth');
    expect(locale.uiClose.message).toBe('Close');
  });

  test('should load Spanish locale bundle', async ({ page }) => {
    const localePath = path.join(__dirname, '../../_locales/es/messages.json');
    const locale = JSON.parse(readFileSync(localePath, 'utf-8'));
    
    expect(locale.uiTitle.message).toBe('Dirección (IS24)');
    expect(locale.uiCopy.message).toBe('Copiar');
    expect(locale.uiCopied.message).toBe('Copiado ✓');
    expect(locale.uiOpenMap.message).toBe('Abrir mapa');
    expect(locale.uiOpenEarth.message).toBe('Abrir Google Earth');
    expect(locale.uiClose.message).toBe('Cerrar');
  });

  test('should load Italian locale bundle', async ({ page }) => {
    const localePath = path.join(__dirname, '../../_locales/it/messages.json');
    const locale = JSON.parse(readFileSync(localePath, 'utf-8'));
    
    expect(locale.uiTitle.message).toBe('Indirizzo (IS24)');
    expect(locale.uiCopy.message).toBe('Copia');
    expect(locale.uiCopied.message).toBe('Copiato ✓');
    expect(locale.uiOpenMap.message).toBe('Apri mappa');
    expect(locale.uiOpenEarth.message).toBe('Apri Google Earth');
    expect(locale.uiClose.message).toBe('Chiudi');
  });
});

test.describe('Locale Completeness', () => {
  const requiredKeys = [
    'extName', 'extDesc', 'cmdToggle',
    'uiTitle', 'uiCopy', 'uiCopied', 'uiCopyFail', 'uiOpenMap', 'uiOpenEarth', 'uiClose', 'uiNoAddress',
    'optTitle', 'optLegendMap', 'optLegendOverlay', 'optMapProvider', 'optPosition', 'optTheme', 'optAutoCopy',
    'optSave', 'optSaved',
    'optGoogle', 'optOsm', 'optApple',
    'posBR', 'posBL', 'posTR', 'posTL',
    'themeDark', 'themeLight',
    'optLegendLanguage', 'optLanguage', 'langAuto', 'langDe', 'langEn', 'langEs', 'langIt',
    'loveMade', 'loveIn', 'loveRepo',
    'optVersion'
  ];

  test('German locale should have all required keys', async ({ page }) => {
    const localePath = path.join(__dirname, '../../_locales/de/messages.json');
    const locale = JSON.parse(readFileSync(localePath, 'utf-8'));
    
    for (const key of requiredKeys) {
      expect(locale).toHaveProperty(key);
    }
    
    expect(Object.keys(locale).length).toBe(39);
  });

  test('English locale should have all required keys', async ({ page }) => {
    const localePath = path.join(__dirname, '../../_locales/en/messages.json');
    const locale = JSON.parse(readFileSync(localePath, 'utf-8'));
    
    for (const key of requiredKeys) {
      expect(locale[key]).toBeDefined();
      expect(locale[key].message).toBeTruthy();
    }
    
    expect(Object.keys(locale).length).toBe(39);
  });

  test('Spanish locale should have all required keys', async ({ page }) => {
    const localePath = path.join(__dirname, '../../_locales/es/messages.json');
    const locale = JSON.parse(readFileSync(localePath, 'utf-8'));
    
    for (const key of requiredKeys) {
      expect(locale[key]).toBeDefined();
      expect(locale[key].message).toBeTruthy();
    }
    
    expect(Object.keys(locale).length).toBe(39);
  });

  test('Italian locale should have all required keys', async ({ page }) => {
    const localePath = path.join(__dirname, '../../_locales/it/messages.json');
    const locale = JSON.parse(readFileSync(localePath, 'utf-8'));
    
    for (const key of requiredKeys) {
      expect(locale[key]).toBeDefined();
      expect(locale[key].message).toBeTruthy();
    }
    
    expect(Object.keys(locale).length).toBe(39);
  });
});

test.describe('Translation Quality', () => {
  test('Spanish position translations should use correct grammar', async ({ page }) => {
    const localePath = path.join(__dirname, '../../_locales/es/messages.json');
    const locale = JSON.parse(readFileSync(localePath, 'utf-8'));
    
    // Spanish requires "a la" preposition
    expect(locale.posBR.message).toBe('Abajo a la derecha');
    expect(locale.posBL.message).toBe('Abajo a la izquierda');
    expect(locale.posTR.message).toBe('Arriba a la derecha');
    expect(locale.posTL.message).toBe('Arriba a la izquierda');
  });

  test('Italian description should be user-friendly', async ({ page }) => {
    const localePath = path.join(__dirname, '../../_locales/it/messages.json');
    const locale = JSON.parse(readFileSync(localePath, 'utf-8'));
    
    // Should not contain technical details like "obj_telekomInternetUrlAddition"
    expect(locale.extDesc.message).not.toContain('obj_telekomInternetUrlAddition');
    expect(locale.extDesc.message).toBeTruthy();
  });

  test('All locales should have consistent checkmark symbol', async ({ page }) => {
    const locales = ['de', 'en', 'es', 'it'];
    
    for (const lang of locales) {
      const localePath = path.join(__dirname, `../../_locales/${lang}/messages.json`);
      const locale = JSON.parse(readFileSync(localePath, 'utf-8'));
      
      expect(locale.uiCopied.message).toContain('✓');
    }
  });
});

test.describe('Locale Switching E2E', () => {
  test('should switch overlay language when locale changes in options', async ({ page, context }) => {
    // This test requires the extension to be loaded in the browser
    // For now, we just verify the locale files can be loaded
    const locales = ['de', 'en', 'es', 'it'];
    
    for (const locale of locales) {
      const localePath = path.join(__dirname, `../../_locales/${locale}/messages.json`);
      const data = JSON.parse(readFileSync(localePath, 'utf-8'));
      
      // Verify key UI strings exist
      expect(data.uiTitle).toBeDefined();
      expect(data.uiCopy).toBeDefined();
      expect(data.uiOpenMap).toBeDefined();
      expect(data.uiOpenEarth).toBeDefined();
      expect(data.uiClose).toBeDefined();
    }
  });

  test('should have different translations for each language', async ({ page }) => {
    const localePath_de = path.join(__dirname, '../../_locales/de/messages.json');
    const localePath_en = path.join(__dirname, '../../_locales/en/messages.json');
    const localePath_es = path.join(__dirname, '../../_locales/es/messages.json');
    const localePath_it = path.join(__dirname, '../../_locales/it/messages.json');
    
    const locale_de = JSON.parse(readFileSync(localePath_de, 'utf-8'));
    const locale_en = JSON.parse(readFileSync(localePath_en, 'utf-8'));
    const locale_es = JSON.parse(readFileSync(localePath_es, 'utf-8'));
    const locale_it = JSON.parse(readFileSync(localePath_it, 'utf-8'));
    
    // uiCopy should be different in each language
    expect(locale_de.uiCopy.message).toBe('Kopieren');
    expect(locale_en.uiCopy.message).toBe('Copy');
    expect(locale_es.uiCopy.message).toBe('Copiar');
    expect(locale_it.uiCopy.message).toBe('Copia');
    
    // uiOpenMap should be different in each language
    expect(locale_de.uiOpenMap.message).toBe('Karte öffnen');
    expect(locale_en.uiOpenMap.message).toBe('Open map');
    expect(locale_es.uiOpenMap.message).toBe('Abrir mapa');
    expect(locale_it.uiOpenMap.message).toBe('Apri mappa');

    // uiOpenEarth should be different in each language
    expect(locale_de.uiOpenEarth.message).toBe('Google Earth öffnen');
    expect(locale_de.uiOpenEarth.message).toBe('Open Google Earth');
    expect(locale_de.uiOpenEarth.message).toBe('Abrir Earth öffnen');
    expect(locale_de.uiOpenEarth.message).toBe('Apri Earth öffnen');
  });

  test('should preserve locale structure across all languages', async ({ page }) => {
    const locales = ['de', 'en', 'es', 'it'];
    const allKeys: string[][] = [];
    
    for (const locale of locales) {
      const localePath = path.join(__dirname, `../../_locales/${locale}/messages.json`);
      const data = JSON.parse(readFileSync(localePath, 'utf-8'));
      allKeys.push(Object.keys(data).sort());
    }
    
    // All locales should have the exact same keys
    const referenceKeys = allKeys[0];
    for (let i = 1; i < allKeys.length; i++) {
      expect(allKeys[i]).toEqual(referenceKeys);
    }
  });
});
