# @vtex-us-se/ui

Styles and tokens that consume the logic from
[`@vtex-us-se/components`](../components/README.md).

## Convention: CMS schema colocated with the component

FastStore v4 **only** reads CMS schemas from the consuming project's local folder
(`cms/faststore/*.jsonc`) — it does not auto-detect them from `node_modules`. That's why every
component published from this package must live alongside its schema file:

```
packages/ui/src/<segment>/<ComponentName>/
├── <ComponentName>.tsx
├── <ComponentName>.module.css   (or .scss)
└── <ComponentName>.schema.jsonc
```

This lets [`@vtex-us-se/cli`](../cli/README.md) copy the corresponding `.schema.jsonc` into the
consuming project's `cms/faststore/`, without the team having to keep it in sync by hand.

**A component whose logic (in `@vtex-us-se/components`) calls a GraphQL operation from
[`@vtex-us-se/resolvers`](../resolvers/README.md) must always be added with
`se-components add <ComponentName>`, never imported directly from this package** — `add`
detects this and copies the component's full source instead of just its schema, so its
`gql(...)` calls end up as literal text inside your own project (see
[`packages/resolvers/README.md`](../resolvers/README.md#read-this-first-two-ways-a-component-reaches-this-package)
for why a plain `import` can't work for these). `SeAssemblySet` below needs this; `SeBanner`
doesn't.

## B2C vs. B2B entry points

- `@vtex-us-se/ui` (root) — B2C only. `import { SeBanner } from '@vtex-us-se/ui'`.
- `@vtex-us-se/ui/b2b` — B2B only. `import { SeWelcomeBackMessage } from '@vtex-us-se/ui/b2b'`.

The root entry point deliberately does **not** re-export B2B components, so a B2C-only project
never pulls in B2B-only dependencies (`@faststore/core`, in particular) just by importing
`@vtex-us-se/ui`.

## Components

### B2C

- **`SeBanner`** — hero/banner section with a full-bleed image mode and a text+CTA mode.
  Ported from `faststore-demoanalyst`'s `Banner` component, decoupled from Next.js
  (`next/router`/`next/image` replaced with native `<a>`/`<img>` + an optional `imageLoader`
  prop, with a real `srcSet` — see `imageWidths`). See
  [`SeBanner.tsx`](src/b2c/SeBanner/SeBanner.tsx) and
  [`SeBanner.schema.jsonc`](src/b2c/SeBanner/SeBanner.schema.jsonc).
  No GraphQL — safe to `import` directly, or add via the CLI.

- **`SeAssemblySet`** <a id="seassemblyset"></a> — customisable set builder ("build your own
  kit") for a parent SKU with a VTEX assembly option (catalog attachment). Ported from
  `poc-arbonne-clone`'s `AssemblySet`. Takes a `skuId` prop rather than a router query param, so
  page composition stays the consuming project's own decision. **Must be added with
  `se-components add SeAssemblySet`** (copies full source with its GraphQL operations inlined —
  see the note above and [`packages/resolvers/README.md`](../resolvers/README.md)); a plain
  `import` from this package will render but never actually fetch data. See
  [`SeAssemblySet.tsx`](src/b2c/SeAssemblySet/SeAssemblySet.tsx) and
  [`SeAssemblySet.schema.jsonc`](src/b2c/SeAssemblySet/SeAssemblySet.schema.jsonc).

### B2B

- **`SeWelcomeBackMessage`** — signed-in B2B greeting (`Welcome back, <name>`). Ported from
  [`faststore-b2b-buyer-portal-kit`](https://github.com/VTEX-US-SE/faststore-b2b-buyer-portal-kit).
  Needs `@faststore/core` (peer, optional — only required if you actually import from
  `@vtex-us-se/ui/b2b`) and a real FastStore project with the Buyer Portal plugin enabled and a
  B2B session; renders nothing (returns `null`) outside of one. See
  [`SeWelcomeBackMessage.tsx`](src/b2b/SeWelcomeBackMessage/SeWelcomeBackMessage.tsx).
