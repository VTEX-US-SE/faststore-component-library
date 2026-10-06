// Type-only stand-in for the `@faststore/core` package root, wired in through `paths` in
// tsconfig.json. Same reason as the ambient shims in src/global.d.ts — the real module is raw
// TypeScript that only typechecks inside a FastStore project — but the root needs `paths`
// rather than `declare module`: under `moduleResolution: Node` the root (unlike `/experimental`
// and `/api`, which only exist via package.json `exports`) resolves to the real `index.ts`, and a
// resolved file wins over an ambient declaration. Only reached from the `b2b` entry point.
import type { ComponentType } from 'react'

export function useProductsQuery(
  variables: {
    first?: number
    after?: string
    term?: string
    sort?: string
    selectedFacets?: Array<{ key: string; value: string }>
  },
  options?: Record<string, unknown>,
): { search?: { products?: { edges?: Array<{ node: unknown }> } } } | null | undefined

export function usePDP(): unknown

export const CrossSellingShelfSection: ComponentType<{
  numberOfItems: number
  itemsPerPage?: number
  title: string
  kind: 'buy' | 'view'
}>

export function getOverriddenSection<P>(override: {
  Section: ComponentType<P>
  className?: string
  components?: Record<
    string,
    { Component?: (props: { product: never; index: number }) => unknown; props?: Record<string, unknown> }
  >
}): ComponentType<P>
