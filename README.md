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
packages/ui/src/<ComponentName>/
├── <ComponentName>.tsx
├── <ComponentName>.module.css   (or .scss)
└── <ComponentName>.schema.jsonc
```

`packages/cli` (the `equipo-components add <ComponentName>` command) exists to copy that
`.schema.jsonc` into the consuming project's `cms/faststore/`, instead of relying on every team
to copy it by hand. **For now it's only the command's scaffolding** — the actual copy logic
(`copySchema()`) is still pending.

## Versioning and publishing

- **Changesets** (`.changeset/`) handles independent semver per package. Every publishable
  change is declared with `pnpm changeset`.
- Every publishable `package.json` already has `publishConfig` pointing at GitHub Packages with
  the placeholder scope `@vtex-us-se` — **actual publishing isn't configured yet** (the
  definitive registry/org and the CI workflow that triggers it are still missing).

## Current status

- **`SeBanner`** is the first real component, ported end-to-end from `faststore-demoanalyst`
  (logic in `components`, styles + CMS schema in `ui`, a Storybook story in `docs`).
- CLI still has no real copy logic (`copySchema()` is a placeholder).
- No CI/CD yet.
- No real publishing to any registry yet.

## Development

```bash
pnpm install
pnpm build    # turbo run build
pnpm dev      # turbo run dev (e.g. Storybook)
pnpm lint
pnpm test
```
