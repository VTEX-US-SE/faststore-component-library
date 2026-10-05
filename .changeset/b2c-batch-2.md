---
"@vtex-us-se/components": minor
"@vtex-us-se/ui": minor
---

Add 2 more B2C presentational components, neither needing its own GraphQL operation.

- **`SeHeader`** — static site header (topbar, logo, search form, account area), ported from
  `faststore-usb2b5c`. All hardcoded client content removed; every block is optional props/CMS.
  The search is a real `<form role="search">` with `onSearch` or `search.action`.
- **`SeValuePropCards`** — value-proposition cards, ported from `faststore-usb2b6`. Swiper
  replaced with a native CSS grid. The source's optional per-card cluster filter used a custom
  `getCustomerClusters` query; it is now a `customerClass` prop (and `locale`), so no GraphQL ships.

Evaluated but **not ported** (each needs its own GraphQL, so they go through the CLAUDE.md
resolver process): `SkuAccordion` (B2B order guides + cart), `ClusterMenu`
(`getCustomerClusters`), `DoctorsHeader` (custom `doctors` query), `ProductSpecifications`
(needs a `ServerProduct` fragment extension for `specificationGroups`).
