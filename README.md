# faststore-component-library

Librería interna de componentes reutilizables de **FastStore v4** para el equipo de
Solutions Engineering de VTEX (`@vtex-us-se`).

> Rocketlane 1442908 — "SE Co-pilot — 90 Day Plan", fase P6 ("FS Component & App
> Organization"). Este repo es el esqueleto base de esa fase; los componentes reales se
> agregan en un paso posterior.

## Por qué esta estructura

### Monorepo (pnpm workspaces + Turborepo)

Los distintos paquetes (lógica, estilos, docs, CLI) evolucionan juntos y se referencian entre
sí (`workspace:*`). Turborepo cachea y paraleliza `build`/`lint`/`test` respetando el grafo de
dependencias entre paquetes (`dependsOn: ["^build"]`, etc.), sin depender de un orquestador
externo.

### `packages/components` — lógica y accesibilidad, sin estilos

Hooks, manejo de estado y comportamiento accesible (ARIA, foco, teclado) de cada componente.
Deliberadamente sin CSS: separar "qué hace" de "cómo se ve" permite reusar la lógica en
proyectos con distinto styling sin arrastrar clases o tokens que no aplican.

### `packages/ui` — estilos y tokens

Consume `@vtex-us-se/components` y le aplica la capa visual. Es también donde vive la
convención de **schema de CMS colocado junto al componente** (ver más abajo), porque un
componente de UI y su schema de CMS deben mantenerse sincronizados por la misma persona en el
mismo cambio.

### `packages/docs` — Storybook

Documentación viva de qué existe en `components` y `ui`. Inicializado vacío (sin stories) —
se van agregando a medida que se agregan componentes reales.

### `packages/config` — config compartida

`tsconfig.base.json`, `eslint.config.js` y `prettier.config.js` centralizados, para que cada
paquete solo extienda en vez de redefinir reglas.

## Convención: schema de CMS junto al componente

FastStore v4 **solo lee schemas de CMS desde la carpeta local del proyecto consumidor**
(`cms/faststore/*.jsonc`) — no los detecta automáticamente desde `node_modules`. Por eso cada
componente en `packages/ui` vive junto a su schema:

```
packages/ui/src/<ComponentName>/
├── <ComponentName>.tsx
├── <ComponentName>.module.css   (o .scss)
└── <ComponentName>.schema.jsonc
```

`packages/cli` (comando `equipo-components add <ComponentName>`) existe para copiar ese
`.schema.jsonc` hacia `cms/faststore/` del proyecto que consume el componente, en vez de
depender de que cada equipo lo copie a mano. **Por ahora solo es el andamiaje del comando** —
la lógica real de copia (`copySchema()`) está pendiente.

## Versionado y publicación

- **Changesets** (`.changeset/`) maneja semver independiente por paquete. Cada cambio
  publicable se declara con `pnpm changeset`.
- Cada `package.json` publicable ya tiene `publishConfig` apuntando a GitHub Packages con el
  scope placeholder `@vtex-us-se` — **el publish real todavía no está configurado** (falta
  definir el registro/org definitivo y el workflow de CI que lo dispare).

## Estado actual

Esto es solo el esqueleto:

- Sin componentes reales en `components` ni `ui`.
- CLI sin lógica de copia real.
- Sin CI/CD.
- Sin publicación real a ningún registro.

## Desarrollo

```bash
pnpm install
pnpm dev      # turbo run dev (ej. Storybook)
pnpm build    # turbo run build
pnpm lint
pnpm test
```
