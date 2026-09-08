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

### B2B

- **`SeWelcomeBackMessage`** — `useB2bSession()`, a thin wrapper around FastStore's own
  (experimental) `useSession_unstable` that extracts just the B2B slice. See
  [`@vtex-us-se/ui`](../ui/README.md#components) for the rendered component.
