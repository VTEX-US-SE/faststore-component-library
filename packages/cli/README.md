# @vtex-us-se/cli

Internal team CLI. Two commands: `se-components add <ComponentName>` and
`se-components add-resolver <operationName>`.

## `add`

```bash
se-components add SeBanner
se-components add SeAssemblySet
```

Always copies `<ComponentName>.schema.jsonc` from whichever `@vtex-us-se/ui` is installed in
the **consuming project** into `cms/faststore/components/cms_component__<ComponentName>.jsonc`.

Then, depending on whether the component's logic touches `@vtex-us-se/resolvers`:

- **No GraphQL (e.g. `SeBanner`):** registers it in `src/components/index.tsx` as a plain npm
  import — `import { ComponentName } from '@vtex-us-se/ui/<segment>'`.
- **Has GraphQL (e.g. `SeAssemblySet`):** copies the component's **full source** — both its
  `@vtex-us-se/ui` files and the matching logic folder in `@vtex-us-se/components` — into
  `src/components/sections/<ComponentName>/` (flattened into one folder), then registers that
  local copy in `src/components/index.tsx` instead. See
  [`packages/resolvers/README.md`](../resolvers/README.md#read-this-first-two-ways-a-component-reaches-this-package)
  for why: a component whose hook calls `gql()` on a string that only exists in `node_modules`
  can never be seen by this project's own GraphQL codegen, regardless of how it's imported —
  only source living in your own `src/`, with the operation text already inlined, works.

During that copy, every cross-package import is rewritten so the copied files work standing
alone:
- `@vtex-us-se/components(/segment)` → `./index` (the copied components-package barrel now
  sits right next to the file importing it)
- `@vtex-us-se/resolvers/<subpath>` named imports that resolve to a **string** (a query/mutation
  constant) are inlined as a literal template string wherever they're passed to `gql(...)`, and
  dropped from the import entirely

Both the schema copy and the component/source copy refuse to clobber anything that already
exists — the schema needs `--force` to overwrite; the source files and
`src/components/index.tsx` are just left untouched (with a merge hint printed) if already
present. `src/components/index.tsx` gets a real merge attempt (not just a hint) when its
existing default export is a plain `{ A, B, C }` object of bare names; anything more elaborate
(spreads, computed keys) is left alone.

```bash
se-components add SeAssemblySet --source-dir src/components/sections/SeAssemblySet  # default shown
se-components add SeAssemblySet --components-index src/components/index.tsx          # default shown
se-components add SeBanner --force   # overwrite an existing schema file
```

**Re-running after a library upgrade:** `add` never overwrites a source file that already
exists, so picking up changes from a newer `@vtex-us-se/ui`/`@vtex-us-se/components` means
either re-applying your own edits by hand afterward, or deleting the component's folder under
`src/components/sections/` first so the next run copies the fresh version.

## `add-resolver`

```bash
se-components add-resolver assemblySet
```

Copies `<operationName>`'s `.graphql` typeDef into `src/graphql/<namespace>/typeDefs/`
(`--namespace`, default `b2c` — this only affects where the *typeDef* lands; see below for
resolver placement), and scaffolds (or safely merges into) the server resolver and its
aggregator `resolvers/index.ts`.

**Operations whose `meta.json` declares `typeExtensionKeys`** (see
[`packages/resolvers/README.md`](../resolvers/README.md#the-two-server-side-extension-namespaces))
get their resolver **split across FastStore's two fixed namespaces** — `src/graphql/vtex/` for
the declared `typeExtensionKeys`, `src/graphql/thirdParty/` for everything else the factory's
map returns — regardless of `--namespace` (that split isn't a per-project choice). Both
namespaces' `resolvers/index.ts` get created or merged into automatically.

Every other declared `configParams` entry (e.g. `checkoutBaseUrl`) is surfaced in the generated
resolver file as a config field to fill in — auto-filled from your project's own
`discovery.config.js` when detectable (`storeId`, `environment`), or left as a commented
suggestion otherwise, never silently dropped.

The client query wrapper (`src/utils/<file>.ts` by default, `--client-dir`) embeds the
operation's query/mutation **text literally** — not an import of the constant — for the same
codegen-visibility reason `add`'s source-copy mode exists. Re-run this command (it won't
overwrite an existing copy) after a `@vtex-us-se/resolvers` upgrade that changes the operation.

None of this is needed if you only use the operation through a component `add` already copied
in source form — that component's own copied hook already has its query/mutation text inlined.
This wrapper exists for writing your **own** component against a `@vtex-us-se/resolvers`
operation directly.

```bash
se-components add-resolver assemblySet --namespace b2c        # default, typeDef placement only
se-components add-resolver assemblySet --target-dir src/graphql
se-components add-resolver assemblySet --client-dir src/utils
se-components add-resolver assemblySet --force   # overwrite an existing typeDef file
```

## Requirements

`@vtex-us-se/ui` and/or `@vtex-us-se/resolvers` must already be installed in the project where
these commands run (peer dependencies of this CLI, not bundled) — both commands error out with
a clear message if the relevant package can't be resolved from the current working directory.

```bash
pnpm --filter @vtex-us-se/cli build
node packages/cli/bin/se-components.js add SeBanner
```
