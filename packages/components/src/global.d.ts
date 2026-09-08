// `@faststore/core` ships raw TypeScript source (no compiled .d.ts) whose own types only
// resolve inside a real FastStore project's build (discovery.config, generated GraphQL
// types, etc.). This ambient shim covers just the shape we actually use, so `tsc` never
// tries to physically resolve/typecheck the real module — the real one still gets used at
// runtime, by whichever @faststore/core the consuming FastStore project's own build
// provides.
declare module '@faststore/core/experimental' {
  export type B2bInfo = {
    userName?: string
    [key: string]: unknown
  }

  export function useSession_unstable(): {
    b2b?: B2bInfo | null
    [key: string]: unknown
  }
}
