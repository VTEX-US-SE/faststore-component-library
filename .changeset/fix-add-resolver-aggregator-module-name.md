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
