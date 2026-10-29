---
"@vtex-us-se/resolvers": minor
"@vtex-us-se/components": minor
"@vtex-us-se/ui": minor
"@vtex-us-se/cli": minor
---

Add the rest of `faststore-b2b-buyer-portal-kit` (wave 2): `SeRecentOrdersSpendOverview`,
`SeDashboards`, `SeAddressSelector`, `SeProductGalleryB2B`, `SeCheckStockAndPricing` and
`SePurchaseLists`. With these, all 13 kit components are in the library. All six need source copy
(`se-components add`) plus their `add-resolver` operations.

- **resolvers**: six `b2b` operations — `recentOrdersSpendOverview`, `dashboards`,
  `shopperAddresses`, `b2bProductFields` (a `vtex` `StoreProduct` extension delivered through the
  `ClientManyProducts` fragment), `skuAvailability` (standard cart simulation by default) and
  `purchaseLists`. Fields are `se`-prefixed; shopper calls forward only the VTEX ID/session
  cookies; failures resolve to `null`/`[]` instead of GraphQL errors. **Security fix vs. the
  kit:** purchase-list mutations now authorize every call against the buyer's own session (the
  kit let any signed-in buyer edit any list by id) and validate values used in Master Data
  `_where` clauses.
- **components**: hooks for the six components, plus the
  `@vtex-us-se/components/product-gallery-b2b` subpath (`core-runtime` source copy, outside the
  barrels). Lazy-query `execute` is read through refs: FastStore's real one changes every render
  and caused request loops as an effect dependency.
- **ui**: the six components and their CMS schemas. No `swiper`, `papaparse`, `react-hot-toast`
  or `@faststore/ui` overlays: CSS scroll-snap, a built-in CSV parser and self-contained dialogs.
  `SeProductGalleryB2B` is source-copy only, like `SeProductListing`.
- **cli**: `add-resolver` writes FastStore query fragments declared in an operation's
  `meta.json` (`"fragments"`) to `src/fragments/`, never overwriting an existing one (it prints
  the selections to merge instead); accepts operations with no client query; calls config-less
  factories with `{}`; drops the `typeExtensionKeys` hint for map operations whose `meta.json`
  already sets a `namespace`. New `--fragments-dir` option.
