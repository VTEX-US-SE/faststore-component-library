---
"@vtex-us-se/resolvers": minor
"@vtex-us-se/cli": minor
"@vtex-us-se/components": minor
"@vtex-us-se/ui": minor
---

Add `SeAssemblySet`, a customisable set builder, and generalize the resolvers mechanism to
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
