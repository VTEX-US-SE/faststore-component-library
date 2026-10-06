import { useMemo, type ReactElement } from 'react'
import { CrossSellingShelfSection, getOverriddenSection } from '@faststore/core'
import type { SeProductSummary } from '../SeCustomProductCard/types'

export type CrossSellingProductCard = (props: { product: SeProductSummary; index: number }) => ReactElement | null

/**
 * FastStore's native `CrossSellingShelf` section (it reads the PDP context and queries "who
 * bought/saw also..." itself) with only its product card swapped out. Memoized so the section
 * isn't re-created — and its data re-fetched — on every render; pass a stable (module-level)
 * `ProductCard`.
 */
export function useCrossSellingShelfOverride(ProductCard: CrossSellingProductCard, className?: string) {
  return useMemo(
    () =>
      getOverriddenSection({
        Section: CrossSellingShelfSection,
        className,
        components: {
          __experimentalProductCard: { Component: ProductCard },
        },
      }),
    [ProductCard, className],
  )
}
