import { describe, it, expect } from 'vitest';
import { parseIS24FromScripts } from '@immo24/metadata';

function createDocumentWithScript(scriptContent: string): Document {
  const doc = document.implementation.createHTMLDocument('test');
  const script = doc.createElement('script');
  script.textContent = scriptContent;
  doc.body.appendChild(script);
  return doc;
}

describe('parseIS24FromScripts', () => {
  it('should extract premiumStatsWidget from incremental IS24 assignment', () => {
    const doc = createDocumentWithScript(
      'window.IS24 = window.IS24 || {};\n' +
      'IS24.premiumStatsWidget = {"exposeOnlineSince":"2026-03-08T20:51:51.000+01:00","layout":"DEFAULT"};'
    );

    const result = parseIS24FromScripts(doc) as Record<string, unknown>;

    expect(result).not.toBeNull();
    const pws = result.premiumStatsWidget as Record<string, unknown>;
    expect(pws.exposeOnlineSince).toBe('2026-03-08T20:51:51.000+01:00');
  });

  it('should extract expose sub-object from incremental assignment', () => {
    const doc = createDocumentWithScript(
      'IS24.expose = {"id":166173168,"lastModificationDate":"2026-03-25T17:58:18.399Z","purchasePrice":"829000"};'
    );

    const result = parseIS24FromScripts(doc) as Record<string, unknown>;
    const expose = result.expose as Record<string, unknown>;

    expect(expose.id).toBe(166173168);
    expect(expose.purchasePrice).toBe('829000');
  });

  it('should fall back to string regex for lastModificationDate if not in expose object', () => {
    const doc = createDocumentWithScript(
      'IS24.expose = {};\n' +
      'IS24.expose.lastModificationDate = "2026-03-25T17:58:18.399Z";'
    );

    const result = parseIS24FromScripts(doc) as Record<string, unknown>;
    const expose = result.expose as Record<string, unknown>;

    expect(expose.lastModificationDate).toBe('2026-03-25T17:58:18.399Z');
  });

  it('should handle multiple script tags (real IS24 pattern)', () => {
    const doc = document.implementation.createHTMLDocument('test');

    const s1 = doc.createElement('script');
    s1.textContent = 'window.IS24 = window.IS24 || {};\nIS24.expose = {"id":123,"purchasePrice":"500000"};';
    doc.body.appendChild(s1);

    const s2 = doc.createElement('script');
    s2.textContent = 'IS24.premiumStatsWidget = {"exposeOnlineSince":"2026-01-01T00:00:00.000Z"};';
    doc.body.appendChild(s2);

    const result = parseIS24FromScripts(doc) as Record<string, unknown>;
    const expose = result.expose as Record<string, unknown>;
    const pws = result.premiumStatsWidget as Record<string, unknown>;

    expect(expose.id).toBe(123);
    expect(pws.exposeOnlineSince).toBe('2026-01-01T00:00:00.000Z');
  });

  it('should return null when no IS24 references found', () => {
    const doc = createDocumentWithScript('var foo = "bar"; var x = 42;');

    expect(parseIS24FromScripts(doc)).toBeNull();
  });

  it('should return null for empty document', () => {
    const doc = document.implementation.createHTMLDocument('test');

    expect(parseIS24FromScripts(doc)).toBeNull();
  });
});
