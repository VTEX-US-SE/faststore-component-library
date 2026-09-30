import { useMemo } from 'react'
import type { SeProductCardPrice } from './types'

export type FormattedPrice = {
  current: string
  listPrice?: string
  hasDiscount: boolean
}

/**
 * Formats a product's price using `Intl.NumberFormat`, decoupled from any specific
 * storefront's currency/locale setup — both are received as props instead of being
 * hardcoded, and default to `USD`/`en-US` when omitted.
 */
export function useFormattedPrice(price: SeProductCardPrice): FormattedPrice {
  const { current, listPrice, currencyCode = 'USD', currencyLocale = 'en-US' } = price

  return useMemo(() => {
    const formatter = new Intl.NumberFormat(currencyLocale, {
      style: 'currency',
      currency: currencyCode,
    })
    const hasDiscount = typeof listPrice === 'number' && listPrice > current

    return {
      current: formatter.format(current),
      listPrice: hasDiscount ? formatter.format(listPrice as number) : undefined,
      hasDiscount,
    }
  }, [current, listPrice, currencyCode, currencyLocale])
}
