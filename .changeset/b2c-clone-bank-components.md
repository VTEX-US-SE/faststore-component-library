---
'@vtex-us-se/ui': minor
'@vtex-us-se/components': minor
'@vtex-us-se/cli': minor
---

Add `SeEditorialSplit`, `SeProductImageGrid`, `SeProductListing` (wraps FastStore's native product gallery), `SeProductReviews` (presentation only, reviews passed as a prop) and `SeFooter`. `SeImageTiles` gains `captionPosition: "below"` (per-tile `title` and `linkLabel`), `columns`, `aspectRatio` and `maxWidth`, with unchanged defaults. `SeGridContent` gains `columns` and `variant: "caption-below"`, and now reads only standard FastStore theme tokens instead of private ones with blue fallbacks. `@vtex-us-se/components` pins `sanitize-html` to `>=2.13.0 <2.17.2`, since 2.17.6+ pulls the ESM-only `htmlparser2` 12 and breaks `next build`.

`se-components add` now also source-copies components whose logic carries `// @se-components source-copy: core-runtime` (first: `SeProductListing`). Such components need the store's own `@faststore/core` instance (page context, native sections), which code inside `node_modules` never gets. `SeFooter` incentives use the native `firstLineText` field.
