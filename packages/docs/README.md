# @vtex-us-se/docs

Monorepo Storybook. Documents which components exist in `@vtex-us-se/components` and
`@vtex-us-se/ui` — it doesn't replace the code as the source of truth, it just makes it
browsable.

Stories live in `stories/`, one `*.stories.tsx` per component in `packages/ui/src/`.

```bash
pnpm install
pnpm build    # required at least once — the dev server resolves @vtex-us-se/ui via its dist
pnpm --filter @vtex-us-se/docs dev
```
