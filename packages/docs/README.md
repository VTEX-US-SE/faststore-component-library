# @vtex-us-se/docs

Storybook del monorepo. Documenta qué componentes existen en `@vtex-us-se/components` y
`@vtex-us-se/ui` — no reemplaza el código como fuente de verdad, solo lo hace navegable.

Inicializado sin stories todavía. Una vez existan componentes reales en `packages/ui/src/`,
agregar sus `*.stories.tsx` en `stories/`.

```bash
pnpm install
pnpm --filter @vtex-us-se/docs dev
```
