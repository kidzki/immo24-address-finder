export interface ExposeMetadata {
  exposeId: string | null;
  publishedAt: string | null;
  lastModifiedAt: string | null;
  price: string | null;
  priceType: 'buy' | 'rent' | null;
  realEstateType: string | null;
  title: string | null;
}

/**
 * Safe deep access helper for unknown objects
 */
function get(obj: unknown, ...path: string[]): unknown {
  let current = obj;
  for (const key of path) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }
  return current;
}

/**
 * Format ISO date string to locale-specific format (de: DD.MM.YYYY)
 */
function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return null;
  }
}

/**
 * Extract metadata from window.is24 object
 */
export function extractMetadata(is24: unknown): ExposeMetadata {
  const expose = get(is24, 'expose') as Record<string, unknown> | null;
  const pws = get(is24, 'premiumStatsWidget') as Record<string, unknown> | null;
  const ssr = get(is24, 'ssr', 'frontendModel', 'exposeTitle') as Record<string, unknown> | null;

  // Extract raw values
  const exposeId = expose?.id;
  const publishedAt = pws?.exposeOnlineSince;
  const lastModifiedAt = expose?.lastModificationDate;
  const purchasePrice = expose?.purchasePrice;
  const totalRent = expose?.totalRent;
  const commercializationType = expose?.commercializationType;
  const realEstateType = expose?.realEstateType;
  const title = ssr?.exposeTitle;

  // Determine price and priceType
  let price: string | null = null;
  let priceType: 'buy' | 'rent' | null = null;

  if (commercializationType === 'BUY' && purchasePrice) {
    price = String(purchasePrice);
    priceType = 'buy';
  } else if (commercializationType === 'RENT' && totalRent) {
    price = String(totalRent);
    priceType = 'rent';
  }

  return {
    exposeId: exposeId ? String(exposeId) : null,
    publishedAt: publishedAt ? formatDate(String(publishedAt)) : null,
    lastModifiedAt: lastModifiedAt ? formatDate(String(lastModifiedAt)) : null,
    price,
    priceType,
    realEstateType: realEstateType ? String(realEstateType) : null,
    title: title ? String(title) : null
  };
}
