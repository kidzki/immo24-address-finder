/**
 * Extract a complete JSON object from `txt` starting at `startIndex`.
 * Uses brace counting to handle arbitrarily nested objects, skipping
 * braces inside string literals and escape sequences.
 */
function extractJsonObject(txt: string, startIndex: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < txt.length; i++) {
    const ch = txt[i];

    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return txt.slice(startIndex, i + 1);
    }
  }

  return null;
}

/**
 * Find and parse `IS24.<property> = { ... }` or `window.IS24.<property> = { ... }`
 * from the concatenated script text. Returns the parsed object or null.
 */
function extractSubObject(allText: string, property: string): unknown {
  // Escape dots in property path for nested properties like 'expose.foo'
  const escaped = property.replace(/\./g, '\\.');
  const re = new RegExp(`(?:window\\.)?IS24\\.${escaped}\\s*=\\s*\\{`, 'g');
  let m: RegExpExecArray | null;

  while ((m = re.exec(allText)) !== null) {
    const braceStart = allText.indexOf('{', m.index + m[0].length - 1);
    if (braceStart === -1) continue;

    const json = extractJsonObject(allText, braceStart);
    if (!json) continue;

    try {
      return JSON.parse(json);
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Extract a plain string value for `IS24.<property> = "value"` or
 * `IS24.<property>: "value"` (for cases where the property is a
 * JSON string value rather than an object).
 */
function extractStringValue(allText: string, property: string): string | null {
  const escaped = property.replace(/\./g, '\\.').replace(/[[\]]/g, '\\$&');
  const re = new RegExp(`["']?${escaped}["']?\\s*[=:]\\s*["']([^"']+)["']`);
  const m = re.exec(allText);
  return m ? m[1] : null;
}

/**
 * Parse the IS24 metadata from the page's script tags.
 *
 * IS24 builds the window.IS24 object incrementally across many script tags
 * (e.g. `IS24.premiumStatsWidget = {...}`, `IS24.expose.lastModificationDate = "..."`).
 * We collect all script text, find each sub-object we care about, and compose
 * a synthetic IS24 object that the extractor can consume.
 *
 * Content scripts run in an isolated world and cannot access page globals
 * directly — scanning script tag text content is the only available strategy.
 */
export function parseIS24FromScripts(doc: Document): unknown {
  const allText = Array.from(doc.scripts)
    .map(s => s.textContent || '')
    .join('\n');

  if (!allText.includes('IS24')) return null;

  // premiumStatsWidget is a JS object literal (unquoted keys) — not valid JSON.
  // Extract exposeOnlineSince directly via regex and build the object manually.
  const exposeOnlineSince = extractStringValue(allText, 'exposeOnlineSince');
  const premiumStatsWidget = exposeOnlineSince ? { exposeOnlineSince } : extractSubObject(allText, 'premiumStatsWidget');

  const contactLayerModel = extractSubObject(allText, 'contactLayerModel');

  // Extract expose — try as a single object first, otherwise build from parts
  let expose = extractSubObject(allText, 'expose') as Record<string, unknown> | null;
  if (!expose || typeof expose !== 'object') expose = {};

  // Some expose properties are set as nested assignments after the main object.
  // Fill in what's missing from the compose object.
  const quickCheckConfig = extractSubObject(allText, 'expose.quickCheckConfig');
  if (quickCheckConfig && !expose.quickCheckConfig) expose.quickCheckConfig = quickCheckConfig;

  const mediaAvailabilityModel = extractSubObject(allText, 'expose.mediaAvailabilityModel');
  if (mediaAvailabilityModel && !expose.mediaAvailabilityModel) expose.mediaAvailabilityModel = mediaAvailabilityModel;

  // lastModificationDate may be a plain string assignment, not an object
  if (!expose.lastModificationDate) {
    const lastMod = extractStringValue(allText, 'lastModificationDate');
    if (lastMod) expose.lastModificationDate = lastMod;
  }

  // Extract SSR model — only the pieces we need to avoid huge parse work
  const exposeTitle = extractSubObject(allText, 'ssr.frontendModel.exposeTitle')
    ?? extractSubObject(allText, 'frontendModel.exposeTitle');
  const exposeContent = extractSubObject(allText, 'ssr.frontendModel.exposeContent');
  const booleanCriteriaData = extractSubObject(allText, 'ssr.frontendModel.booleanCriteriaData');
  const exposeMap = extractSubObject(allText, 'ssr.frontendModel.exposeMap');

  const ssr = {
    frontendModel: {
      exposeTitle,
      exposeContent,
      booleanCriteriaData,
      exposeMap
    }
  };

  return { expose, premiumStatsWidget, contactLayerModel, ssr };
}
