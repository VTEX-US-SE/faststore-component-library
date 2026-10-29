# @vtex-us-se/cli

## 8.0.0

### Minor Changes

- 8d2885f: Add the rest of `faststore-b2b-buyer-portal-kit` (wave 2): `SeRecentOrdersSpendOverview`,
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

### Patch Changes

- Updated dependencies [8d2885f]
  - @vtex-us-se/resolvers@0.4.0
  - @vtex-us-se/ui@0.8.0

## 7.0.0

### Major Changes

- b5a3c87: Add `SeRequestToBuy` (B2B, from `faststore-b2b-buyer-portal-kit`) — the first B2B component with
  its own GraphQL operation — and fix three `add-resolver` bugs found wiring it next to
  `SeAssemblySet`.

  - **resolvers**: new `b2b` entry point with the `organizationRequest` operation
    (`Mutation.seSubmitOrganizationRequest`, `createOrganizationRequestResolver`) — stores
    "request buyer access" submissions as Master Data v2 documents, validating and length-capping
    every field first since the mutation is public.
  - **components**: `useRequestToBuyForm()`.
  - **ui**: `SeRequestToBuy` (add it with `se-components add` + `add-resolver organizationRequest`).
  - **cli** (breaking: default namespace):
    - `add-resolver` no longer defaults `--namespace` to `b2c` (a folder FastStore never loads):
      it uses the operation's `meta.json` `namespace`, else `thirdParty`, and warns on anything
      other than `vtex`/`thirdParty`.
    - `resolvers/index.ts` aggregators now merge resolver maps per GraphQL type. The previous
      `{ ...a, ...b }` spread silently dropped fields whenever two operations extend the same type
      (e.g. both `Mutation`); an existing spread-shaped file is rewritten on the next
      `add-resolver`.
    - `add-resolver` skips its `src/utils/` client wrapper when `src/` already defines the
      operation (e.g. a component copied by `add`), and `add` warns about such duplicates —
      FastStore's codegen fails the whole build once two copies of one operation differ.

### Patch Changes

- Updated dependencies [b5a3c87]
  - @vtex-us-se/resolvers@0.3.0
  - @vtex-us-se/ui@0.7.0

## 6.0.0

### Minor Changes

- 7445aff: Add `SeEditorialSplit`, `SeProductImageGrid`, `SeProductListing` (wraps FastStore's native product gallery), `SeProductReviews` (presentation only, reviews passed as a prop) and `SeFooter`. `SeImageTiles` gains `captionPosition: "below"` (per-tile `title` and `linkLabel`), `columns`, `aspectRatio` and `maxWidth`, with unchanged defaults. `SeGridContent` gains `columns` and `variant: "caption-below"`, and now reads only standard FastStore theme tokens instead of private ones with blue fallbacks. `@vtex-us-se/components` pins `sanitize-html` to `>=2.13.0 <2.17.2`, since 2.17.6+ pulls the ESM-only `htmlparser2` 12 and breaks `next build`.

  `se-components add` now also source-copies components whose logic carries `// @se-components source-copy: core-runtime` (first: `SeProductListing`). Such components need the store's own `@faststore/core` instance (page context, native sections), which code inside `node_modules` never gets. `SeFooter` incentives use the native `firstLineText` field.

### Patch Changes

- Updated dependencies [7445aff]
  - @vtex-us-se/ui@0.6.0

## 5.0.0

### Patch Changes

- Updated dependencies [b4172e5]
  - @vtex-us-se/ui@0.5.0

## 4.0.0

### Patch Changes

- Updated dependencies [0ec937c]
  - @vtex-us-se/ui@0.4.0

## 3.0.2

### Patch Changes

- Updated dependencies [0cccd0d]
  - @vtex-us-se/ui@0.3.2

## 3.0.1

### Patch Changes

- Updated dependencies [33f056a]
  - @vtex-us-se/ui@0.3.1

## 3.0.0

### Patch Changes

- Updated dependencies [f31cfc9]
  - @vtex-us-se/ui@0.3.0

## 2.1.1

### Patch Changes

- 9c84002: Fix `add-resolver` generating an aggregator (`resolvers/index.ts`) that re-exports a module
  name that doesn't match the actual resolver file it just created — e.g.
  `export { default } from './assemblySet'` when the file written to disk was
  `assemblySetResolver.ts`, not `assemblySet.ts`. Every consumer hit this immediately as
  `Module not found: Can't resolve './assemblySet'` the moment their bundler tried to load the
  generated resolver index. `resolverModuleName` now derives from the actual `resolverFileName`
  instead of the bare operation name.

  Verified by actually type-checking the generated `vtex/resolvers/index.ts` and
  `thirdParty/resolvers/index.ts` against a symlinked local build (not just reading the printed
  CLI summary, which is what let this ship in the first place — it echoed the wrong path
  consistently and looked correct at a glance).

  Also fixes a second bug in the same command, found by the same real consumer: for a split
  operation (`resolverShape: "map"` with `typeExtensionKeys`), the typeDef was still copied under
  `--namespace`'s folder (`b2c` by default) while the resolver was correctly split into `vtex/`
  and `thirdParty/` — the two FastStore-fixed folders it actually scans. The schema this project's
  GraphQL server loaded never gained the field/type the resolver map was prepared to answer,
  surfacing at runtime as `StoreProduct.assemblyOptions defined in resolvers, but not in schema`
  (not a parse error, so easy to miss). The typeDef now lands in `thirdParty/typeDefs/` for a
  split operation too, alongside its resolver.

## 2.1.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [0b105a3]
  - @vtex-us-se/resolvers@0.2.1
  - @vtex-us-se/ui@0.2.1

## 2.0.0

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
  - @vtex-us-se/ui@0.2.0

## 1.0.0

### Patch Changes

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

- Updated dependencies [db17e86]
  - @vtex-us-se/ui@0.1.0

## 0.1.1

### Patch Changes

- Updated dependencies [f50b530]
  - @vtex-us-se/ui@0.0.2

## 0.1.0

### Minor Changes

- e000c4e: **Breaking:** renamed the published binary from `equipo-components` to `se-components`.
  Update any script or docs that invoke `equipo-components add <ComponentName>` to use
  `se-components add <ComponentName>` instead. No compatibility alias is provided — this
  package has no external consumers yet outside internal testing.

## 0.0.1

### Patch Changes

- Updated dependencies [2fbdd82]
  - @vtex-us-se/ui@0.0.1
