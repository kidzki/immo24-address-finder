# Investigation: why hidden-address decoding stopped working (2026-08)

Status: the core feature of this extension is defunct. This document records what
was checked and what was found, so the conclusion can be re-examined later.

Produced by an AI-assisted investigation (Claude Code) on 2026-08-24 and
2026-08-25, using live inspection of ImmobilienScout24 pages through the Chrome
DevTools MCP. Findings marked "verified" were observed directly on live pages.
Findings marked "inferred" are reasoning from the delivered code or from a small
sample, not independently confirmed.

## How the extension worked

The content script read a base64 string from the page source, specifically the
`obj_telekomInternetUrlAddition` field inside the inline `<script>` blocks
(`src/content.ts`, `extractEncodedFromScripts()`), and decoded it into the full
street address. That field was populated by IS24's old Telekom speedcheck
integration and contained the address even when the listing hid it from view.

## What changed

IS24 removed the `obj_telekomInternetUrlAddition` field from expose pages, and
with it the client-side path that carried the hidden address.

## What was checked

### 1. The encoded field is gone (verified)

`obj_telekomInternetUrlAddition` no longer appears on any expose page. Checked
first on ~40 listings, later on ~90 more across regions (NRW, Bayern, Berlin,
Rheinland-Pfalz, Baden-Württemberg) and categories (Kauf and Miete), with hidden
and public addresses, Telekom available and not. The field is absent in every
case.

### 2. No decoder or address logic left in the app bundles (verified)

Grepped the delivered bundles (`expose.js`, `reactApp.js`, ~4.7 MB combined):
zero occurrences of `UrlAddition` or `telekomInternetUrl`. The React app reads
the address only from the inline `IS24.expose.locationAddress` and gates
rendering with:

```js
if (!(e?.isFullAddress && e?.houseNumber && e?.street)) return null;
```

For hidden listings `street` and `houseNumber` are absent from the delivered
HTML. The address is stripped server-side before the page reaches the browser.
It is not hidden client-side, it is not there at all.

### 3. The `locationAddress` path has no value for us (verified)

- Public listings (`isFullAddress: true`) carry `street` and `houseNumber` in
  plain text. But IS24 already displays that address in the page header, so
  reading it adds nothing.
- Hidden listings (`isFullAddress: false`) carry only `zip`, `city`, `geoCode`.
  No street.

The visible difference is the address line under the title: public listings show
"Street No, District, ZIP City"; hidden listings show only "ZIP City, District".

### 4. Map coordinates for hidden listings are fuzzed (verified, small sample)

The only geodata left for a hidden listing is `exposeMap.location.latitude /
longitude`. It is randomly offset from the true building:

| Listing | Area | Offset from true address | Direction |
|---|---|---|---|
| 165387584 | Mechernich (rural) | ~320 m | south-east |
| 169175925 | Düsseldorf (urban) | ~132 m | north-east |

Two ground-truth pairs (real addresses supplied by the maintainer). The offset
varies in both magnitude and direction, so it is a per-listing random
displacement, not a fixed vector or radius. A point-in-polygon check against
IS24's own ZIP-code polygons showed 5 of 7 sampled hidden listings sitting
outside their own stated ZIP area, often in the neighbouring municipality.
Reverse-geocoding the fuzzed coordinate therefore does not recover the address.

Note: rural OpenStreetMap address coverage is incomplete, which further limits
any "enumerate the buildings near the point" approach. For example the true house
"Am Wasserfall 28" in Mechernich is not mapped in OSM.

### 5. The "probable area" circle was considered and rejected (decision)

An honest fallback would be to draw a circle of radius R (the maximum fuzz) around
the coordinate. The true building is then guaranteed to lie inside it, and even
R = 1 km would be far tighter than what IS24 shows for hidden listings (the whole
ZIP polygon, roughly 15 km across in rural areas). This was not built:

- Only two ground-truth pairs exist, not enough to set R responsibly. Too small
  an R misleads (the house falls outside the circle); too large an R is nearly
  worthless, especially in cities.
- It is a different product ("probable area", not "exact address") and carries an
  ongoing data-collection and maintenance cost, with the risk that IS24 also
  coarsens or removes the coordinate.

### 6. Telekom integration carries no hidden address (verified)

- On page load there is no network request to Telekom at all (checked across the
  full request set of several listings, including after scrolling the Telekom
  section into view).
- The map's coverage layers (Mobilfunk / DSL) fire only when the user manually
  toggles them. They call `t-map.telekom.de/arcgis/rest/services/public/
  {coverage_immo24,dsl_coverage_immo24}/MapServer`. The `useNewTelekomEndpoint`
  flag only switches the rendering: old = ArcGIS raster tiles via `/export?bbox=`,
  new = MVT vector tiles over WebGL. Both send only the visible map bounding box
  or tile grid plus a token. No address, no exact coordinate.
- `IS24.expose.mediaAvailabilityModel.productUrl` (the "Tarife ansehen" link) does
  carry a base64 `address=` parameter that decodes to the full address
  (`{ort, ortsteil, strasse, hausnummer, hausnummerzusatz, plz, klsid}`). But this
  appears ONLY when `isFullAddress: true`. Verified across 89 hidden listings: not
  one carried the parameter; the link was the bare `rebrand.ly/speedcheck-web`.
  So it exposes only addresses that are already public. It is not a leak for
  hidden listings.

### 7. The internet-speed value is server-derived and shown for hidden listings (verified / inferred)

The internet-speed banner ("Bis zu X MBit/s") is shown for hidden listings too,
with a concrete value. IS24's own disclaimer states the speed is "auf Basis der
Standortadresse" (based on the property address). So the value is computed
server-side from the real address and only the result is exposed. The
address-to-speed resolution between IS24 and Telekom happens server-to-server and
is not observable in the browser. The speed itself is a weak locating signal (it
is usually uniform across a street or DSLAM area). (Verified: the banner and value
are present on hidden listings. Inferred: that the value is address-precise, from
the disclaimer text, not from independent measurement.)

### 8. No second entry point for the address (verified)

On a hidden listing, the real street ("Am Wasserfall") was searched for across the
entire HTML plus all inline scripts: not present as plain text, not as hex, and
not as base64 (3581 base64-like tokens were decoded and checked). The only
`street` field in the code was the realtor's company address, not the property. On
a public listing the base64 address appears at exactly one source,
`mediaAvailabilityModel.productUrl` (a duplicate count came from scanning HTML and
inline scripts together). There is no second, separate mechanism.

## Conclusion

For listings that hide the address, the street and house number no longer reach
the browser in any form, and the only remaining geodata is a randomly offset
coordinate. The exact hidden address cannot be recovered. The feature is dead and
the project is archived.

## Decision

Archive the extension. Mark it defunct in the README and changelog. Stop
development. The maintainer will withdraw the store listing.
