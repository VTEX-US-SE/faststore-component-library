# Implementation guide: using this library in a FastStore v4 project

Step-by-step for a new project, plus troubleshooting for issues found integrating
`SeAssemblySet` into a real store. If you hit an error not listed here, check
`packages/resolvers/README.md` and `packages/cli/README.md` first — they cover the
architecture; this file covers the setup flow and known failure modes.

## 1. Prerequisites

- A VTEX account with a product catalog
- Node 18+, Yarn (the official `vtex-sites/starter.store` template uses Yarn)
- A GitHub Personal Access Token with `read:packages`, authorized for SSO on `VTEX-US-SE` if
  the org requires it

## 2. Create the project

```bash
gh repo create your-org/faststore-my-demo --template vtex-sites/starter.store --private --clone
cd faststore-my-demo
yarn
yarn dev   # confirm it boots before changing anything
```

## 3. Registry access

`.npmrc` at the project root:

```
@vtex-us-se:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
export GITHUB_TOKEN=ghp_your_real_token   # in ~/.zshrc if you're on zsh (macOS default), not ~/.bashrc
yarn add @vtex-us-se/components @vtex-us-se/ui @vtex-us-se/resolvers
yarn add -D @vtex-us-se/cli
```

## 4. Transpiling this library and `@faststore/core`

Both `@vtex-us-se/components`/`@vtex-us-se/ui` and `@faststore/core` ship code Next.js's
bundler doesn't transpile by default for packages under `node_modules` (`@faststore/core`
ships raw, uncompiled TypeScript for its `/api` and `/experimental` subpaths in particular).
Add to `discovery.config.js`:

```js
experimental: {
  transpilePackages: ['@faststore/core', '@vtex-us-se/components', '@vtex-us-se/ui'],
}
```

This is the standard, documented Next.js mechanism for this situation (`transpilePackages`) —
not a workaround. If you ever suspect two separate copies of `@faststore/core` got installed
(which would mean two separate `sessionStore`/`cartStore` singletons — e.g. a set added via
`SeAssemblySet` not showing up in the native minicart), check:

```bash
find node_modules -path "*/@faststore/core/package.json"
```

One result is healthy. If you get more than one, resolve the version conflict causing the
duplicate (check your lockfile) before assuming anything else is wrong.

## 5. Simple component first: `SeBanner`

```tsx
import { SeBanner } from '@vtex-us-se/ui'
```

Use it anywhere, confirm it renders, before moving on — this has no GraphQL dependency, so it
isolates "is the library wired up at all" from anything resolver-related.

## 6. `SeAssemblySet`: copy the component

```bash
npx se-components add SeAssemblySet
```

This copies the CMS schema **and** the component's full source (with its GraphQL operations
inlined) into `src/components/sections/SeAssemblySet/` — see
[`packages/resolvers/README.md`](packages/resolvers/README.md) for why a plain
`import { SeAssemblySet } from '@vtex-us-se/ui'` doesn't work for this component. It also
creates/updates `src/components/index.tsx`, registering the **local copy**:

```tsx
import { SeAssemblySet } from './sections/SeAssemblySet/SeAssemblySet'

export default {
  SeAssemblySet,
}
```

## 7. `SeAssemblySet`: wire the server-side resolver

```bash
npx se-components add-resolver assemblySet
```

This splits the resolver across FastStore's two fixed namespaces automatically:
`src/graphql/vtex/resolvers/assemblySetResolver.ts` (the `StoreProduct.assemblyOptions` field
extension) and `src/graphql/thirdParty/resolvers/assemblySetResolver.ts` (the
`seAddComposedSet` mutation and the `SeAssemblyItem` type), and creates or merges into both
namespaces' `resolvers/index.ts`. Fill in `storeId`/`environment`/`checkoutBaseUrl` in the
generated resolver file if they weren't auto-detected from `discovery.config.js`.

## 8. Generate and upload the CMS schema

```bash
vtex content generate-schema cms/faststore/components cms/faststore/pages -o cms/faststore/schema.json
grep -A 5 '"SeAssemblySet"' cms/faststore/schema.json   # confirm it's in there

node -e "console.log(require('./discovery.config.js').api.storeId)"
vtex whoami   # confirm this matches before uploading

vtex content upload-schema cms/faststore/schema.json
```

Do **not** use `yarn cms-sync` / `faststore cms-sync` — that flow is legacy; `vtex content` is
the current one.

## 9. Catalog prerequisite

The SKU you use needs an **assembly option configured in VTEX Catalog** (Custom Fields /
attachment). Without one, `assemblyOptions` resolves to `[]` and the component renders nothing
— no error.

## 10. Add the section and verify

1. **Admin → Storefront → Content** → open the PDP (or whichever page/template) → add the
   `SE Assembly Set` section → set `skuId` to a product with an assembly option → Publish.
2. Restart `yarn dev` if it was already running (picks up the new GraphQL types).
3. Scroll to the section — it's lazy-mounted (`ViewportObserver`), so it won't render until it's
   in view. A headless browser or a hidden tab can make it look broken when it isn't; scroll to
   it (or wait) before concluding it's not rendering.
4. Run through the [verification checklist](#verification-checklist) below.

---

## Troubleshooting

| Error / symptom | Cause | Fix |
|---|---|---|
| `vtex content generate-schema -o cms/faststore/schema.json -b vtex.faststore4` errors out | That invocation (no explicit input paths, `-b` branch flag) isn't valid for this command. | Pass the input directories explicitly instead: `vtex content generate-schema cms/faststore/components cms/faststore/pages -o cms/faststore/schema.json`. |
| `GraphQLError: Syntax Error: Unexpected description, only GraphQL definitions support descriptions.` | A `"""..."""` doc block was placed directly over an `extend type`/`extend input` in a `.graphql` file — graphql-js only allows descriptions on definitions, not extensions. | Fixed in `@vtex-us-se/resolvers` ≥0.2.1. If you still hit this in a **custom** `.graphql` file of your own, move the description onto the field instead of the `extend type` line. |
| `Undefined mixin. @include focus-ring;` (or similar Sass error inside `@faststore/ui`'s compiled styles) | Two copies of `@faststore/ui`/`@faststore/components` installed at different versions — one hoisted, one nested under `@faststore/core` — and Sass compiled across the mismatch. | Fixed in `@vtex-us-se/ui` ≥0.2.1 (moved to `peerDependencies`). On 0.2.0, add to your project's `package.json` and reinstall: `"resolutions": { "@faststore/ui": "<your @faststore/core version>", "@faststore/components": "<same>" }`. |
| `Cannot find module '@vtex-us-se/resolvers/thirdParty'` (or any subpath the package doesn't export) | `add-resolver` used to conflate `--namespace` (your project's folder) with the package's own npm export subpath. | Fixed in `@vtex-us-se/cli` ≥2.1.0 — the subpath is now derived from the installed package, independent of `--namespace`. Upgrade the CLI. |
| `src/graphql/thirdParty/resolvers/index.ts` (or `src/components/index.ts`) contains invalid/placeholder content, or is empty | These aggregator files used to be left entirely to hand-write. | Fixed — both `add` and `add-resolver` now scaffold them when missing, and safely merge into simple existing shapes. Delete the broken file and re-run the command. |
| `SeAssemblySet not found. Add a new component for this section or remove it from the CMS` | Registered from the wrong package (`@vtex-us-se/components/b2c` instead of `@vtex-us-se/ui`) — `components` only exports the hook/utils, not the rendered component. | Re-run `se-components add SeAssemblySet` — it registers the correct local copy automatically. |
| Section registered in the CMS, but nothing renders on the PDP, no error at all | Either (a) `src/components/index.tsx` got shadowed by `@faststore/core`'s own `src/customizations/src/components/index.tsx` stub because your file was named `index.ts` (webpack resolves `.tsx` first — an `.ts` file with the same base name is silently never used), or (b) the component was `import`ed from the npm package instead of added via the CLI, so its GraphQL never registers with codegen. | (a) Confirm the file is `src/components/index.tsx`, not `.ts`. (b) Use `se-components add SeAssemblySet`, not a plain import — see the Troubleshooting entry above and `packages/resolvers/README.md`. |
| Component renders its skeleton/empty state forever, `groups` always `[]`, no network error visible | The GraphQL query/mutation was never registered by this project's own codegen — usually because it was imported as a constant (`gql(SOME_IMPORTED_CONST)`) rather than inlined as literal text. | Use `se-components add`'s source-copy mode (automatic for `SeAssemblySet`) — never hand-import the hook from `@vtex-us-se/components`. If you wrote your own component against `add-resolver`'s generated client wrapper, confirm that file has the literal query text, not an import (CLI ≥2.1.0 generates it inlined already). |
| `Module parse failed: Unexpected token` pointing into `node_modules/@faststore/core` or this library | Missing `transpilePackages` config — see [step 4](#4-transpiling-this-library-and-faststorecore). | Add the `transpilePackages` entry to `discovery.config.js`. |
| `Syntax error: Selector "..." is not pure (pure selectors must contain at least one local class or id)` pointing into a `@vtex-us-se/ui` component's `.module.scss` | The selector (usually a `[data-fs-*]` attribute hook) was declared with no local class anywhere in its chain — webpack's `css-loader`, which Next.js uses for CSS Modules, rejects that. Storybook's Vite build doesn't enforce this rule, so the component can look completely fine in this repo and still fail here. | Fixed in `@vtex-us-se/ui` ≥0.3.1 for `SeBannerCarousel`. If you hit it in a newer/custom component, upgrade `@vtex-us-se/ui`, or nest the offending selector inside the component's own local class block (see `SeBanner`'s `[data-fs-*]` selectors for the pattern) rather than leaving it as a top-level attribute selector. |
| Codegen fails with `Not all operations have an unique name: SeAddComposedSet` (or any `Se…` operation) and generates nothing | The same operation is defined twice under `src/` with different text — usually `add-resolver`'s `src/utils/<op>.ts` wrapper next to a copied component's hook, after an upgrade re-copied one but not the other. Two byte-identical copies pass, which is why this only appears later. | Delete the `src/utils/` wrapper if nothing but the copied component uses it (CLI ≥6.0 no longer creates it when the operation is already defined, and `add` warns about existing duplicates). |
| `Cannot return null for non-nullable field Mutation.seAddComposedSet` (or another custom field) right after adding a second operation | `src/graphql/thirdParty/resolvers/index.ts` combined the operations with `{ ...a, ...b }`: both define `Mutation`, so the spread kept only the last one's fields. | CLI ≥6.0 writes a per-type merge and rewrites the old spread shape on the next `add-resolver`. By hand: merge each type's fields (`Mutation: { ...a.Mutation, ...b.Mutation }`), never the maps themselves. |
| A custom operation's typeDef/resolver sits under `src/graphql/b2c/` and the field is missing from the schema | `add-resolver` used to default `--namespace` to `b2c`, a folder FastStore never loads. | Move both into `src/graphql/thirdParty/` (CLI ≥6.0 defaults there, or to the operation's own `meta.json` namespace). |
| `SeRequestToBuy` always shows "Something went wrong"; server logs `seSubmitOrganizationRequest: no VTEX app key/token configured` or `Master Data returned 4xx` | Missing `FS_DISCOVERY_APP_KEY`/`FS_DISCOVERY_APP_TOKEN`, or the Master Data entity/schema doesn't exist or doesn't accept the fields. | Set the env vars (WebOps Settings / `vtex.env`), and create the entity + schema described in `packages/resolvers/README.md#organizationrequest-b2b`. |
| Set composes successfully (mutation succeeds) but doesn't appear in the native minicart | The mutation calls Checkout directly rather than through FastStore's own cart-validation flow, so the client-side cart store isn't automatically told about it. | Expected today — the confirmation modal + "Checkout" link is the intended UX (see `SeAssemblySet`'s own doc comment), not the minicart. If you need it to also appear in the minicart, that requires triggering FastStore's own cart revalidation after the mutation — not implemented; flag it if you need it. |

## Verification checklist

- [ ] `yarn dev` boots with no `GraphQLError` and no Sass errors
- [ ] `find node_modules -path "*/@faststore/ui/package.json"` shows exactly one version
- [ ] After adding the section and loading the PDP once, `.faststore/@generated/persisted-documents.json` (or your project's equivalent codegen output) contains both `SeAssemblySetQuery` and `SeAddComposedSet`
- [ ] `POST /api/graphql` introspection includes `StoreProduct.assemblyOptions` and `Mutation.seAddComposedSet`
- [ ] The section renders on the PDP after scrolling to it
- [ ] Selecting items and clicking "Add to cart" shows the confirmation modal with the correct line items and total
- [ ] `yarn build` completes without errors
