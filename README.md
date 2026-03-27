# Immo24 Address Finder

[![CI](https://github.com/kidzki/immo24-address-decoder/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/kidzki/immo24-address-decoder/actions/workflows/ci.yml)
[![Tests](https://github.com/kidzki/immo24-address-decoder/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/kidzki/immo24-address-decoder/actions/workflows/test.yml)
[![Release](https://img.shields.io/github/v/release/kidzki/immo24-address-decoder?display_name=tag&sort=semver)](https://github.com/kidzki/immo24-address-decoder/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[![Uses Bun](https://img.shields.io/badge/Uses-Bun-000000?logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=google-chrome&logoColor=white)](https://chrome.google.com/webstore/detail/IMMO24_EXTENSION_ID)
[![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-FF7139?logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/firefox/addon/IMMO24_ADDON_SLUG)



A simple browser extension for Chrome/Chromium and Firefox that decodes hidden address information on ImmobilienScout24 listings and makes it visible.

## ✨ Features

- Works on ImmobilienScout24 expose pages (`https://www.immobilienscout24.de/expose/*`)
- Overlay toggle via **Ctrl+B** / **⌘+B**
- Supports multiple languages: **German**, **English**, **Spanish**, **Italian**
- Options page with language selection, repo link, and version display
- Minimalistic extension icon in ImmoScout24 colors
- Separate builds for **Chromium (MV3)** and **Firefox (MV2)**

## 🛠️ Development

### Requirements
- [Bun](https://bun.sh/) ≥ v2 latest  
- `zip` CLI installed (for packaging)
- TypeScript 5.9+

### Install dependencies
```bash
bun install
```

### Build
```bash
# Type check
bun run typecheck

# Build extension
bun run build

# Full build with type check and packaging
bun run build:all
```

Outputs:
- `dist/chromium/` – unpacked MV3 build for Chromium-based browsers
- `dist/firefox/` – unpacked MV2 build for Firefox
- `dist/immo24-chromium.zip` – packaged Chromium extension
- `dist/immo24-firefox.zip` – packaged Firefox extension

**Note:** The extension version in `manifest.json` is automatically synced from `package.json` during build.

### Load unpacked
- **Chrome/Edge/Brave**: open `chrome://extensions`, enable developer mode, *Load unpacked*, select `dist/chromium/`.
- **Firefox**: open `about:debugging#/runtime/this-firefox`, *Load Temporary Add-on*, select `dist/firefox/manifest.json`.

## 🧪 Testing

```bash
# Run unit tests
bun run test

# Run E2E tests
bun run test:e2e

# Run tests with UI
bun run test:ui

# Generate coverage report
bun run test:coverage
```

## 📦 Release Process

1. Bump version in `manifest.json` and `package.json`.
2. Commit and tag:
   ```bash
   git add manifest.json package.json
   git commit -m "chore: bump version to x.y.z"
   git tag vX.Y.Z
   git push origin main vX.Y.Z
   ```
3. GitHub Actions will:
   - Build & minify extension
   - Create ZIPs for Chromium & Firefox
   - Commit them into `packages/<version>/`
   - Attach them to a GitHub Release

## 🔒 Firefox Notes

- Firefox requires Manifest V2 → the build script automatically converts MV3 → MV2:
  - `background.service_worker` → `background.scripts`
  - `host_permissions` moved into `permissions`
  - Adds `browser_specific_settings.gecko` with:
    - `id`
    - `strict_min_version`
    - `data_collection_permissions` (with `required: ["none"]` if no data is collected)

## 📂 Project Structure

```
├── _locales/         # translations (de, en, es, it)
├── icons/            # extension icons (16,32,48,128 px)
├── bg.js             # background script
├── content.js        # content script
├── options.html      # options page
├── options.js        # options page logic
├── manifest.json     # base manifest (MV3 for Chromium)
├── scripts/build.mjs # build script
```

## 📚 Documentation

For detailed documentation, see the [docs/](docs/) directory:

- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and design patterns
- **[TypeScript Migration](docs/MIGRATION.md)** - Migration guide and setup
- **[Privacy Policy](docs/PRIVACY_POLICY.md)** - Extension privacy policy

## ❤️ Contributing

PRs welcome! Please open an issue first for discussion if you want to add a new feature.

---

<div align="center">
Made with ❤️ in Germany ·  
<a href="https://github.com/kidzki/immo24-address-decoder">GitHub Repo</a>
</div>
