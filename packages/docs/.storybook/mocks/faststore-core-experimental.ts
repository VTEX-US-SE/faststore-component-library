// Storybook-only mock for `@faststore/core/experimental`. The REAL module ships raw TypeScript
// source with no compiled artifact — importing it for real drags in most of @faststore/core's
// internal SDK (discovery.config, @generated, src/sdk/*), which only resolves inside a real
// FastStore project's own bundler config. Vite's dependency scanner chokes on that entire tree
// (68+ unresolved imports) the moment any story imports the real module, taking down all of
// Storybook — not just the story that needs it. This mock is aliased in main.ts ONLY for
// Storybook; the published components/ui packages still import the real module at runtime in a
// real FastStore project.
export type B2bInfo = {
  userName?: string
  [key: string]: unknown
}

export function useSession_unstable(): { b2b?: B2bInfo | null } {
  return { b2b: { userName: 'Storybook User' } }
}

/* eslint-disable @typescript-eslint/no-unused-vars -- signature must match the real hook's */
export function useLazyQuery_unstable<TData = unknown, TVariables = unknown>(
  query: unknown,
  variables: TVariables,
): [(variables: TVariables) => Promise<void>, { data: TData | undefined }] {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const submit = async (submittedVariables: TVariables) => {
    console.log('[Storybook mock] useLazyQuery_unstable called with', submittedVariables)
  }
  return [submit, { data: undefined }]
}
