# @vtex-us-se/ui

Estilos y tokens que consumen la lógica de [`@vtex-us-se/components`](../components/README.md).

## Convención: schema de CMS colocado junto al componente

FastStore v4 **solo** lee schemas de CMS desde la carpeta local del proyecto consumidor
(`cms/faststore/*.jsonc`) — no los detecta automáticamente desde `node_modules`. Por eso,
cada componente publicado desde este paquete debe vivir junto a su archivo de schema:

```
packages/ui/src/<ComponentName>/
├── <ComponentName>.tsx
├── <ComponentName>.module.css   (o .scss)
└── <ComponentName>.schema.jsonc
```

Esto permite que [`@vtex-us-se/cli`](../cli/README.md) copie el `.schema.jsonc` correspondiente
hacia `cms/faststore/` del proyecto que consume el componente, sin que el equipo tenga que
mantenerlo sincronizado a mano.

Sin componentes reales todavía — solo el esqueleto del paquete y esta convención documentada.
