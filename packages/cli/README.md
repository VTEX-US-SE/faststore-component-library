# @vtex-us-se/cli

CLI interna del equipo. Comando principal: `equipo-components add <ComponentName>`.

## Estado

Solo el andamiaje del comando (`commander`, parsing de args/opciones). La función
`copySchema()` en [`src/commands/add.ts`](src/commands/add.ts) es un placeholder — todavía no
localiza ni copia el `.schema.jsonc` real desde `@vtex-us-se/ui` hacia `cms/faststore/` del
proyecto consumidor.

```bash
pnpm --filter @vtex-us-se/cli build
node packages/cli/bin/equipo-components.js add SomeComponent
```
