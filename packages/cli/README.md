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

Copies `<operationName>`'s `.graphql` typeDef into `src/graphql/<namespace>/typeDefs/`, and
scaffolds (or safely merges into) the server resolver and its aggregator `resolvers/index.ts`
in the same namespace folder.

**Namespace:** `--namespace`, else the operation's own `meta.json` `namespace`, else
`thirdParty`. FastStore's GraphQL server only loads `src/graphql/vtex/` and
`src/graphql/thirdParty/` — anything else is warned about, since it would be silently ignored.
(Before CLI 6.0 the default was `b2c`, a folder FastStore never reads: a non-split operation
added without `--namespace` was never part of the schema.)

**Aggregator (`resolvers/index.ts`):** combines every resolver map **per GraphQL type**, not with
a `{ ...a, ...b }` spread. Older CLIs wrote the spread, which silently dropped fields whenever
two operations extend the same type — e.g. `assemblySet` and `organizationRequest` both add to
`Mutation`, and the spread kept only the last one's. Adding an operation to a project with an
older spread-shaped `index.ts` rewrites it into the per-type shape automatically.

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

The wrapper is **skipped** when your `src/` already defines the operation — typically a
component `add` copied in source form, whose hook carries its own inlined copy. FastStore's
codegen tolerates two definitions of one operation only while their text is byte-identical;
once one copy changes (an upgrade re-copies one file but not the other), the whole codegen run
fails with `Not all operations have an unique name` and generates nothing. For the same reason
`add` warns when a component it copies defines an operation that already exists elsewhere in
`src/` (e.g. a wrapper from running `add-resolver` first). The wrapper is only for writing your
**own** component against a `@vtex-us-se/resolvers` operation directly.

```bash
se-components add-resolver organizationRequest --namespace thirdParty  # meta.json's own default
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
