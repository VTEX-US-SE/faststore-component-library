---
"@vtex-us-se/resolvers": minor
"@vtex-us-se/cli": minor
"@vtex-us-se/components": minor
"@vtex-us-se/ui": minor
---

Add an installable mechanism for B2B GraphQL resolvers, and port `RequestToBuy` end-to-end as its
pilot.

- New package **`@vtex-us-se/resolvers`** (server-only, no React): ships real, importable GraphQL
  resolver functions, typeDef strings, and client query strings for B2B operations, so a bugfix
  ships as a version bump instead of hand-editing every consumer project. Same b2c/`b2b` segment
  convention as `components`/`ui` — the unit of work is the GraphQL **operation**
  (`submitOrganizationRequest`), not the component, since components and operations aren't 1:1.
  First operation ported: `submitOrganizationRequest` (from `RequestToBuy`, sourced from
  [`faststore-b2b-buyer-portal-kit`](https://github.com/VTEX-US-SE/faststore-b2b-buyer-portal-kit),
  confirmed byte-identical against a real production consumer,
  `VTEX-US-SE/faststore-usb2bstore`). The resolver is a factory
  (`createSubmitOrganizationRequestResolver(config)`) instead of the kit's original relative
  import to the consumer's own `discovery.config.js`, which can't resolve once published as a
  package.
- CLI: new **`se-components add-resolver <operationName>`** command. Copies the `.graphql`
  typeDef into `src/graphql/<namespace>/typeDefs/` (FastStore's own build discovers these by
  filesystem convention — that part can't be skipped), and — only if the file doesn't already
  exist — scaffolds `src/graphql/<namespace>/resolvers/{mutation,query}Resolver.ts` and the
  client query wrapper (`gql(...)` around the published query string) with the exact import +
  merge snippet. Auto-detects `storeId`/`environment` from the consuming project's own
  `discovery.config.js` when present, falling back to a `TODO` placeholder otherwise. Never
  overwrites either scaffolded file if it already exists — prints the snippet to merge by hand
  instead, since safely auto-merging into an arbitrary existing consumer file isn't possible.
- New component: `SeRequestToBuy` (`@vtex-us-se/ui/b2b`), the form itself, split the same way as
  every other component in this library — logic (`useRequestToBuyForm`, in
  `@vtex-us-se/components/b2b`) consumes the mutation string from `@vtex-us-se/resolvers/b2b`
  directly, so the component and the CLI-scaffolded consumer wrapper both point at the same
  published artifact instead of duplicating the query text a third time.
- `packages/components/src/global.d.ts` (the ambient shim for `@faststore/core`'s raw-TS-source
  subpaths) now also covers `useLazyQuery_unstable` (`/experimental`) and `gql` (`/api`) — same
  rationale as the existing `useSession_unstable` shim.
- Storybook: `@faststore/core/experimental` and `@faststore/core/api` are now aliased to small
  local mocks in `packages/docs/.storybook/mocks/` — importing the real modules pulls in most of
  `@faststore/core`'s internal SDK (`discovery.config`, `@generated`, `src/sdk/*`), which only
  resolves inside a real FastStore project's own bundler config and crashed Vite's dependency
  scan for *every* story, not just the ones that need it. Storybook-only; published packages
  still import the real module at runtime in an actual FastStore project. Also added the missing
  `/b2c` and `/b2b` subpath aliases for `@vtex-us-se/ui` and `@vtex-us-se/components` (needed for
  `SeRequestToBuy`'s story; `SeWelcomeBackMessage` had the same gap but no story ever exercised
  it).
- `SeRequestToBuy.module.scss` adds literal fallback values (`var(--x, value)`) for the ~20
  design tokens the original component relied on that turned out to belong to the source
  project's own custom theme, not `@faststore/ui`'s base tokens — the component now renders
  correctly out of the box; a consuming project's own theme still wins if it defines the same
  token names.
