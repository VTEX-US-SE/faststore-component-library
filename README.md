# faststore-component-library

Internal library of reusable **FastStore v4** components for VTEX's Solutions Engineering
team (`@vtex-us-se`).

> Rocketlane 1442908 — "SE Co-pilot — 90 Day Plan", phase P6 ("FS Component & App
> Organization").

## Why this structure

### Monorepo (pnpm workspaces + Turborepo)

The different packages (logic, styles, docs, CLI) evolve together and reference each other
(`workspace:*`). Turborepo caches and parallelizes `build`/`lint`/`test` while respecting the
dependency graph between packages (`dependsOn: ["^build"]`, etc.), without relying on an
external orchestrator.

### `packages/components` — logic and accessibility, no styles

Hooks, state management, and accessible behavior (ARIA, focus, keyboard) for each component.
Deliberately free of CSS: separating "what it does" from "how it looks" allows the logic to be
reused across projects with different styling, without dragging along classes or tokens that
don't apply.

### `packages/ui` — styles and tokens

Consumes `@vtex-us-se/components` and applies the visual layer. This is also where the
**CMS schema colocated with the component** convention lives (see below), because a UI
component and its CMS schema need to stay in sync, kept by the same person in the same change.

### B2C vs. B2B segmentation

Both `components` and `ui` split their `src/` into `b2c/` and `b2b/` folders — a folder-level
split, not separate packages (see [Current status](#current-status) for when that would change).
Each segment gets its own **package entry point** (`@vtex-us-se/ui`, `@vtex-us-se/ui/b2c`,
`@vtex-us-se/ui/b2b` — same for `components`), not just a source folder: the root entry point
(`.`) re-exports only `b2c/`, so a B2C-only project importing `@vtex-us-se/ui` never pulls in
B2B-only dependencies (e.g. `@faststore/core`, which several B2B components need and which is
a large, Next.js-coupled package) — it has to explicitly import from `@vtex-us-se/ui/b2b` to get
those. This is why the split lives in the package's entry points, not only its folder layout.

```
packages/ui/src/
├── b2c/<ComponentName>/...
└── b2b/<ComponentName>/...
```

### `packages/resolvers` — GraphQL for custom operations

Server-only GraphQL resolvers, typeDefs, and client query strings — no React, no styles,
organized by operation rather than by component (a component and the operations it needs
aren't always 1:1). See [its README](packages/resolvers/README.md), especially the note on why
a component whose logic touches this package can't just be `import`ed from `@vtex-us-se/ui` —
it has to be added with the CLI instead, which copies its source with the operation text
inlined so FastStore's own GraphQL codegen can see it.

### `packages/docs` — Storybook

Living documentation of what exists in `components` and `ui`.

### `packages/config` — shared config

Centralized `tsconfig.base.json`, `eslint.config.js`, and `prettier.config.js`, so each
package only extends them instead of redefining rules.

## Convention: CMS schema next to the component

FastStore v4 **only reads CMS schemas from the consuming project's local folder**
(`cms/faststore/*.jsonc`) — it does not auto-detect them from `node_modules`. That's why every
component in `packages/ui` lives alongside its schema:

```
packages/ui/src/<segment>/<ComponentName>/
├── <ComponentName>.tsx
├── <ComponentName>.module.css   (or .scss)
└── <ComponentName>.schema.jsonc
```

`packages/cli` (the `se-components add <ComponentName>` command) copies that `.schema.jsonc`
into the consuming project's `cms/faststore/components/`, instead of relying on every team to
copy it by hand — see [its README](packages/cli/README.md). For a component whose logic calls
a `packages/resolvers` operation, `add` copies the component's **full source** instead (with
the operation's query/mutation text inlined) rather than letting the consumer `import` it from
`node_modules` — see [`packages/resolvers/README.md`](packages/resolvers/README.md) for why a
plain npm import can never work for those.

## CI/CD

- **`.github/workflows/ci.yml`** — build+lint+test on every PR and push to `main`, required to
  pass before merging (branch protection on `main`).
- **`.github/workflows/release.yml`** — Changesets-driven versioning and publishing to GitHub
  Packages under the `@vtex-us-se` scope, on push to `main`.
- **Changesets** (`.changeset/`) handles independent semver per package. Every publishable
  change is declared with `pnpm changeset`; on push to `main`, `release.yml` versions and
  publishes directly in the same run (no intermediate "Version Packages" PR — the VTEX-US-SE
  org disallows GitHub Actions from creating pull requests, org-wide).

## Current status

- **B2C**: `SeBanner`, ported end-to-end from `faststore-demoanalyst` (logic in `components`,
  styles + CMS schema in `ui`, a Storybook story in `docs`).
- **B2B**: `SeWelcomeBackMessage`, the first component ported from
  [`faststore-b2b-buyer-portal-kit`](https://github.com/VTEX-US-SE/faststore-b2b-buyer-portal-kit)
  — deliberately the simplest one in that kit (no GraphQL dependency) as a pilot for the b2c/b2b
  split. Needs `@faststore/core` (peer, optional) and only renders inside a real B2B session —
  no Storybook story, since it can't render meaningfully (or even bundle cleanly in Vite —
  `@faststore/core` is Next.js-server-coupled) outside an actual FastStore + Buyer Portal
  project.
- **B2B**: wave 1 of the rest of that kit — every component in it with no custom GraphQL:
  `SeActionHubBulletinBoard`, `SeCategoryBanners`, `SeFooterB2B`, `SeCustomProductCard`,
  `SeCustomShelfProduct` and `SeCustomCrossSellingShelf` (the last two over FastStore's native
  `useProductsQuery` / `CrossSellingShelf`). These do have Storybook stories: `docs` now mocks the
  `@faststore/core` root as well as `/experimental`, with a signed-in/signed-out session toggle.
  Still to come from the kit: GraphQL components with their own operations (`RequestToBuy`,
  `RecentOrdersSpendOverview`, `Dashboards`), `ProductGalleryB2B` (needs a `StoreProduct`
  extension plus fragments, which the CLI doesn't copy yet), and the tightly coupled
  `NavbarB2B` / `AddressSelector` / `CheckStockAndPricing` / `PurchaseLists` / `ProductDetailsB2B`
  group.
- **B2C**: `SeAssemblySet`, a customisable set builder ported from `poc-arbonne-clone`'s
  `AssemblySet`. First component needing its own `packages/resolvers` operation
  (`assemblySet`) — which is also why `se-components add` grew a second distribution mode: a
  component whose logic calls a GraphQL operation gets its full source copied into the
  consuming project (query/mutation text inlined at copy time), instead of a plain npm import,
  because FastStore's own GraphQL codegen can never see a `gql()` call made from inside
  `node_modules`. See [`packages/resolvers/README.md`](packages/resolvers/README.md).
- **B2C**: eight more presentational components ported from various demo accounts, none needing
  their own GraphQL operation: `SeMegaMenu` (`fs-mega-menu`), `SeBannerCarousel`
  (`faststore-usb2b9`), `SeCardsCarousel` (`faststore-demoanalyst`), `SeGridContent`,
  `SeHeroSection`, `SeLearnMoreSection` (all three from `faststore-usb2b5c`), `SeImageTiles`
  (`faststore-hughtestenv`), and `SeProductCardWithButton` (`demo-poc-grill-house`).
- **B2C**: two more presentational components, `SeHeader` (static site header: topbar, logo,
  search form, account area — from `faststore-usb2b5c`) and `SeValuePropCards` (value-proposition
  cards — from `faststore-usb2b6`, whose per-card cluster filter is now a `customerClass` prop
  instead of a custom GraphQL query). Four more candidates from that same pass were **not**
  ported because they need their own GraphQL: `SkuAccordion` (B2B order guides), `ClusterMenu`
  (customer-cluster lookup), `DoctorsHeader` (custom `doctors` query), and `ProductSpecifications`
  (needs a `ServerProduct` fragment extension for `specificationGroups`).
- Every component except `SeAssemblySet` is installable today as a plain import from
  `@vtex-us-se/ui` (B2C) or `@vtex-us-se/ui/b2b` (B2B) on GitHub Packages (`SeAssemblySet` needs
  `se-components add`'s source copy, not a plain import — see above).
- CLI copies real schemas end-to-end (`se-components add <ComponentName>`), searching one
  segment folder deep under `dist/` so it doesn't need to know segment names.
- Real rich-text/markdown support (`textMode`) isn't implemented yet.

## Using this library in a project

See [`IMPLEMENTATION.md`](IMPLEMENTATION.md) for the step-by-step setup, a troubleshooting
table with exact error messages, and a verification checklist.

## Adding or changing a component

See [`CLAUDE.md`](CLAUDE.md) — the process to follow, especially for a component with its own
GraphQL operation, so it actually works in a real consuming project (not just in this repo's
own build/lint/test/Storybook) before it ships.

## Development

```bash
pnpm install
pnpm build    # turbo run build
pnpm dev      # turbo run dev (e.g. Storybook)
pnpm lint
pnpm test
```
