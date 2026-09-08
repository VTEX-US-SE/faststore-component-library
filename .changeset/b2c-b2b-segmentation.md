---
"@vtex-us-se/ui": minor
"@vtex-us-se/components": minor
"@vtex-us-se/cli": patch
---

Segment the library into B2C and B2B, and add the first B2B component.

- `src/` in both `@vtex-us-se/ui` and `@vtex-us-se/components` now splits into `b2c/`/`b2b/`
  folders, each with its own package entry point (`.` stays B2C-only for backward
  compatibility; `/b2b` is new) — so a B2C-only project never pulls in B2B-only dependencies
  (`@faststore/core` in particular) just by importing the package root.
- New component: `SeWelcomeBackMessage` (`@vtex-us-se/ui/b2b`, `useB2bSession` from
  `@vtex-us-se/components/b2b`), ported from
  [`faststore-b2b-buyer-portal-kit`](https://github.com/VTEX-US-SE/faststore-b2b-buyer-portal-kit)
  — the simplest, GraphQL-free component in that kit, as a pilot for the segmentation. No
  Storybook story: it renders nothing outside a real B2B session, and `@faststore/core` can't
  be cleanly bundled by Vite/Storybook outside an actual Next.js/FastStore build.
- `@faststore/core` is a new **optional** peer dependency of `@vtex-us-se/components` (only
  needed if you import from `/b2b`).
- CLI (`se-components add`): now searches one segment folder deep under `dist/` for a
  component's schema, instead of assuming a flat `dist/<ComponentName>/` layout — needed since
  `SeBanner`'s schema moved to `dist/b2c/SeBanner/` as part of this segmentation.
