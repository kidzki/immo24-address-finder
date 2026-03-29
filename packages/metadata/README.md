# @immo24/metadata

[![npm version](https://img.shields.io/npm/v/@immo24/metadata)](https://www.npmjs.com/package/@immo24/metadata)
[![Tests](https://github.com/kidzki/immo24-address-finder/actions/workflows/publish-metadata.yml/badge.svg)](https://github.com/kidzki/immo24-address-finder/actions/workflows/publish-metadata.yml)
[![License](https://img.shields.io/npm/l/@immo24/metadata)](./LICENSE)

Extracts structured metadata from ImmoScout24 listing pages into a fully typed `ExposeMetadata` object containing price, location, contact, property details, gallery, and descriptions.

## Installation

```bash
npm install @immo24/metadata
```

## Usage

### In a browser extension or userscript

Call `parseIS24FromScripts` with the current page document. It reads the page and returns the parsed IS24 data, which you then pass to `extractMetadata`:

```typescript
import { parseIS24FromScripts, extractMetadata } from '@immo24/metadata';

const is24 = parseIS24FromScripts(document);
const metadata = extractMetadata(is24);

console.log(metadata.exposeId);           // "166173168"
console.log(metadata.title);             // "4-ZI / Wohntraum in Marienburg"
console.log(metadata.publishedAt);       // "08.03.2026"
console.log(metadata.lastModifiedAt);    // "25.03.2026"
console.log(metadata.price.amount);      // 829000
console.log(metadata.location.city);     // "Köln"
console.log(metadata.contact.lastName);  // "Busch"
```

### From the IS24 object directly

If your execution context has direct access to `window.IS24` (e.g. a page script rather than an isolated content script), you can skip the parser:

```typescript
import { extractMetadata } from '@immo24/metadata';

const metadata = extractMetadata(window.IS24);
```

## API

### `parseIS24FromScripts(doc: Document): unknown`

Reads the page document and returns the parsed IS24 data object. Returns `null` if no IS24 data is found.

### `extractMetadata(is24: unknown): ExposeMetadata`

Extracts a fully typed `ExposeMetadata` object from the parsed IS24 data. All fields are null-safe — missing data results in `null` values rather than thrown errors.

### `formatDate(iso: string | null): string | null`

Formats an ISO 8601 date string to `DD.MM.YYYY`. Returns `null` for invalid or missing input.

## Types

### `ExposeMetadata`

```typescript
interface ExposeMetadata {
  exposeId: string | null;
  title: string | null;
  publishedAt: string | null;           // DD.MM.YYYY
  lastModifiedAt: string | null;        // DD.MM.YYYY
  realEstateType: string | null;        // e.g. "APARTMENT_BUY", "HOUSE_BUY", "APARTMENT_RENT"
  commercializationType: string | null; // "BUY" | "RENT"
  onTopProduct: string | null;          // IS24 listing tier: "GOLD" | "PLUS" | "XXL" | null
  price: PriceInfo;
  location: LocationAddress;
  contact: ContactPerson;
  property: PropertyDetails;
  gallery: Gallery;
  descriptions: Descriptions;
}
```

### `PriceInfo`

```typescript
interface PriceInfo {
  amount: number | null;
  type: 'buy' | 'rent' | null;
  pricePerSqm: number | null;
  currency: string;                 // always "EUR"
}
```

### `LocationAddress`

`isFullAddress` indicates whether the full street address (including house number) is publicly visible on the listing, as opposed to only a rough area.

```typescript
interface LocationAddress {
  street: string | null;
  houseNumber: string | null;
  zip: string | null;
  city: string | null;
  quarter: string | null;           // neighbourhood/district within the city
  region: string | null;            // federal state, e.g. "Nordrhein-Westfalen"
  isFullAddress: boolean;           // true if exact street + house number are disclosed
  geo: GeoLocation | null;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
}
```

### `ContactPerson`

```typescript
interface ContactPerson {
  salutation: string | null;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  phone: string | null;
  cellPhone: string | null;
  isCommercial: boolean;            // true if listed by a real estate agency
  isVerified: boolean;              // true if the realtor is IS24-verified
}
```

### `PropertyDetails`

```typescript
interface PropertyDetails {
  squareMeters: number | null;
  numberOfRooms: number | null;
  floor: string | null;             // e.g. "2" (floor number as string)
  constructionYear: number | null;
  features: string[];               // e.g. ["balcony", "cellar", "guestToilet"]
}
```

### `Gallery`

```typescript
interface Gallery {
  images: GalleryImage[];
  documents: GalleryDocument[];
  imageCount: number;               // total count including images not in the images array
  hasFloorplan: boolean;
}

interface GalleryImage {
  id: string;
  caption: string;
  fullSizeUrl: string;
  thumbnailUrl: string;
}

interface GalleryDocument {
  title: string;
  url: string;
}
```

### `Descriptions`

Text content fields from the listing as a plain key-value map. Only keys present on the listing are included — always check for existence before accessing.

```typescript
type Descriptions = Record<string, string>;
```

Common keys: `objectDescription`, `locationDescription`, `furnishingDescription`, `otherDescription`, `aiSummary`.

## Requirements

Node.js >= 16

## License

CC-BY-NC-SA-4.0 — see [LICENSE](../../LICENSE) for details.
