# @immo24/decoder

[![npm version](https://img.shields.io/npm/v/@immo24/decoder)](https://www.npmjs.com/package/@immo24/decoder)
[![Tests](https://github.com/kidzki/immo24-address-finder/actions/workflows/publish-decoder.yml/badge.svg)](https://github.com/kidzki/immo24-address-finder/actions/workflows/publish-decoder.yml)
[![License](https://img.shields.io/npm/l/@immo24/decoder)](./LICENSE)

Decodes encoded address data from ImmoScout24 listing pages.

ImmoScout24 embeds address information in the page as a Base64-encoded JSON string inside the `obj_telekomInternetUrlAddition` property. This package extracts and decodes that data into a structured `Address` object.

## Installation

```bash
npm install @immo24/decoder
```

## Usage

```typescript
import { decodeAddress } from '@immo24/decoder';

// Encoded string extracted from the ImmoScout24 page source
const encoded = '...';

const address = decodeAddress(encoded);
if (address) {
  console.log(address.street);      // e.g. "Musterstraße"
  console.log(address.houseNumber); // e.g. "42"
  console.log(address.postalCode);  // e.g. "10115"
  console.log(address.city);        // e.g. "Berlin"
  console.log(address.district);    // e.g. "Mitte"
}
```

## Finding the encoded string

The encoded address is embedded in the page HTML as a JSON property:

```js
"obj_telekomInternetUrlAddition": "<encoded-value>"
```

You can extract it from the page source via a regex:

```typescript
const match = html.match(/"obj_telekomInternetUrlAddition"\s*:\s*"([^"]+)"/);
const encoded = match?.[1] ?? null;
const address = decodeAddress(encoded);
```

## API

### `decodeAddress(encoded: string | null): Address | null`

Decodes an encoded address string. Returns `null` if the input is `null`, empty, or cannot be decoded.

### `Address`

```typescript
interface Address {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  district: string;
}
```

### Advanced usage

For custom decoding strategies, the underlying building blocks are also exported:

```typescript
import {
  DecodingStrategyChain,
  Base64JsonStrategy,
  DirectJsonStrategy,
  type DecodingStrategy
} from '@immo24/decoder';

const chain = new DecodingStrategyChain()
  .addStrategy(new Base64JsonStrategy())
  .addStrategy(new DirectJsonStrategy());

const raw = chain.decode(encoded);
```

## Requirements

Node.js >= 16

## License

MIT
