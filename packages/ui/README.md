# @vtex-us-se/ui

Styles and tokens that consume the logic from
[`@vtex-us-se/components`](../components/README.md).

## Convention: CMS schema colocated with the component

FastStore v4 **only** reads CMS schemas from the consuming project's local folder
(`cms/faststore/*.jsonc`) — it does not auto-detect them from `node_modules`. That's why every
component published from this package must live alongside its schema file:

```
packages/ui/src/<ComponentName>/
├── <ComponentName>.tsx
├── <ComponentName>.module.css   (or .scss)
└── <ComponentName>.schema.jsonc
```

This lets [`@vtex-us-se/cli`](../cli/README.md) copy the corresponding `.schema.jsonc` into the
consuming project's `cms/faststore/`, without the team having to keep it in sync by hand.

## Components

- **`SeBanner`** — hero/banner section with a full-bleed image mode and a text+CTA mode.
  Ported from `faststore-demoanalyst`'s `Banner` component, decoupled from Next.js
  (`next/router`/`next/image` replaced with native `<a>`/`<img>` + an optional `imageLoader`
  prop). See [`SeBanner.tsx`](src/SeBanner/SeBanner.tsx) and
  [`SeBanner.schema.jsonc`](src/SeBanner/SeBanner.schema.jsonc).
