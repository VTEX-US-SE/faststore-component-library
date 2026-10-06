---
"@vtex-us-se/resolvers": minor
"@vtex-us-se/components": minor
"@vtex-us-se/ui": minor
"@vtex-us-se/cli": major
---

Add `SeRequestToBuy` (B2B, from `faststore-b2b-buyer-portal-kit`) — the first B2B component with
its own GraphQL operation — and fix three `add-resolver` bugs found wiring it next to
`SeAssemblySet`.

- **resolvers**: new `b2b` entry point with the `organizationRequest` operation
  (`Mutation.seSubmitOrganizationRequest`, `createOrganizationRequestResolver`) — stores
  "request buyer access" submissions as Master Data v2 documents, validating and length-capping
  every field first since the mutation is public.
- **components**: `useRequestToBuyForm()`.
- **ui**: `SeRequestToBuy` (add it with `se-components add` + `add-resolver organizationRequest`).
- **cli** (breaking: default namespace):
  - `add-resolver` no longer defaults `--namespace` to `b2c` (a folder FastStore never loads):
    it uses the operation's `meta.json` `namespace`, else `thirdParty`, and warns on anything
    other than `vtex`/`thirdParty`.
  - `resolvers/index.ts` aggregators now merge resolver maps per GraphQL type. The previous
    `{ ...a, ...b }` spread silently dropped fields whenever two operations extend the same type
    (e.g. both `Mutation`); an existing spread-shaped file is rewritten on the next
    `add-resolver`.
  - `add-resolver` skips its `src/utils/` client wrapper when `src/` already defines the
    operation (e.g. a component copied by `add`), and `add` warns about such duplicates —
    FastStore's codegen fails the whole build once two copies of one operation differ.
