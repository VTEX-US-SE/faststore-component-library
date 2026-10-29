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
                                     # (incl. `namespace`: "vtex" | "thirdParty", for non-split ops)
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

### `organizationRequest` (b2b)

"Request buyer access" form submissions from prospective B2B organizations, stored as Master
Data v2 documents. Ported from `faststore-b2b-buyer-portal-kit`'s `submitOrganizationRequest`.
See [`@vtex-us-se/ui`'s `SeRequestToBuy`](../ui/README.md#b2b) for the component.

- **Server:** `createOrganizationRequestResolver(config)` returns the single
  `Mutation.seSubmitOrganizationRequest` field resolver (`resolverShape: "field"`,
  `namespace: "thirdParty"`). Config: `storeId`, `environment?`, `dataEntity?` (default
  `OrganizationRequest`), `schema?` (default `v1`), `appKey?`/`appToken?` (default to the
  `FS_DISCOVERY_APP_KEY`/`FS_DISCOVERY_APP_TOKEN` env vars, read per request — prefer the env vars
  so credentials are never committed).
- **Client:** `SE_SUBMIT_ORGANIZATION_REQUEST_MUTATION`.
- **It's a public write endpoint** (the requester has no account yet), so the resolver trims and
  length-caps every field, requires company/contact/email, checks the email shape, and only then
  writes. Master Data's own error text is logged server-side, never returned — the client only
  ever sees `success: true | false`. There's no rate limiting or CAPTCHA; add one in front if the
  store expects abuse.
- **Prerequisites:**
  1. A Master Data v2 entity (default `OrganizationRequest`) with a JSON schema (default `v1`)
     accepting `companyName`, `contactName`, `email` (required) and `phone`, `message`
     (optional), all strings. For example, `PUT /api/dataentities/OrganizationRequest/schemas/v1`
     with
     `{"properties":{"companyName":{"type":"string"},"contactName":{"type":"string"},"email":{"type":"string"},"phone":{"type":"string"},"message":{"type":"string"}},"required":["companyName","contactName","email"],"v-indexed":["email","companyName"]}`.
  2. An app key/token whose role can create documents in that entity — scope it to just that.
     Without them every request is rejected and the server logs why.

### Buyer Portal kit, wave 2 (b2b)

The rest of [`faststore-b2b-buyer-portal-kit`](https://github.com/VTEX-US-SE/faststore-b2b-buyer-portal-kit)'s
GraphQL, one operation per component (see [`@vtex-us-se/ui`](../ui/README.md#b2b)). Every field is
`se`-prefixed so a store that already installed the kit's own unprefixed resolvers doesn't get
conflicting definitions. Shared changes from the kit:

- **Shopper-scoped calls forward only the VTEX ID cookies** (plus `vtex_session`/`vtex_segment`
  where the API needs them), not the browser's whole cookie header
  (`src/b2b/shared/shopperRequest.ts`).
- **Failures resolve to `null`/`[]`**, logged server-side. The kit returned `{ error }` objects
  in `Int!`/list fields, which turned one failing widget into a GraphQL error for the whole
  response.
- **Ids are validated before they reach a URL path or a Master Data `_where`.**

#### `recentOrdersSpendOverview`

`Query.seRecentOrders(limit)` (OMS user orders, newest first, 1–15) and `Query.seSpendOverview`
(monthly totals). `createRecentOrdersSpendOverviewResolver({ storeId, environment?, spendOverviewUrl? })`,
`resolverShape: "map"`, `thirdParty`. **`seSpendOverview` reads a custom IO app** the demo accounts
have (`https://{storeId}.myvtex.com/_v/spend-overview`, overridable with `spendOverviewUrl`), not a
standard VTEX API — without it the field is `null` and the component hides the chart. Amounts are in
cents, typed `Float` (the kit's `Int` overflows above ~$21M).

#### `dashboards`

`Query.seOpenOrdersCount`, `seOrdersPendingApprovalCount` (OMS), `seBudgets(unitId)` (Buyer Portal
budgets API, with the shopper's VTEX ID token) and `seLowStockItems` (**custom IO app**,
`https://{storeId}.myvtex.com/_v/low-stock`, overridable with `lowStockUrl`).
`createDashboardsResolver({ storeId, environment?, lowStockUrl? })`, `resolverShape: "map"`,
`thirdParty`.

#### `shopperAddresses`

`Query.seShopperAddresses`: the buyer's saved addresses plus their default shipping address id.
Reads the VTEX session server-side and fetches every Master Data `AD` document in parallel (at most
50) — the kit did this from the browser, one round trip per address, inside its navbar.
`createShopperAddressesResolver({ storeId })`, `resolverShape: "field"`, `thirdParty`.

#### `b2bProductFields`

`StoreProduct.seDescription`, `seProperties` and `seSkus` (every SKU with its default seller's
price and stock), from data already on the resolver root — a **`vtex`** extension, no external
call. `createB2bProductFieldsResolver()`, `resolverShape: "map"`, `namespace: "vtex"`. Has **no
client query**: its `meta.json` declares `"fragments": { "ClientManyProducts": … }`, so
`add-resolver` writes `src/fragments/ClientManyProducts.ts` and FastStore's own product gallery
query fetches the fields (see the [CLI README](../cli/README.md#add-resolver)). Also required by
`skuAvailability` and `purchaseLists`, whose queries select `seSkus`.

#### `skuAvailability`

`Query.seSkuAvailability(items, country, postalCode)`: stock per SKU from a **cart simulation**
(quantity 1 each, batches of 50, at most 500). Defaults to VTEX Checkout's public
`/api/checkout/pub/orderForms/simulation`, forwarding the session/segment cookies so a B2B trade
policy applies; `availabilityUrl` switches to the kit's custom `/_v/availability` app, which answers
in the same shape. `availableQuantity` comes from `purchaseConditions.itemPurchaseConditions[].stockBalance`
when present (it isn't in Checkout's published schema) and is `null` otherwise, with `availability`
(`available`, `withoutStock`, …) still set. Also exports `SE_SKU_SEARCH_QUERY` (FastStore's `search`
plus `seSkus`). `createSkuAvailabilityResolver({ storeId, environment?, salesChannel?, availabilityUrl? })`,
`resolverShape: "field"`, `thirdParty`.

#### `purchaseLists`

`Query.sePurchaseLists` and six mutations (`sePurchaseListCreate`, `…AddItems`,
`…SetItemQuantity` — 0 removes, `…Rename`, `…SetVisibility`, `…Delete`), all returning
`{ ok, error, list }` with an error code (`UNAUTHENTICATED`, `INVALID`, `NOT_FOUND`, `FORBIDDEN`,
`CONFLICT`, `FAILED`). Stored in the Master Data `PL` entity **exactly as the kit stored it**
(`items` as a JSON string), so existing lists keep working. Also exports
`SE_PURCHASE_LIST_PRODUCT_QUERY` / `SE_PURCHASE_LIST_SEARCH_QUERY` (FastStore's `product`/`search`
plus `seSkus`, named apart from `SeSkuSearch` so both components can coexist).
`createPurchaseListsResolver({ storeId, environment?, dataEntity?, appKey?, appToken? })`,
`resolverShape: "map"`, `thirdParty`; app key/token default to `FS_DISCOVERY_APP_KEY`/`TOKEN`.

- **Security fix over the kit:** the kit's item mutations edited any `documentId` with the app
  token, whoever owned it. Here the buyer comes from their own VTEX session on every call, and
  each mutation loads the document first: owners can do anything; buyers of the same organization
  can edit the items of a list shared with it; rename / share / delete are owner-only; anyone
  else's private list answers `NOT_FOUND`. Names are trimmed, capped at 100 characters and may
  not contain quotes, so they can't break out of the `_where` clause.
- **Search results aren't capped at 15** (Master Data's default page): `REST-Range` asks for 100.
- **Prerequisite:** the `PL` entity (fields `name`, `visibility`, `items`, `ownerEmail`,
  `organizationEmail`, `lastModifiedBy`, with `ownerEmail`/`organizationEmail`/`name`/`visibility`
  searchable) and an app key/token whose role can read/write it.
