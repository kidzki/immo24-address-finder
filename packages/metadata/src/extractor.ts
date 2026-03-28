import type {
  ExposeMetadata,
  LocationAddress,
  ContactPerson,
  PriceInfo,
  PropertyDetails,
  Gallery,
  GalleryImage,
  GalleryDocument,
  GeoLocation
} from './types.js';

/**
 * Safe deep access for unknown objects.
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

function str(val: unknown): string | null {
  if (val == null || val === '') return null;
  return String(val);
}

function num(val: unknown): number | null {
  if (val == null || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function bool(val: unknown, fallback = false): boolean {
  if (typeof val === 'boolean') return val;
  return fallback;
}

/**
 * Format ISO date string to DD.MM.YYYY (de-DE locale).
 */
export function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return null;
  }
}

function extractLocation(is24: unknown): LocationAddress {
  const addr = get(is24, 'expose', 'locationAddress') as Record<string, unknown> | null;
  const map = get(is24, 'ssr', 'frontendModel', 'exposeMap', 'location') as Record<string, unknown> | null;
  const mapAddr = get(is24, 'ssr', 'frontendModel', 'exposeMap', 'addressForMap') as Record<string, unknown> | null;

  let geo: GeoLocation | null = null;
  if (map && map.coordinateAvailable) {
    const lat = num(map.latitude);
    const lng = num(map.longitude);
    if (lat !== null && lng !== null) {
      geo = { latitude: lat, longitude: lng };
    }
  }

  return {
    street: str(addr?.street) ?? str(mapAddr?.street),
    houseNumber: str(addr?.houseNumber) ?? str(mapAddr?.houseNumber),
    zip: str(addr?.zip) ?? str(mapAddr?.zipCode),
    city: str(addr?.city) ?? str(mapAddr?.city),
    quarter: str(mapAddr?.quarter),
    region: str(mapAddr?.region),
    isFullAddress: bool(addr?.isFullAddress) || bool(map?.showFullAddress),
    geo
  };
}

function extractContact(is24: unknown): ContactPerson {
  const cd = get(is24, 'expose', 'contactData') as Record<string, unknown> | null;
  const person = cd ? get(cd, 'contactPerson') as Record<string, unknown> | null : null;
  const phones = cd ? get(cd, 'phoneNumbers') as Record<string, unknown> | null : null;
  const realtor = cd ? get(cd, 'realtorInformation') as Record<string, unknown> | null : null;

  return {
    salutation: str(person?.salutationAndTitle),
    firstName: str(person?.firstName),
    lastName: str(person?.lastName),
    company: str(realtor?.companyName),
    phone: str(get(phones, 'phoneNumber', 'contactNumber')),
    cellPhone: str(get(phones, 'cellPhoneNumber', 'contactNumber')),
    isCommercial: bool(get(is24, 'expose', 'isCommercialRealtor')),
    isVerified: bool(get(is24, 'expose', 'isVerifiedRealtor'))
  };
}

function extractPrice(is24: unknown): PriceInfo {
  const expose = get(is24, 'expose') as Record<string, unknown> | null;
  const commercializationType = str(expose?.commercializationType);
  const purchasePrice = num(expose?.purchasePrice ?? expose?.propertyPrice);
  const totalRent = num(expose?.totalRent);
  const baseRent = num(expose?.baseRent);
  const sqm = num(get(is24, 'expose', 'availableServicesData', 'squareMeters'));

  let amount: number | null = null;
  let type: 'buy' | 'rent' | null = null;

  if (commercializationType === 'BUY' && purchasePrice) {
    amount = purchasePrice;
    type = 'buy';
  } else if (commercializationType === 'RENT') {
    amount = totalRent ?? baseRent;
    type = 'rent';
  }

  let pricePerSqm: number | null = null;
  if (amount && sqm && sqm > 0) {
    pricePerSqm = Math.round((amount / sqm) * 100) / 100;
  }

  return { amount, type, pricePerSqm, currency: 'EUR' };
}

function extractProperty(is24: unknown): PropertyDetails {
  const svc = get(is24, 'expose', 'availableServicesData') as Record<string, unknown> | null;
  const criteria = get(is24, 'ssr', 'frontendModel', 'booleanCriteriaData', 'criteria') as Array<Record<string, unknown>> | null;
  const qc = get(is24, 'expose', 'quickCheckConfig') as Record<string, unknown> | null;

  const features: string[] = [];
  if (Array.isArray(criteria)) {
    for (const c of criteria) {
      if (c.key && typeof c.key === 'string') {
        features.push(c.key);
      }
    }
  }

  let constructionYear: number | null = null;
  if (qc) {
    const qcUrl = str(qc.quickCheckServiceUrl);
    if (qcUrl) {
      const match = qcUrl.match(/constructionYear=(\d+)/);
      if (match) constructionYear = num(match[1]);
    }
  }

  return {
    squareMeters: num(svc?.squareMeters),
    numberOfRooms: num(svc?.numberOfRooms),
    floor: str(get(is24, 'ssr', 'frontendModel', 'contactBottom', 'topic', 'relocation', 'details', 'floor'))
        ?? str(get(is24, 'contactLayerModel', 'topic', 'relocation', 'details', 'floor')),
    constructionYear,
    features
  };
}

function extractGallery(is24: unknown): Gallery {
  const gd = get(is24, 'expose', 'galleryData') as Record<string, unknown> | null;

  const images: GalleryImage[] = [];
  const rawImages = gd?.images;
  if (Array.isArray(rawImages)) {
    for (const img of rawImages) {
      if (img && typeof img === 'object') {
        const rec = img as Record<string, unknown>;
        images.push({
          id: str(rec.id) ?? '',
          caption: str(rec.caption) ?? '',
          fullSizeUrl: str(rec.fullSizePictureUrl) ?? '',
          thumbnailUrl: str(rec.thumbnailUrl) ?? ''
        });
      }
    }
  }

  const documents: GalleryDocument[] = [];
  const rawDocs = gd?.documents;
  if (Array.isArray(rawDocs)) {
    for (const doc of rawDocs) {
      if (doc && typeof doc === 'object') {
        const rec = doc as Record<string, unknown>;
        documents.push({
          title: str(rec.title) ?? '',
          url: str(rec.url) ?? ''
        });
      }
    }
  }

  return {
    images,
    documents,
    imageCount: num(gd?.imageCount) ?? images.length,
    hasFloorplan: bool(gd?.floorPlanAvailable)
  };
}

function extractDescriptions(is24: unknown): Record<string, string> {
  const content = get(is24, 'ssr', 'frontendModel', 'exposeContent') as Record<string, unknown> | null;
  const result: Record<string, string> = {};

  if (!content) return result;

  const keys = ['objectDescription', 'locationDescription', 'furnishingDescription', 'otherDescription'];
  for (const key of keys) {
    const val = str(content[key]);
    if (val) result[key] = val;
  }

  // AI summary
  const summaries = content.aiSummaries;
  if (Array.isArray(summaries) && summaries.length > 0) {
    const first = summaries[0] as Record<string, unknown>;
    const summary = str(first?.content);
    if (summary) result['aiSummary'] = summary;
  }

  return result;
}

/**
 * Extract structured metadata from the window.IS24 object.
 */
export function extractMetadata(is24: unknown): ExposeMetadata {
  const expose = get(is24, 'expose') as Record<string, unknown> | null;
  const pws = get(is24, 'premiumStatsWidget') as Record<string, unknown> | null;
  const titleObj = get(is24, 'ssr', 'frontendModel', 'exposeTitle') as Record<string, unknown> | null;

  return {
    exposeId: str(expose?.id),
    title: str(titleObj?.exposeTitle),
    publishedAt: formatDate(str(pws?.exposeOnlineSince)),
    lastModifiedAt: formatDate(str(expose?.lastModificationDate)),
    realEstateType: str(expose?.realEstateType),
    commercializationType: str(expose?.commercializationType),
    onTopProduct: str(expose?.onTopProduct),
    price: extractPrice(is24),
    location: extractLocation(is24),
    contact: extractContact(is24),
    property: extractProperty(is24),
    gallery: extractGallery(is24),
    descriptions: extractDescriptions(is24)
  };
}
