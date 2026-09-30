---
"@vtex-us-se/components": minor
"@vtex-us-se/ui": minor
---

Add 8 B2C presentational components, none needing their own GraphQL operation, so they install
via a plain `import` from `@vtex-us-se/ui` (or `se-components add`) with no copy-paste step.

- **`SeMegaMenu`** — desktop hover mega menu + mobile drawer navigation, up to 3 levels of
  categories. Ported from `fs-mega-menu`.
- **`SeBannerCarousel`** — auto-playing banner carousel with arrows, dots, and touch swipe.
  Ported from `faststore-usb2b9`; navigation/autoplay/swipe reimplemented natively instead of
  adding a `swiper` dependency.
- **`SeCardsCarousel`** — row of promo cards. Ported from `faststore-demoanalyst`, faithfully —
  the original has no actual scroll/drag carousel behavior, just a centered flex row for fewer
  than 3 cards.
- **`SeGridContent`**, **`SeHeroSection`**, **`SeLearnMoreSection`** — presentational content
  sections ported from `faststore-usb2b5c`, with hardcoded client content replaced by CMS props
  and `--fs-*` design tokens.
- **`SeImageTiles`** — grid of 2–4 image tiles. Ported from `faststore-hughtestenv`, merging what
  were two near-identical components (`imagetiles`/`imagetiles3`) differing only in tile count.
- **`SeProductCardWithButton`** — product card with image, price, and CTA button. Ported from
  `demo-poc-grill-house`, rebuilt self-contained since the original wrapped a
  `DefaultProductCard` that doesn't exist in this library.

Not ported: `SeGlobalTracker` (from `faststore-primegoods`/`faststore-att`/`faststore-demodollartree`,
byte-identical across all three) needs custom GraphQL mutations (`startSession`,
`sendProductViewEvent`) against a proprietary backend — deferred to the full
[`CLAUDE.md`](../CLAUDE.md) resolver process, same as the other complex components already
queued (`RecommendationShelf`, `Subscription`, `BeautyConsultant`/`V2`, `StoreLocator`).
