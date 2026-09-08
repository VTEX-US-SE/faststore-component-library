---
"@vtex-us-se/ui": patch
"@vtex-us-se/components": patch
---

Fix pixelated `SeBanner` images in production: the component always requested a single
360px-wide image from `imageLoader` regardless of how large it was actually rendered (up to
90vw/50vw of the viewport, with no `srcset`), so larger viewports upscaled a low-resolution
image.

`SeBanner` now generates a real `srcset` (default widths: 360/768/1200/1920, overridable via
the new optional `imageWidths` prop) by calling `imageLoader` once per width, applied to both
image render paths (the full-bleed background-style image and the side-by-side layout image).
`width`/`height` scale with the largest requested width while keeping the original aspect
ratio, only to reserve layout space — actual sizing still comes from CSS.

No change for consumers that don't pass `imageLoader` — behavior (a single unresized `src`, no
`srcset`) is unchanged, and `ImageLoaderParams`/`SeBannerProps`'s existing fields are untouched.
