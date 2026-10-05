import {
  useFormattedPrice_unstable,
  useProductLink_unstable,
  useSession_unstable,
} from '@faststore/core/experimental'
import type { SeProductSummary } from './types'

export type B2bProductCard = {
  name: string
  imageUrl?: string
  imageAlt: string
  href: string
  onClick: () => void
  /** Prices are login-gated: only signed-in shoppers see them. */
  isLoggedIn: boolean
  /** Formatted with the session's own locale/currency. Equal when there's one price only. */
  minPrice: string
  maxPrice: string
  hasPriceRange: boolean
}

/**
 * Derives what the login-gated B2B product card shows. Ported from the kit's
 * `CustomProductCard`, which hardcoded `en-US`/`USD` through its own `formatPrice`; this formats
 * through FastStore's `useFormattedPrice_unstable` so it follows the session currency instead.
 */
export function useB2bProductCard(product: SeProductSummary, index = 0): B2bProductCard {
  const { person } = useSession_unstable()
  const { href, onClick } = useProductLink_unstable({ product, selectedOffer: 0, index })

  const prices = (product.offers?.offers ?? []).map((offer) => offer.price).filter((price) => price > 0)
  const min = prices.length ? Math.min(...prices) : 0
  const max = prices.length ? Math.max(...prices) : 0

  // Both hooks always run (fixed hook order), even when the range collapses to one price.
  const minPrice = useFormattedPrice_unstable(min)
  const maxPrice = useFormattedPrice_unstable(max)

  const image = product.image?.[0]
  const name = product.isVariantOf?.name ?? product.name

  return {
    name,
    imageUrl: image?.url?.trim() || undefined,
    imageAlt: image?.alternateName || name,
    href,
    onClick,
    isLoggedIn: Boolean(person),
    minPrice,
    maxPrice,
    hasPriceRange: min !== max,
  }
}
