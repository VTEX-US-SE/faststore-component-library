# @vtex-us-se/cli

Internal team CLI. Main command: `se-components add <ComponentName>`.

Copies `<ComponentName>.schema.jsonc` from whichever `@vtex-us-se/ui` is installed in the
**consuming project** (resolved from the current working directory, not from this CLI's own
dependency tree) into that project's `cms/faststore/components/`, renamed to the
`cms_component__<ComponentName>.jsonc` convention FastStore's tooling expects.

```bash
# from the FastStore project that already has @vtex-us-se/ui installed
se-components add SeBanner
se-components add SeBanner --target-dir cms/faststore   # default
se-components add SeBanner --force                       # overwrite an existing schema
```

Refuses to overwrite an existing schema file unless `--force` is passed, so a manually edited
copy in the consumer project isn't silently clobbered.

## Requirements

`@vtex-us-se/ui` must already be installed in the project where this command is run (it's a
peer dependency of this CLI, not a bundled one) — the command errors out with a clear message
if it can't be resolved.

```bash
pnpm --filter @vtex-us-se/cli build
node packages/cli/bin/se-components.js add SeBanner
```
