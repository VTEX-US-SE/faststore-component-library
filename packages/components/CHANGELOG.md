# @vtex-us-se/components

## 0.0.2

### Patch Changes

- f50b530: Fix pixelated `SeBanner` images in production: the component always requested a single
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

## 0.0.1

### Patch Changes

- 2fbdd82: Fix a packaging bug that broke `require()`/`import` of the compiled package in any
  Node.js or Next.js (SSR) consumer, reproducible with `node -e "require('@vtex-us-se/ui')"`.

  The shared `tsconfig.base.json` compiled to ESM syntax (`export { X } from './x'`, no file
  extension) while `package.json` didn't declare `"type": "module"`. Node then autodetected the
  compiled `.js` files as ES modules by their syntax, but ESM resolution requires explicit
  extensions on relative imports — which the emitted code didn't have — causing
  `ERR_MODULE_NOT_FOUND`. Compiling to CommonJS instead (`module: "commonjs"`,
  `moduleResolution: "node"`) sidesteps the issue entirely, matching how the rest of the
  FastStore/VTEX ecosystem consumes these packages (CJS/webpack, not pure ESM).
