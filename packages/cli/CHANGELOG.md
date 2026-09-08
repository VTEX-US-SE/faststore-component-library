# @vtex-us-se/cli

## 1.0.0

### Patch Changes

- db17e86: Segment the library into B2C and B2B, and add the first B2B component.

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

- Updated dependencies [db17e86]
  - @vtex-us-se/ui@0.1.0

## 0.1.1

### Patch Changes

- Updated dependencies [f50b530]
  - @vtex-us-se/ui@0.0.2

## 0.1.0

### Minor Changes

- e000c4e: **Breaking:** renamed the published binary from `equipo-components` to `se-components`.
  Update any script or docs that invoke `equipo-components add <ComponentName>` to use
  `se-components add <ComponentName>` instead. No compatibility alias is provided — this
  package has no external consumers yet outside internal testing.

## 0.0.1

### Patch Changes

- Updated dependencies [2fbdd82]
  - @vtex-us-se/ui@0.0.1
