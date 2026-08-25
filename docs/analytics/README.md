# Analytics archive (Chrome Web Store)

A closing snapshot of what the IS24 Address Finder extension reached during its
active life, kept here because the store listing is being withdrawn.

Source: Chrome Web Store Developer Dashboard exports plus the public store page,
captured on 2026-08-25. Raw CSVs are next to this file.

## Data files

- `weekly-users.csv` — weekly active users per day
- `installations.csv` — installations per day
- `installations-by-region.csv` — installations per day, split by country
- `store-page-views.csv` — store listing page views (impressions) per day

Export range: 2025-08-24 to 2026-08-23 (365 days).

## Highlights

- **Peak / final weekly active users: 864** (2026-08-23, the last day in the export).
- **First installs: 2025-09-24** (first non-zero day; the extension launched in
  late September 2025).
- **Total installations over the year: ~1,453.**
- **Installations by country** (top): Germany ~997 (68%), USA ~383 (26%), then a
  long tail (United Kingdom 13, Japan 11, India 7, Netherlands 5, and others in
  single digits).
- **Store page views: ~3,310 total** over the year, busiest day 149 views (2026-04-06).
- **Store rating: 5.0 from 4 reviews** (public store page, 2026-08-25).

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
