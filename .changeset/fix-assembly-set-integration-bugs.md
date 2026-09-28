---
"@vtex-us-se/resolvers": patch
"@vtex-us-se/ui": patch
"@vtex-us-se/cli": minor
---

Fix five integration bugs surfaced by a real consumer wiring up `SeAssemblySet` in a fresh
FastStore v4.7.0 project (`vtex-sites/starter.store`).

- **`@vtex-us-se/resolvers`**: `assemblySet.graphql` had a `"""..."""` description directly
  above `extend type StoreProduct { ... }` — graphql-js rejects descriptions on type
  extensions (`Syntax Error: Unexpected description, only GraphQL definitions support
  descriptions`), so every consumer's GraphQL server failed to boot. Moved the description
  onto the `assemblyOptions` field itself. Added `packages/resolvers/scripts/validate-graphql.mjs`
  (wired as this package's `test` script) so a `.graphql` file that doesn't parse fails in CI
  instead of surfacing only inside a consumer's build.
- **`@vtex-us-se/resolvers`**: `createAssemblySetResolver` now warns when `checkoutBaseUrl` is
  omitted, since the default (calling the VTEX platform host directly) is often wrong for
  projects that proxy `/api/checkout/*` through their own storefront domain.
- **`@vtex-us-se/ui`**: `@faststore/ui`/`@faststore/components` were regular `dependencies`
  pinned to `^3.99.4`. In a project whose `@faststore/core` demands `4.7.0` (any current
  FastStore v4 project), this left two copies installed — one hoisted at 3.99.4, one nested
  under `@faststore/core` at 4.7.0 — and the hoisted 3.99.4 copy's Sass partials got compiled
  against 4.7.0's utilities, breaking with `Undefined mixin. @include focus-ring;`. Moved both
  to `peerDependencies` (`>=3.99.4 <5`) with pinned `devDependencies` for this repo's own build;
  a consuming project's own `@faststore/ui`/`@faststore/components` now wins, as it should.
- **`@vtex-us-se/cli`**: `add-resolver` generated `from '@vtex-us-se/resolvers/${namespace}'`
  using the consuming project's own `--namespace` (its target folder, e.g. `vtex`/`thirdParty`)
  instead of the package's actual export subpath (e.g. `b2c`) — a real bug our own guide's
  `--namespace thirdParty` example triggered directly, since `@vtex-us-se/resolvers` only ever
  declared a `/b2c` export. The subpath is now derived from where the operation was actually
  found under the installed package's own `dist/`, completely independent of `--namespace`.
- **`@vtex-us-se/cli`**: both `add` and `add-resolver` now scaffold the aggregator file a fresh
  namespace/registry actually needs (`src/graphql/<namespace>/resolvers/index.ts`,
  `src/components/index.tsx`) when it doesn't exist yet, instead of leaving it to be
  hand-written — this is exactly where the reported bugs (`index.ts` containing the literal
  word `resolvers`, an empty `components/index.ts`) came from. Existing files are still never
  touched; a not-empty aggregator gets a merge hint instead.
- **`@vtex-us-se/cli`**: `add-resolver`'s generated resolver snippet now surfaces every
  `configParams` entry declared in an operation's `meta.json`, not just the hardcoded
  `storeId`/`environment` pair — `checkoutBaseUrl` (and any future param) now appears as a
  commented suggestion instead of being silently dropped from the scaffold.

Verified end-to-end against a symlinked local build simulating a real consuming project: the
generated `add-resolver`/`add` output resolves and runs correctly (`@vtex-us-se/resolvers/b2c`
imports resolve, the factory produces the expected `StoreProduct`/`Mutation`/`SeAssemblyItem`
map, the checkoutBaseUrl warning fires), and re-running either command against existing files
is a no-op that leaves them untouched.
