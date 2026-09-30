---
"@vtex-us-se/cli": patch
---

Fix `add-resolver` generating an aggregator (`resolvers/index.ts`) that re-exports a module
name that doesn't match the actual resolver file it just created — e.g.
`export { default } from './assemblySet'` when the file written to disk was
`assemblySetResolver.ts`, not `assemblySet.ts`. Every consumer hit this immediately as
`Module not found: Can't resolve './assemblySet'` the moment their bundler tried to load the
generated resolver index. `resolverModuleName` now derives from the actual `resolverFileName`
instead of the bare operation name.

Verified by actually type-checking the generated `vtex/resolvers/index.ts` and
`thirdParty/resolvers/index.ts` against a symlinked local build (not just reading the printed
CLI summary, which is what let this ship in the first place — it echoed the wrong path
consistently and looked correct at a glance).

Also fixes a second bug in the same command, found by the same real consumer: for a split
operation (`resolverShape: "map"` with `typeExtensionKeys`), the typeDef was still copied under
`--namespace`'s folder (`b2c` by default) while the resolver was correctly split into `vtex/`
and `thirdParty/` — the two FastStore-fixed folders it actually scans. The schema this project's
GraphQL server loaded never gained the field/type the resolver map was prepared to answer,
surfacing at runtime as `StoreProduct.assemblyOptions defined in resolvers, but not in schema`
(not a parse error, so easy to miss). The typeDef now lands in `thirdParty/typeDefs/` for a
split operation too, alongside its resolver.
