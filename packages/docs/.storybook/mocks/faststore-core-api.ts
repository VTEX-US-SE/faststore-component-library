// Storybook-only mock for `@faststore/core/api` — see faststore-core-experimental.ts for why:
// `gql` there reexports from a FastStore project's own codegen output, which doesn't exist here.
// This mock just returns the raw query string unchanged; stories never inspect its return value.
export function gql(query: string): unknown {
  return query
}
