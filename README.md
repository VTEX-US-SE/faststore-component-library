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
copy it by hand — see [its README](packages/cli/README.md).

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
  project. The rest of that kit's components (most need custom GraphQL resolvers our CLI
  doesn't copy yet) are out of scope for now.
- Both are installable today via `@vtex-us-se/ui`/`@vtex-us-se/ui/b2b` on GitHub Packages.
- CLI copies real schemas end-to-end (`se-components add <ComponentName>`), searching one
  segment folder deep under `dist/` so it doesn't need to know segment names.
- Real rich-text/markdown support (`textMode`) isn't implemented yet.

## Development

```bash
pnpm install
pnpm build    # turbo run build
pnpm dev      # turbo run dev (e.g. Storybook)
pnpm lint
pnpm test
```
