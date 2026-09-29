# @vtex-us-se/resolvers

Server-only GraphQL resolvers, typeDefs, and client query strings for custom FastStore v4
operations — no React, no styles. Organized by GraphQL **operation** (e.g. `assemblySet`), not
by component: a component and the operations it needs aren't always 1:1.

```
src/<segment>/<operationName>/
├── <operationName>.graphql          # server-side typeDef (extend type ..., new types/inputs)
├── <operationName>.resolver.ts      # the resolver factory
├── <operationName>.query.ts         # plain GraphQL strings (queries/mutations), for the client
└── <operationName>.meta.json        # describes the operation for `se-components add-resolver`
```

## Read this first: two ways a component reaches this package

1. **Server-side (always works the same way)** — `se-components add-resolver <operationName>`
   copies the typeDef and scaffolds the resolver into your project's `src/graphql/`. This part
   has always worked regardless of how the component itself is distributed.
2. **Client-side (depends on the component)** — a React hook that calls `gql(someQueryString)`
   can only be resolved by FastStore's own GraphQL codegen if that `gql(...)` call site has
   **literal template-string text**, physically inside **your project's own `src/`** — not
   inside `node_modules`, and not a `gql(IMPORTED_CONSTANT)` call, even if that import resolves
   fine at runtime and even if the file doing the importing itself lives in your own `src/`.
   Codegen statically scans source text; it never executes your code to see what a variable
   actually holds.

That second point is why **any `@vtex-us-se/ui` component whose logic touches this package must
be added with `se-components add <ComponentName>`, never imported directly from the npm
package** — `add` detects this automatically (see below) and copies the component's full
source into your project, with every operation's query/mutation text inlined as a literal at
copy time. A plain `import { SeAssemblySet } from '@vtex-us-se/ui'` will resolve, render its
skeleton or nothing at all, and never actually fetch data — there is no error, which is exactly
what made this hard to debug the first time.

## The two server-side extension namespaces

FastStore v4 distinguishes:

- **`src/graphql/vtex/`** — extends an *existing* FastStore/VTEX type (e.g. adding a field to
  `StoreProduct`) using data already available in the resolver's own context.
- **`src/graphql/thirdParty/`** — brand new types, queries, or mutations, typically calling an
  external API (including VTEX's own Checkout/Master Data APIs directly, since those aren't
  "already in context" the way catalog data is).

A single operation can need both at once — `assemblySet` extends `StoreProduct` (reads the raw
catalog attachment already on the resolver root) *and* adds a new `Mutation` (calls Checkout's
API directly). Its `meta.json` declares this with `typeExtensionKeys: ["StoreProduct"]`, and
`add-resolver` splits the generated resolver across both namespaces automatically — see
[`packages/cli/README.md`](../cli/README.md#add-resolver) for exactly what it writes.

## Config: `storeId` / `environment` / `checkoutBaseUrl`

Every resolver factory here takes VTEX API config as a plain object instead of importing your
project's `discovery.config.js` directly (that relative import can't resolve once this code is
published as a standalone package):

```ts
createAssemblySetResolver({
  storeId: 'your-account',        // required
  environment: 'vtexcommercestable', // optional, this is the default
  checkoutBaseUrl: 'https://your-store-domain.com', // optional, see below
})
```

**`checkoutBaseUrl` matters.** Without it, `createAssemblySetResolver` calls the VTEX platform
host directly (`https://{storeId}.{environment}.com.br`) for Checkout — logs a `console.warn`
reminding you of this. FastStore's own guides generally call VTEX APIs through the store's own
domain instead (keeps checkout cookies same-origin, and matches the pattern some projects rely
on with `AGENTS.md`-level rules against calling the platform host directly from resolvers). If
your project proxies `/api/checkout/*` through its own domain, pass that domain here.

## Verification (CI)

`pnpm test` in this package runs `scripts/validate-graphql.mjs`, which `graphql.parse()`s every
`.graphql` file under `src/`. A `.graphql` file with a syntax error a GraphQL server would
reject at boot (most commonly: a `"""description"""` block placed directly over an
`extend type`/`extend input` — graphql-js allows descriptions on type/field *definitions*, not
on *extensions*) fails here instead of only surfacing once a consumer tries to boot their own
GraphQL server.

## Operations

### `assemblySet` (b2c)

Customisable set builder ("build your own kit"). See
[`@vtex-us-se/ui`'s `SeAssemblySet`](../ui/README.md#seassemblyset) for the component that
consumes this.

- **Server:** `createAssemblySetResolver(config)` returns a map spanning `StoreProduct`
  (`assemblyOptions`, a vtex-namespace field extension), `Mutation` (`seAddComposedSet`, a
  thirdParty-namespace mutation that composes the whole set into Checkout atomically), and
  `SeAssemblyItem` (hydrates each child SKU via the VTEX platform's own `ctx.loaders.skuLoader`).
- **Client:** `ASSEMBLY_SET_QUERY` (reads the parent product + its assembly option) and
  `SE_ADD_COMPOSED_SET_MUTATION` — both plain strings; see the note at the top of this file
  about why these can only ever work when inlined into your project's own `src/`.
