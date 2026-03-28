# @immo24/metadata

[![npm version](https://img.shields.io/npm/v/@immo24/metadata)](https://www.npmjs.com/package/@immo24/metadata)
[![Tests](https://github.com/kidzki/immo24-address-finder/actions/workflows/publish-metadata.yml/badge.svg)](https://github.com/kidzki/immo24-address-finder/actions/workflows/publish-metadata.yml)
[![License](https://img.shields.io/npm/l/@immo24/metadata)](./LICENSE)

Extracts structured metadata from ImmoScout24 listing pages.

ImmoScout24 builds `window.IS24` incrementally across ~17 script tags using individual property assignments and JS object literals — not a single JSON block. This package parses those script tags and extracts a fully typed `ExposeMetadata` object containing price, location, contact, property details, gallery, and descriptions.

## Installation

```bash
npm install @immo24/metadata
```

## Usage

### In a browser / content script

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

### From a pre-parsed IS24 object

If you already have the `window.IS24` object (e.g. injected from a page script), you can skip the parser:

```typescript
import { extractMetadata } from '@immo24/metadata';

const metadata = extractMetadata(window.IS24);
```

## API

### `parseIS24FromScripts(doc: Document): unknown`

Reads all `<script>` tags in `doc`, extracts individual IS24 property assignments and sub-objects, and returns a reconstructed IS24 object. Returns `null` if no IS24 data is found.

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
  publishedAt: string | null;       // DD.MM.YYYY
  lastModifiedAt: string | null;    // DD.MM.YYYY
  realEstateType: string | null;    // e.g. "APARTMENT_BUY"
  commercializationType: string | null; // "BUY" | "RENT"
  onTopProduct: string | null;      // e.g. "XXL"
  price: PriceInfo;
  location: LocationAddress;
  contact: ContactPerson;
  property: PropertyDetails;
  gallery: Gallery;
  descriptions: Record<string, string>;
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

```typescript
interface LocationAddress {
  street: string | null;
  houseNumber: string | null;
  zip: string | null;
  city: string | null;
  quarter: string | null;
  region: string | null;
  isFullAddress: boolean;
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
  isCommercial: boolean;
  isVerified: boolean;
}
```

### `PropertyDetails`

```typescript
interface PropertyDetails {
  squareMeters: number | null;
  numberOfRooms: number | null;
  floor: string | null;
  constructionYear: number | null;
  features: string[];               // e.g. ["balcony", "cellar"]
}
```

### `Gallery`

```typescript
interface Gallery {
  images: GalleryImage[];
  documents: GalleryDocument[];
  imageCount: number;
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

## How it works

IS24 builds `window.IS24` incrementally via ~17 script tags:

```js
// Script 1 — individual assignments
window.IS24 = window.IS24 || {};
IS24.expose = IS24.expose || {};
IS24.expose.id = 166173168;
IS24.expose.lastModificationDate = "2026-03-25T17:58:18.399Z";
IS24.expose.locationAddress = { "street": "Musterstraße", ... };

// Script 6 — JS object literal (unquoted keys, not valid JSON)
IS24.premiumStatsWidget = {
  exposeOnlineSince: "2026-03-08T20:51:51.000+01:00",
  layout: "DEFAULT"
};
```

The parser handles:
- **Individual string/number/boolean assignments** via targeted regex
- **JSON sub-objects** via brace-counting (handles nested objects and strings correctly)
- **JS object literals with unquoted keys** via field-specific regex extraction

## Requirements

Node.js >= 16

## License

MIT
