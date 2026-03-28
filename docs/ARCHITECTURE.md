# Architecture Overview

## Project Structure

```
immo24-address-finder/
├── packages/
│   └── decoder/                        - Standalone npm package (@immo24/decoder)
│       ├── src/
│       │   ├── decoder.ts              - Decoding strategies + decodeAddress()
│       │   ├── types.ts                - Address interface (English field names)
│       │   └── index.ts               - Public API
│       └── tests/
│           └── decoder.test.ts
├── src/                                - Browser extension
│   ├── bg.ts                          - Background service worker
│   ├── content.ts                     - Main content script
│   ├── options.ts                     - Options page
│   ├── types.ts                       - Shared extension types
│   └── globals.d.ts                   - Browser API declarations
├── scripts/
│   ├── build.ts                       - esbuild build script
│   └── make-icons.ts                  - Icon generator
└── _locales/                          - i18n (de, en, es, it)
```

## Packages

### @immo24/decoder

A standalone, platform-agnostic npm package containing all address decoding logic. It has no browser or DOM dependencies and works in Node.js and browser environments.

**Exported API:**
```typescript
import { decodeAddress } from '@immo24/decoder';

const address = decodeAddress(encodedString);
// { street, houseNumber, postalCode, city, district }
```

**Decoding strategies (Chain of Responsibility):**
1. `Base64JsonStrategy` — decodes Base64/URL-safe Base64 with multi-encoding support (UTF-8, Windows-1252, ISO-8859-1)
2. `DirectJsonStrategy` — parses direct or URL-encoded JSON

The chain tries strategies in order and returns the first successful result. Raw ImmoScout24 field names (`strasse`, `hausnummer`, `plz`, `ort`, `ortsteil`) are mapped to English names internally.

The extension imports this package via bun workspaces (`workspace:*`).

## Extension Build

The extension is built with esbuild (`bundle: true`, `format: iife`). The three entry points are:

| File | Output | Purpose |
|------|--------|---------|
| `src/content.ts` | `content.js` | Injected into ImmoScout24 pages |
| `src/bg.ts` | `bg.js` | Background service worker |
| `src/options.ts` | `options.js` | Options page |

Each entry point is bundled independently. `@immo24/decoder` is resolved via the workspace and bundled into `content.js`.

## Data Flow

```
ImmoScout24 page
  └─ obj_telekomInternetUrlAddition (Base64 JSON in page source)
       └─ extractEncodedFromScripts()   [content.ts — DOM]
            └─ decodeAddress()          [@immo24/decoder — pure]
                 └─ Address { street, houseNumber, postalCode, city, district }
                      └─ createOverlay()   [content.ts — DOM]
                           └─ Overlay UI rendered on page
```

## i18n

Translations live in `_locales/{de,en,es,it}/messages.json`. The extension uses `chrome.i18n.getMessage()` by default, with an optional locale override stored in sync storage.

## CI/CD

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `ci.yml` | push/PR to master | typecheck → unit tests (incl. decoder) → e2e tests → build → release |
| `publish-decoder.yml` | tag `decoder/v*` | test → publish to npm |
