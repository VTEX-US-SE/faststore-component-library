# Working in this repo

Internal FastStore v4 component library (`@vtex-us-se/*`). See `README.md` for the
architecture overview. This file is the process to follow when **adding or changing a
component** — especially one with its own GraphQL — so the kind of bugs found integrating
`SeAssemblySet` (five rounds of real-world failures across two integration attempts, plus a
CLI bug that shipped in the fix for those) don't repeat.

## The one rule that would have prevented most of this

**A tool's own printed success message is not proof of anything. Only inspecting the actual
generated artifact is proof.** `add-resolver` printed `✔ Created ... (re-exports
./assemblySet)` for months of "verification" while the file it referenced didn't exist —
the message and the bug shared the same wrong variable, so they agreed with each other and
looked correct. Every verification step below says what to actually *open and check*, not what
command to run and glance at.

## Step 0 — Decide if this component needs the copy-paste distribution mode

Before writing any code: **does this component's logic need to call a custom GraphQL
operation** (one that isn't already exposed by FastStore's native queries)?

- **No** (pure UI, native FastStore data, or no data at all — like `SeBanner`) → it's a normal
  npm-imported component. Skip to [Step 2](#step-2--build-it).
- **Yes** (like `SeAssemblySet`) → it **must** ship via `se-components add`'s source-copy mode,
  never as a plain npm import. Read `packages/resolvers/README.md`'s "Read this first" section
  before writing a single line — it explains *why* (FastStore's GraphQL codegen can only see a
  `gql(...)` call whose argument is literal text inside the consumer's own `src/`; an imported
  constant is invisible to it even though it resolves fine at runtime, and there is no error —
  the component just silently never fetches data). This is not a corner case to special-case
  later; it changes how you write the hook from the start (see Step 1).

## Step 1 — Design the GraphQL operation (only if Step 0 said yes)

Before implementing, decide and write down:

1. **Does it extend an existing FastStore type** (e.g. adding a field to `StoreProduct`,
   reading data already on the resolver's root)? That's a **`vtex`** concern.
2. **Does it define new types/queries/mutations**, calling an external API (including VTEX's
   own Checkout/Master Data directly)? That's a **`thirdParty`** concern.
3. A single operation can be both at once (`assemblySet` is). If so, its `meta.json` needs
   `"typeExtensionKeys": [...]` listing which of the factory's returned top-level keys are the
   `vtex` ones — `add-resolver` uses this to split the generated resolver files automatically.
   Get this list right: it's the difference between the resolver landing in the right FastStore
   convention folder or not.
4. List every config value the resolver factory needs (`storeId` and friends). Anything beyond
   `storeId`/`environment` won't be auto-detected from `discovery.config.js` — it'll show up as
   a commented TODO in the generated file, which is fine, but make sure the factory itself
   either has a sane default or fails loudly (see `createAssemblySetResolver`'s
   `checkoutBaseUrl` warning) rather than silently doing the wrong thing.

Read the official FastStore convention doc pattern (`extend type` vs new types, the
`vtex`/`thirdParty` folder split) directly rather than guessing — if you don't have it handy,
it's the same content packages/resolvers/README.md links to.

## Step 2 — Build it

Same shape as every component here: `packages/resolvers` (if Step 0/1 applied) →
`packages/components` (logic/hooks, no styles) → `packages/ui` (presentation + CMS
`.schema.jsonc`) → `packages/docs` (Storybook story + mocks for any new
`@faststore/core/experimental` hook the story needs).

For a GraphQL-dependent component's hook: call `gql(SOME_STRING_CONSTANT)` exactly the way
`useAssemblySet.ts` does. Don't try to work around Step 0 by fetching manually, hardcoding
persisted-document text, or anything clever — the copy-paste mechanism (Step 4) is what makes
this pattern work, by inlining the string at copy time. Fighting that is more work than using
it.

## Step 3 — Local checks before touching a real project

```bash
pnpm --filter @vtex-us-se/resolvers build test   # validate-graphql.mjs parses every .graphql
pnpm --filter @vtex-us-se/cli build lint
pnpm --filter @vtex-us-se/components build lint
pnpm --filter @vtex-us-se/ui build lint test      # test = validate-css-module-purity.mjs, see below
pnpm --filter @vtex-us-se/docs build              # Storybook build, not just dev — catches Sass/dependency issues dev mode won't
```

A Storybook story rendering correctly proves the **UI and hook logic** work. It proves **nothing**
about GraphQL codegen visibility — Storybook mocks `gql`/`useQuery_unstable` entirely, so a
story can pass with 100% green while the real component is completely broken in an actual
FastStore project. Don't stop here for a GraphQL-dependent component.

**A green Storybook build also proves nothing about CSS Modules validity in a real Next.js
project.** `SeBannerCarousel` shipped with a `[data-fs-banner-carousel-arrows]` selector
declared at the top level of its `.module.scss` — no local class anywhere in the chain — which
compiled and rendered fine in Storybook (Vite doesn't enforce this) but broke immediately in the
real project with `Syntax error: Selector "[data-fs-banner-carousel-arrows] button" is not pure
(pure selectors must contain at least one local class or id)`, which is webpack's `css-loader`
(what Next.js actually uses) rejecting it. `pnpm --filter @vtex-us-se/ui test` runs
`validate-css-module-purity.mjs`, which compiles every `.module.scss` with the real Sass compiler
and re-applies that exact rule — run it for any component whose styles use a `[data-fs-*]` or
other attribute/tag-only selector, not just the ones with obvious global-looking selectors. If
you hit this by hand instead: nest the offending selector inside the component's own local class
block (see `SeBanner`'s or the fixed `SeBannerCarousel`'s `[data-fs-*]` selectors for the
pattern) — never leave an attribute/tag selector as a sibling of the local classes.

## Step 4 — Verify the CLI's *actual output*, against a real symlinked project

This is the step that was skipped (or done but not trusted correctly) every time a bug shipped.
Set up a throwaway consumer project once:

```bash
mkdir -p /tmp/fake-project/node_modules/@vtex-us-se
ln -s "$(pwd)/packages/resolvers" /tmp/fake-project/node_modules/@vtex-us-se/resolvers
ln -s "$(pwd)/packages/ui" /tmp/fake-project/node_modules/@vtex-us-se/ui
ln -s "$(pwd)/packages/components" /tmp/fake-project/node_modules/@vtex-us-se/components
cd /tmp/fake-project
printf 'module.exports = {"api":{"storeId":"testaccount","environment":"vtexcommercestable"}}' > discovery.config.js
```

Then, for the new component/operation:

```bash
node <repo>/packages/cli/dist/index.js add <ComponentName>
node <repo>/packages/cli/dist/index.js add-resolver <operationName>
```

**For every file the CLI says it created or modified, actually open it and check — don't trust
the printed summary line:**

- [ ] The file exists at the exact path claimed
- [ ] Every relative import it writes (`./foo`) has a real file of that exact name sitting next
      to it — `ls` the directory and cross-reference by eye. (This specific check would have
      caught the `./assemblySet` vs `assemblySetResolver.ts` bug immediately.)
- [ ] `tsc --noEmit` the generated/copied files against the symlinked packages — zero errors.
      Missing-module errors here are real; ignore only errors that are artifacts of the ad hoc
      invocation (no real tsconfig, no `.scss`/React types installed at that path — e.g.
      "Cannot find module 'react'" or "'.module.scss'" are expected noise in this harness, not
      bugs).
- [ ] `grep -rn "@vtex-us-se" <copied component dir>` returns **nothing**, for a copy-mode
      component. Any hit means an import didn't get rewritten.
- [ ] Every `gql(...)` call in a copied/generated file has **literal template-string text**,
      not a bare identifier. Grep for `gql([A-Z_]` (a bare uppercase constant) — it should
      match nothing.
- [ ] Run both commands **again** (idempotency): confirm they report "already exists" /
      "already references" for everything, don't duplicate content, and don't crash.
- [ ] If the operation is `resolverShape: "map"` with `typeExtensionKeys`: confirm the split
      landed in the right folders (`vtex/` got the declared keys, `thirdParty/` got the rest) —
      open both generated files and read the keys, don't infer from the console summary.
- [ ] **Add the new operation next to an existing one that extends the same type** (e.g. two
      `Mutation` operations — `assemblySet` + yours) and open `thirdParty/resolvers/index.ts`:
      it must merge per type. Then actually execute it (transpile + `require`) and list the
      merged `Mutation` fields — a top-level spread dropped `seAddComposedSet` silently, with no
      build or boot error.
- [ ] **No operation is defined twice under `src/`** — `grep -rn "mutation <OpName>\|query <OpName>" src`
      should hit exactly one file (the copied hook). FastStore's codegen accepts identical
      duplicates and fails the whole build once they diverge.
- [ ] **The typeDef landed in the same namespace folder its resolver actually loads from.**
      A split resolver only fixes half the problem if the typeDef still goes wherever
      `--namespace` points (`b2c` by default) — a folder FastStore's GraphQL server never scans.
      The failure mode is `X defined in resolvers, but not in schema` at query time, not a build
      error, so nothing here or in Storybook catches it — only checking where the `.graphql`
      file physically landed does. `find src/graphql -name '*.graphql'` and confirm it's under
      `vtex/typeDefs/` or `thirdParty/typeDefs/`, matching wherever the resolver that answers its
      fields actually lives.

None of this proves the GraphQL codegen visibility problem is solved for a *new* component the
same way it is for `SeAssemblySet` — that's structural (Step 0), not something this harness can
verify. What this harness catches is CLI-generated code being internally broken, which is a
different, equally real failure mode (see `#16`).

## Step 5 — Update documentation in the same PR

Not optional, not a follow-up — component and docs land together:

- `packages/resolvers/README.md` (if a new operation) — add it under "Operations"
- `packages/ui/README.md`, `packages/components/README.md` — add the component/hook
- `packages/cli/README.md` — only if CLI behavior itself changed
- `IMPLEMENTATION.md` — add any new troubleshooting entries this component's integration
  surfaced (a new failure mode you hit while doing Step 4 belongs here, with the exact error
  text)
- Root `README.md`'s "Current status" section

## Step 6 — Changeset and PR

```bash
pnpm changeset
```

Pick the semver level per package honestly: a CLI behavior change that's backward-compatible
(new scaffolding capability) is `minor`, not `patch`; a pure bugfix is `patch`. Don't force
everything to the same number just because they're landing together.

Always a branch + PR, never a direct push to `main` (standing preference — see memory). Wait
for `build-lint-test` to go green. Remember `build-lint-test` proves the **library** builds; it
does not run Step 4's harness — that's still on you before opening the PR.

## After merge: expect a sync PR

The Release workflow will publish successfully but fail to push its own version-bump commit
back to `main` (branch protection; the bot has no bypass, only repo Admins do — a known,
accepted gap, not something to "fix" by pushing around branch protection). After every merge
that carries a changeset:

1. Check `gh run list --branch main` for a failed `Release` run
2. If failed, confirm what actually published (`gh run view <id> --log | grep "success packages published"`)
3. Branch off `main`, run `pnpm changeset version`, confirm the resulting versions match what
   published, commit, PR — same pattern as `#3`, `#6`, `#8`, `#10`, `#12`, `#15`.

This is expected, recurring, and fine — it is not a sign something went wrong with the feature
PR itself.
