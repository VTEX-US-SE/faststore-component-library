import { useCrossSellingShelfOverride } from '@vtex-us-se/components/b2b'
import type { SeProductSummary } from '@vtex-us-se/components/b2b'
import { SeCustomProductCard } from '../SeCustomProductCard/SeCustomProductCard'
import styles from './SeCustomCrossSellingShelf.module.scss'

export type SeCustomCrossSellingShelfProps = {
  title?: string
  numberOfItems?: number
  kind?: 'buy' | 'view'
}

// Module-level so its identity is stable — the override hook memoizes on it.
function CrossSellingCard({ product, index }: { product: SeProductSummary; index: number }) {
  return <SeCustomProductCard product={product} index={index} />
}

/**
 * PDP-only: FastStore's native `CrossSellingShelf` section ("who bought/saw this also...") with
 * its product card swapped for the login-gated `SeCustomProductCard`. Must be placed on a PDP
 * (it reads the product from the PDP context).
 */
export function SeCustomCrossSellingShelf({
  title = 'People also saw',
  numberOfItems = 5,
  kind = 'view',
}: SeCustomCrossSellingShelfProps) {
  const CrossSellingShelf = useCrossSellingShelfOverride(CrossSellingCard, styles.crossSellingShelf)

  return <CrossSellingShelf title={title} numberOfItems={numberOfItems} kind={kind} />
}
