---
"@vtex-us-se/components": minor
"@vtex-us-se/ui": minor
---

Add wave 1 of the Buyer Portal kit (`faststore-b2b-buyer-portal-kit`) to the `b2b` entry point —
every component in it that needs no custom GraphQL operation, so all are plain npm imports:

- **`SeActionHubBulletinBoard`** — signed-in quick actions + announcements board.
- **`SeCategoryBanners`** — up to three promo banners (row on desktop, swipeable strip on mobile).
- **`SeFooterB2B`** — link columns (accordion on mobile), native newsletter signup, social icons,
  bottom bar. `components` adds `useNewsletterSubscription()`.
- **`SeCustomProductCard`** — login-gated product card (price/price range when signed in, "Login
  for price" otherwise). `components` adds `useB2bProductCard()` and `SeProductSummary`.
- **`SeCustomShelfProduct`** — product shelf over FastStore's native `useProductsQuery`
  (`components`: `useB2bShelfProducts()`).
- **`SeCustomCrossSellingShelf`** — PDP cross-selling shelf: native `CrossSellingShelf` section with
  its card overridden (`components`: `useCrossSellingShelfOverride()`).

The kit's `swiper` carousels and JS screen-size hooks are replaced by CSS; prices follow the
session currency instead of a hardcoded `en-US`/`USD`; the login URL is a prop instead of a
`discovery.config` import.
