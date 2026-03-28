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
 * Extract a plain number value for `IS24.<property> = 123` assignments.
 */
function extractNumberValue(allText: string, property: string): number | null {
  const escaped = property.replace(/\./g, '\\.').replace(/[[\]]/g, '\\$&');
  const re = new RegExp(`(?:window\\.)?IS24\\.${escaped}\\s*=\\s*(-?\\d+(?:\\.\\d+)?)`);
  const m = re.exec(allText);
  if (!m) return null;
  const n = Number(m[1]);
  return isNaN(n) ? null : n;
}

/**
 * Extract a boolean value for `IS24.<property> = true/false` assignments.
 */
function extractBooleanValue(allText: string, property: string): boolean | null {
  const escaped = property.replace(/\./g, '\\.').replace(/[[\]]/g, '\\$&');
  const re = new RegExp(`(?:window\\.)?IS24\\.${escaped}\\s*=\\s*(true|false)`);
  const m = re.exec(allText);
  if (!m) return null;
  return m[1] === 'true';
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
    .map((s: HTMLScriptElement) => s.textContent || '')
    .join('\n');

  if (!allText.includes('IS24')) return null;

  // premiumStatsWidget is a JS object literal (unquoted keys) — not valid JSON.
  // Extract exposeOnlineSince directly via regex and build the object manually.
  const exposeOnlineSince = extractStringValue(allText, 'exposeOnlineSince');
  const premiumStatsWidget = exposeOnlineSince ? { exposeOnlineSince } : extractSubObject(allText, 'premiumStatsWidget');

  const contactLayerModel = extractSubObject(allText, 'contactLayerModel');

  // Build the expose object from individual assignments.
  // IS24 sets expose properties as separate assignments like:
  //   IS24.expose.id = 166173168;
  //   IS24.expose.purchasePrice = "829000";
  //   IS24.expose.locationAddress = {...};
  let expose = extractSubObject(allText, 'expose') as Record<string, unknown> | null;
  if (!expose || typeof expose !== 'object') expose = {};

  // Scalar string fields
  const strFields: Array<[string, string]> = [
    ['purchasePrice', 'expose.purchasePrice'],
    ['propertyPrice', 'expose.propertyPrice'],
    ['totalRent', 'expose.totalRent'],
    ['baseRent', 'expose.baseRent'],
    ['commercializationType', 'expose.commercializationType'],
    ['realEstateType', 'expose.realEstateType'],
    ['onTopProduct', 'expose.onTopProduct'],
    ['lastModificationDate', 'expose.lastModificationDate'],
    ['lastModificationDate', 'lastModificationDate'], // fallback without prefix
  ];
  for (const [key, path] of strFields) {
    if (!expose[key]) {
      const val = extractStringValue(allText, path);
      if (val) expose[key] = val;
    }
  }

  // Scalar number fields
  if (!expose.id) {
    const id = extractNumberValue(allText, 'expose.id');
    if (id !== null) expose.id = id;
  }

  // Scalar boolean fields
  if (expose.isVerifiedRealtor === undefined) {
    const val = extractBooleanValue(allText, 'expose.isVerifiedRealtor');
    if (val !== null) expose.isVerifiedRealtor = val;
  }
  if (expose.isCommercialRealtor === undefined) {
    const val = extractBooleanValue(allText, 'expose.isCommercialRealtor');
    if (val !== null) expose.isCommercialRealtor = val;
  }

  // Sub-object fields set as nested assignments
  const subObjFields: Array<[string, string]> = [
    ['locationAddress', 'expose.locationAddress'],
    ['contactData', 'expose.contactData'],
    ['availableServicesData', 'expose.availableServicesData'],
    ['galleryData', 'expose.galleryData'],
    ['quickCheckConfig', 'expose.quickCheckConfig'],
    ['mediaAvailabilityModel', 'expose.mediaAvailabilityModel'],
  ];
  for (const [key, path] of subObjFields) {
    if (!expose[key]) {
      const val = extractSubObject(allText, path);
      if (val) expose[key] = val;
    }
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
