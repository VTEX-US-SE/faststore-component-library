# @vtex-us-se/cli

Internal team CLI. Main command: `equipo-components add <ComponentName>`.

## Status

Only the command's scaffolding (`commander`, args/options parsing). The `copySchema()`
function in [`src/commands/add.ts`](src/commands/add.ts) is a placeholder — it doesn't yet
locate or copy the real `.schema.jsonc` from `@vtex-us-se/ui` into the consuming project's
`cms/faststore/`.

```bash
pnpm --filter @vtex-us-se/cli build
node packages/cli/bin/equipo-components.js add SomeComponent
```
