# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-08-25

### ⚠️ Deprecated / Archived

- **Project archived. The extension no longer works.** ImmobilienScout24 removed
  the `obj_telekomInternetUrlAddition` field that carried the hidden address as a
  base64 string, and with it the only client-side path to the address. For hidden
  listings the street and house number are now stripped server-side and are not
  present in the page in any form, nor fetched by any request. The only geodata
  left is a randomly offset map coordinate (measured 130 m to 320 m off the true
  building), which cannot recover the address.
- A "probable area" circle around the fuzzed coordinate was considered and
  rejected (insufficient ground-truth data to set an honest radius; a different
  product).
- Full investigation: `docs/INVESTIGATION-2026-08.md`.

_This entry summarizes an AI-assisted investigation (Claude Code) on 2026-08-25.
Findings were checked against live pages; the coordinate-offset measurement rests
on two verified address pairs and is a small sample._

## [0.3.0] - 2026-03-29

### ✨ Features

- **Google Earth Button**: New button in the overlay to open the decoded address directly in Google Earth (configurable emoji button in the corner)
- **Expose Metadata**: Listing publication and last-modified dates are now shown in the overlay
- **Date display toggle**: New option in settings to show or hide the date fields
- **Overlay without address**: The overlay is now shown even when the address cannot yet be decoded — metadata is still visible

### 📦 Packages

- **`@immo24/decoder` v0.1.0**: Address decoding logic extracted into a standalone npm package
- **`@immo24/metadata` v0.2.0**: IS24 metadata extraction as a standalone npm package (`window.IS24` parsing)

### 🐛 Bug Fixes

- Fixed TypeScript path alias resolution for `@immo24/decoder`
- Fixed HTTPS error in Google Earth link; adjusted zoom level and styling
- Corrected E2E translation tests

### 🔧 CI/CD

- Added npm publish workflow for `@immo24/metadata`

### 🔄 Refactoring

- Removed unused dead code (adapters, builders, commands, factories, services)

### 📚 Documentation

- Updated architecture documentation
- Added README for `@immo24/metadata` package with API reference and usage examples

---

## [0.2.0] - 2025-10-07

### 🎉 Major Changes

#### TypeScript Migration
- Complete migration from JavaScript to TypeScript with strict mode enabled
- Full type safety across all components
- Improved developer experience and code maintainability

#### Dynamic Locale Switching
- **New Feature**: Overlay language now updates immediately when changing language in options
- No page reload required - seamless user experience
- Implemented message passing architecture between content and background scripts
- Resolves Content Security Policy limitations

### ✨ Features

- **Architecture Refactoring**:
  - Introduced clean architecture patterns (Strategy, Factory, Builder, Adapter)
  - Separated concerns into distinct modules (builders, factories, strategies, services)
  - Added browser API adapter for cross-browser compatibility
  - Improved code organization and testability

- **Enhanced Build System**:
  - Modern TypeScript build pipeline with esbuild
  - Automated version synchronization between package.json and manifest.json
  - Optimized bundle size (6.9kb final size)
  - Separate builds for Chromium and Firefox

### 🐛 Bug Fixes

- **Spanish Locale**: Added 7 missing translation keys for language selection
- **Spanish Grammar**: Fixed position descriptions ("Abajo a la derecha" instead of "Abajo derecha")
- **Italian Locale**: Removed technical references from user-facing descriptions
- **English Locale**: Corrected multiple translation inconsistencies

### 🧪 Testing

- **Comprehensive Test Suite**:
  - 45 unit tests (Vitest)
  - 54 E2E tests (Playwright)
  - **99 total tests** with 100% pass rate
  
- **Test Coverage**:
  - Translation logic and locale switching
  - Decoding strategies (Base64, ROT13, URL encoding)
  - Overlay builder and factory patterns
  - Options page functionality
  - Locale file completeness and quality
  - User interaction workflows

### 🔧 CI/CD

- **GitHub Actions Workflows**:
  - Automated testing on push and pull requests
  - Build verification for both Chromium and Firefox
  - Status badges in README
  - Continuous integration pipeline

### 📚 Documentation

- Comprehensive architecture documentation
- Migration guide from 0.1.x to 0.2.0
- Testing strategy and guidelines
- CI/CD workflow documentation
- Updated README with build instructions and testing info

### 🔄 Refactoring

- Removed Storybook (incompatible with Bun runtime)
- Replaced with Vitest + Playwright testing stack
- Cleaned up legacy code and documentation
- Improved .gitignore (added .DS_Store for macOS)

### 🌍 Localization

All 4 locales (German, English, Spanish, Italian) are now:
- ✅ Complete (39 keys each)
- ✅ Grammatically correct
- ✅ User-friendly (no technical jargon)
- ✅ Fully tested with E2E validation

### 🔒 Security

- Implemented CSP-compliant message passing for locale loading
- No direct fetch from content scripts
- Secure communication between extension contexts

---

## [0.1.6] - Previous Release

### Changes
- Basic functionality for decoding hidden addresses on ImmoScout24
- Support for 4 languages (German, English, Spanish, Italian)
- Configurable overlay position and language

---

## Installation

Download the appropriate package for your browser:
- **Chromium/Chrome/Edge**: `immo24-chromium-0.3.0.zip`
- **Firefox**: `immo24-firefox-0.3.0.zip`

## Migration from 0.1.x

This release is fully backward compatible. Your existing settings will be preserved.

## Contributors

- [@kidzki](https://github.com/kidzki)

## Links

- [GitHub Repository](https://github.com/kidzki/immo24-address-decoder)
- [Issues](https://github.com/kidzki/immo24-address-decoder/issues)
- [Privacy Policy](docs/PRIVACY_POLICY.md)
