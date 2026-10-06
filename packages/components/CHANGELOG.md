# @vtex-us-se/components

## 0.5.0

### Minor Changes

- b4172e5: Add wave 1 of the Buyer Portal kit (`faststore-b2b-buyer-portal-kit`) to the `b2b` entry point —
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

## 0.4.0

### Minor Changes

- 0ec937c: Add 2 more B2C presentational components, neither needing its own GraphQL operation.

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

## 0.3.0

### Minor Changes

- f31cfc9: Add 8 B2C presentational components, none needing their own GraphQL operation, so they install
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

## 0.2.1

### Patch Changes

- 0b105a3: Fix every integration bug found wiring `SeAssemblySet` into two real FastStore v4 projects
  (v4.7.0, `vtex-sites/starter.store`), and resolve the underlying architectural problem those
  bugs kept surfacing: a component whose logic calls a custom GraphQL operation cannot work as a
  plain npm import, no matter how the CLI scaffolds around it, because FastStore's GraphQL
  codegen can only see a `gql(...)` call whose argument is literal text physically inside the
  consuming project's own `src/` — never an imported constant, and never code living in
  `node_modules`.

  **The fix for that (new `@vtex-us-se/cli` capability):** `se-components add <ComponentName>`
  now detects, per component, whether its logic (in `@vtex-us-se/components`) touches
  `@vtex-us-se/resolvers`. If it does, `add` copies the component's **full source** — both its
  `@vtex-us-se/ui` files and the matching folder in `@vtex-us-se/components`, flattened into one
  directory under `src/components/sections/<Name>/` — instead of just its schema, rewriting
  cross-package imports as it goes: `@vtex-us-se/components(/segment)` becomes a relative import
  to the copied local barrel, and any `@vtex-us-se/resolvers/<subpath>` import that resolves to a
  **string** (a query/mutation constant) gets inlined as a literal template string wherever it's
  passed to `gql(...)`, with the import itself dropped. This is why `@vtex-us-se/ui` and
  `@vtex-us-se/components` now ship their raw `src/` (not just `dist/`) — the CLI needs readable
  source to copy. Components with no GraphQL dependency (`SeBanner`) are unaffected — still a
  plain npm import.

  Other bugs, all found in the same integration pass:

  - **`assemblySet.graphql`**: a `"""..."""` description sat directly above
    `extend type StoreProduct { ... }` — graphql-js rejects descriptions on type extensions
    (`Syntax Error: Unexpected description, only GraphQL definitions support descriptions`),
    breaking every consumer's GraphQL server boot. Moved onto the field. Added
    `packages/resolvers/scripts/validate-graphql.mjs` (now this package's `test` script) so this
    class of bug fails in CI going forward.
  - **`@vtex-us-se/ui`**: `@faststore/ui`/`@faststore/components` were regular `dependencies`
    pinned to `^3.99.4`, conflicting with `@faststore/core`'s `4.7.0` in any current FastStore v4
    project (two copies installed, Sass compiled across the mismatch —
    `Undefined mixin. @include focus-ring;`). Moved both to `peerDependencies` (`>=3.99.4 <5`).
  - **`add-resolver`**: used the consuming project's own `--namespace` (its target folder) as the
    package's actual npm export subpath too — broke exactly the way our own earlier guide's
    `--namespace thirdParty` example did, since `@vtex-us-se/resolvers` only ever exports `/b2c`.
    The subpath is now derived from where the operation actually lives under the installed
    package's `dist/`, independent of `--namespace`.
  - **`add-resolver`**, full fix for map-shaped operations: `meta.json` can now declare
    `typeExtensionKeys` (fields that extend an existing FastStore type, e.g. `StoreProduct`) —
    when present, the resolver is automatically **split** across FastStore's two fixed namespaces
    (`src/graphql/vtex/resolvers/`, `src/graphql/thirdParty/resolvers/`), and both namespaces'
    `resolvers/index.ts` aggregators are created or **safely merged into** (not just created once
    and left to rot): a fresh single re-export gets promoted to a spread-merge object on the
    second operation, and a third operation appends to that. Previously this file was left
    entirely hand-written, which is exactly where a reported bug (`index.ts` containing the
    literal word `resolvers`) came from.
  - **`add`**: `src/components/index.tsx`'s registration now gets a real merge attempt (not just
    a "not touched, here's a snippet" message) when its existing default export is a plain
    `{ A, B, C }` object of bare names — the common case (including `@faststore/core`'s own
    starter stub, `export default {}`). Anything more elaborate is still left untouched with
    instructions, rather than risk corrupting it.
  - **`add-resolver`**'s client query wrapper (`src/utils/<file>.ts`) now embeds the operation's
    query/mutation text **literally** instead of importing the constant from
    `@vtex-us-se/resolvers` — the same codegen-visibility fix as the component copy-paste mode,
    for anyone writing their own component directly against a resolvers operation.
  - **`add-resolver`**'s generated resolver snippet now surfaces every `configParams` entry
    declared in an operation's `meta.json`, not just the hardcoded `storeId`/`environment` pair —
    `checkoutBaseUrl` now appears as a commented suggestion instead of being silently dropped, and
    `createAssemblySetResolver` itself warns at runtime when it's omitted (its default calls the
    VTEX platform host directly, which is often wrong for a project proxying `/api/checkout/*`
    through its own domain).

  New: `IMPLEMENTATION.md` (step-by-step setup, a troubleshooting table with the exact error
  messages this pass found, and a verification checklist) and `packages/resolvers/README.md`
  (didn't exist before). `packages/cli/README.md`, `packages/ui/README.md`, and
  `packages/components/README.md` updated to match current behavior and to document
  `SeAssemblySet`.

  Verified end-to-end against a symlinked local build simulating a real consuming project:
  `add SeAssemblySet` copies working, standalone source with both operations correctly inlined
  (confirmed with a syntax/type probe and a grep for leftover `@vtex-us-se/*` references — none);
  `add-resolver assemblySet` produces the correct `vtex`/`thirdParty` split; the aggregator merge
  logic (both `resolvers/index.ts` and `components/index.tsx`) was exercised directly for the
  single→spread and spread→spread-with-a-third-entry cases. Not yet re-verified against a live
  VTEX account's real Checkout/Catalog APIs — see the verification checklist in
  `IMPLEMENTATION.md`.

- Updated dependencies [0b105a3]
  - @vtex-us-se/resolvers@0.2.1

## 0.2.0

### Minor Changes

- d0d2d19: Add `SeAssemblySet`, a customisable set builder, and generalize the resolvers mechanism to
  support field-level (not just root Query/Mutation) GraphQL extensions.

  - New package **`@vtex-us-se/resolvers`** (recreated on `main` — the earlier B2B-only version of
    this package stayed on `feat/b2b-request-to-buy-resolvers` pending that PR): server-only,
    no React, ships real importable GraphQL resolver functions, typeDef strings, and client query
    strings, organized by GraphQL **operation** rather than by component. First operation:
    `assemblySet`, ported from `poc-arbonne-clone`'s `AssemblySet` (chosen over the two other
    candidates surfaced in the component inventory, `fs-assembly-options` and
    `faststore-sleepnumber`'s `AssemblyOptions`, both untyped ports of the old VTEX IO widget with
    no atomic cart composition).
  - The resolver, `createAssemblySetResolver(config)`, returns a **map** spanning `StoreProduct`
    (a field-level `assemblyOptions` resolver, not a root Query/Mutation field), `Mutation`
    (`seAddComposedSet`, which composes the whole set into Checkout atomically so a half-finished
    sequence never leaves orphan parent lines), and `SeAssemblyItem` (hydrates each child SKU via
    the VTEX platform's own `ctx.loaders.skuLoader`). This is new shape the CLI didn't support
    before: `add-resolver.ts`'s `OperationMeta` gains an optional `resolverShape: "field" | "map"`
    (default `"field"`, so `submitOrganizationRequest` on the B2B branch is unaffected once merged)
    — `"map"` writes `export default factory(...)` unwrapped instead of assuming the factory
    returns one Query/Mutation field.
  - New component: `SeAssemblySet` (`@vtex-us-se/ui`), split the same way as every other component
    in this library — orchestration (`useAssemblySet`, in `@vtex-us-se/components`) consumes the
    query/mutation strings from `@vtex-us-se/resolvers` directly. Takes a `skuId` prop rather than
    reading a router query param (the original reads `?set=`), so page composition stays the
    consuming project's own decision.
  - `packages/components/src/global.d.ts` now also covers `useQuery_unstable`, `useCart_unstable`,
    and broadens `useSession_unstable`'s return shape (`channel`/`locale`) — same rationale as the
    existing `useLazyQuery_unstable`/`gql` shims.
  - Storybook: added `.storybook/mocks/faststore-core-*.ts` (same rationale as the B2B branch —
    the real `@faststore/core/experimental`/`api` modules crash Vite's dependency scan) with fixture
    data for `SeAssemblySet`'s story, and the `/b2c` subpath aliases for
    `@vtex-us-se/{ui,components,resolvers}`.

### Patch Changes

- Updated dependencies [d0d2d19]
  - @vtex-us-se/resolvers@0.2.0

## 0.1.0

### Minor Changes

- db17e86: Segment the library into B2C and B2B, and add the first B2B component.

  - `src/` in both `@vtex-us-se/ui` and `@vtex-us-se/components` now splits into `b2c/`/`b2b/`
    folders, each with its own package entry point (`.` stays B2C-only for backward
    compatibility; `/b2b` is new) — so a B2C-only project never pulls in B2B-only dependencies
    (`@faststore/core` in particular) just by importing the package root.
  - New component: `SeWelcomeBackMessage` (`@vtex-us-se/ui/b2b`, `useB2bSession` from
    `@vtex-us-se/components/b2b`), ported from
    [`faststore-b2b-buyer-portal-kit`](https://github.com/VTEX-US-SE/faststore-b2b-buyer-portal-kit)
    — the simplest, GraphQL-free component in that kit, as a pilot for the segmentation. No
    Storybook story: it renders nothing outside a real B2B session, and `@faststore/core` can't
    be cleanly bundled by Vite/Storybook outside an actual Next.js/FastStore build.
  - `@faststore/core` is a new **optional** peer dependency of `@vtex-us-se/components` (only
    needed if you import from `/b2b`).
  - CLI (`se-components add`): now searches one segment folder deep under `dist/` for a
    component's schema, instead of assuming a flat `dist/<ComponentName>/` layout — needed since
    `SeBanner`'s schema moved to `dist/b2c/SeBanner/` as part of this segmentation.

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
