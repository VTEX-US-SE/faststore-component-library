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

### B2B

- **`SeWelcomeBackMessage`** — signed-in B2B greeting (`Welcome back, <name>`). Ported from
  [`faststore-b2b-buyer-portal-kit`](https://github.com/VTEX-US-SE/faststore-b2b-buyer-portal-kit).
  Needs `@faststore/core` (peer, optional — only required if you actually import from
  `@vtex-us-se/ui/b2b`) and a real FastStore project with the Buyer Portal plugin enabled and a
  B2B session; renders nothing (returns `null`) outside of one. See
  [`SeWelcomeBackMessage.tsx`](src/b2b/SeWelcomeBackMessage/SeWelcomeBackMessage.tsx).
