# Analytics archive

A closing snapshot of what the IS24 Address Finder extension reached during its
active life, kept here because both store listings are being withdrawn. Covers
the Chrome Web Store and the Firefox add-on (AMO).

Captured on 2026-08-25.

## Data files

Chrome Web Store (Developer Dashboard CSV exports, range 2025-08-24 to 2026-08-23):

- `weekly-users.csv` — weekly active users per day
- `installations.csv` — installations per day
- `installations-by-region.csv` — installations per day, split by country
- `store-page-views.csv` — store listing page views (impressions) per day

Firefox / AMO (no CSV export available, transcribed from the dashboard):

- `firefox-amo.md` — transcribed stats
- `firefox-amo-2026-08-25.png` — dashboard screenshot (source of truth)

## Highlights (Chrome Web Store)

- **Peak / final weekly active users: 864** (2026-08-23, the last day in the export).
- **First installs: 2025-09-24** (first non-zero day; the extension launched in
  late September 2025).
- **Total installations over the year: ~1,453.**
- **Installations by country** (top): Germany ~997 (68%), USA ~383 (26%), then a
  long tail (United Kingdom 13, Japan 11, India 7, Netherlands 5, and others in
  single digits).
- **Store page views: ~3,310 total** over the year, busiest day 149 views (2026-04-06).
- **Store rating: 5.0 from 4 reviews** (public store page, 2026-08-25).

## Highlights (Firefox / AMO)

- **Average daily users: 48** over the last 365 days (recent daily-users figure: 92).
- **Peak daily users: 116** (2026-08-18).
- **192 downloads** in the last 365 days (5 per week at the end).
- Platforms: Windows 68%, Mac 18%, Linux 14%. Languages: German 79%, English 19%.

Details in `firefox-amo.md`.

## Context

Weekly active users grew steadily to ~860 over the year. In mid-August 2026 the
core feature stopped working after ImmobilienScout24 removed the field that
carried the hidden address (see `../INVESTIGATION-2026-08.md`). Three of the four
reviews are from that period and report exactly this. The project was archived on
2026-08-25.

---

_Compiled by an AI-assisted step (Claude Code) on 2026-08-25 from the maintainer's
dashboard CSV exports and the public store page. The aggregate figures above were
computed from those CSVs and should be treated as a summary; the raw files are the
source of truth. Not independently audited._
