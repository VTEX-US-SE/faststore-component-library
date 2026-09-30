---
"@vtex-us-se/ui": patch
---

Fix `SeBannerCarousel` failing to compile in a real Next.js project with
`Syntax error: Selector "[data-fs-banner-carousel-arrows] button" is not pure (pure selectors
must contain at least one local class or id)`. Storybook's Vite build doesn't enforce this rule,
so it only surfaced when testing in an actual FastStore project.

`[data-fs-banner-carousel-arrows]` and `[data-fs-banner-carousel-dots]` were declared as
top-level selectors in `SeBannerCarousel.module.scss`, with no local class anywhere in the
chain — webpack's `css-loader` (used by Next.js's CSS Modules) rejects any selector like that.
Nested both blocks inside `.bannerCarousel` instead, matching `SeBanner`'s existing pattern for
its own `[data-fs-*]` hooks.
