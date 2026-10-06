# @vtex-us-se/components

Logic and accessibility for React components, **no styles**. Each component here exposes its
behavior (hooks, state management, ARIA) and leaves the visual rendering to
[`@vtex-us-se/ui`](../ui/README.md), which consumes it and applies styles + CMS schema.

## B2C vs. B2B entry points

Same split as `@vtex-us-se/ui`: `@vtex-us-se/components` (root) only re-exports B2C hooks;
B2B-only hooks (and their `@faststore/core` dependency) live behind
`@vtex-us-se/components/b2b`.

## Components

### B2C

- **`SeBanner`** — hooks and behavior for the banner section (mobile detection, layout style
  calculation, shared context, HTML sanitization, responsive image `srcSet`). See
  [`@vtex-us-se/ui`](../ui/README.md#components) for the rendered component.

- **`useAssemblySet`** — orchestrates `SeAssemblySet`: reads the parent SKU's assembly option
  via [`@vtex-us-se/resolvers`](../resolvers/README.md), tracks the shopper's selection against
  each group's min/max gate, and composes the set into the cart. **This is never imported
  directly in a real project** — its `gql()` calls only work when this hook's source is copied
  into the consuming project with its query/mutation text inlined, which
  [`se-components add SeAssemblySet`](../cli/README.md#add) does automatically. See
  [`@vtex-us-se/ui`](../ui/README.md#seassemblyset) for the rendered component.

- **`SeMegaMenu`** — hover state, mobile drawer navigation, hamburger-button wiring, and
  escape-to-close behavior for the mega menu. No GraphQL.

- **`SeBannerCarousel`** — carousel index/autoplay state and touch-swipe navigation. No GraphQL.

- **`SeCardsCarousel`**, **`SeGridContent`**, **`SeHeroSection`**, **`SeLearnMoreSection`**,
  **`SeImageTiles`** — presentational, no dedicated hooks beyond shared types.

- **`useFormattedPrice`** — price formatting for `SeProductCardWithButton`. No GraphQL.

- **`SeHeader`** — types only (`SeHeaderTopbar`, `SeHeaderLogo`, `SeHeaderSearch`, ...). No GraphQL.

- **`SeValuePropCards`** — `useSeValuePropCardsFilter` / `filterSeValuePropCards`: language and
  customer-class filtering of the cards. No GraphQL.

See [`@vtex-us-se/ui`](../ui/README.md#components) for each component's rendered UI.

### B2B

- **`SeWelcomeBackMessage`** — `useB2bSession()`, a thin wrapper around FastStore's own
  (experimental) `useSession_unstable` that extracts just the B2B slice. See
  [`@vtex-us-se/ui`](../ui/README.md#components) for the rendered component.
- **`SeActionHubBulletinBoard`**, **`SeCategoryBanners`** — types only. No GraphQL.
- **`SeFooterB2B`** — types + `useNewsletterSubscription()`: email state and submit for FastStore's
  native `subscribeToNewsletter` mutation (via `useNewsletter_unstable`), surfacing both a rejected
  call and the hook's own `error` as `failed`.
- **`SeCustomProductCard`** — `SeProductSummary` (the subset of FastStore's product-summary
  fragment the card reads) + `useB2bProductCard()`: login state, product link, and min/max price
  formatted through `useFormattedPrice_unstable`.
- **`SeCustomShelfProduct`** — `useB2bShelfProducts()`, over FastStore's native `useProductsQuery`
  (imported from the `@faststore/core` root, typed through `shims/faststore-core.d.ts` — see the
  comment there for why the root needs a `paths` mapping when `/experimental` doesn't).
- **`SeCustomCrossSellingShelf`** — `useCrossSellingShelfOverride()`: FastStore's native
  `CrossSellingShelf` section with only its product card replaced, memoized.

None of the B2B hooks above call a custom GraphQL operation, so they all ship as plain npm imports.

- **`SeRequestToBuy`** — `useRequestToBuyForm()`: form values, `setField`, `submit` and a
  `status` (`idle` / `submitting` / `success` / `invalid` / `error`) for the
  `seSubmitOrganizationRequest` mutation (`@vtex-us-se/resolvers`' `organizationRequest`). Reads
  the outcome from the awaited lazy-query call rather than a `useEffect` on its `data` (the kit's
  approach, which never re-fired for a second identical result). **Calls its own GraphQL** — it
  reaches a project only through `se-components add SeRequestToBuy`'s source copy.
