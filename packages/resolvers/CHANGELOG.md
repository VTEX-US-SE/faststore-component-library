# @vtex-us-se/resolvers

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
