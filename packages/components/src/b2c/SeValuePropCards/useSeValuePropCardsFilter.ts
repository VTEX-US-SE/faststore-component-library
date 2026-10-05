import { useMemo } from 'react'
import type { SeValuePropCardsFilterOptions, SeValuePropCardsItem } from './types'

const splitList = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)

/**
 * Returns the cards that should be visible for the given locale / customer class.
 * Cards without `languagesToShow` / `clustersToShow` are always visible.
 */
export function filterSeValuePropCards(
  cards: SeValuePropCardsItem[] | undefined,
  { locale, customerClass }: SeValuePropCardsFilterOptions = {}
): SeValuePropCardsItem[] {
  return (cards ?? []).filter((card) => {
    if (card.languagesToShow) {
      const locales = splitList(card.languagesToShow)
      if (locales.length > 0 && !locales.includes((locale ?? '').toLowerCase())) return false
    }

    if (card.clustersToShow) {
      const clusters = splitList(card.clustersToShow)
      if (clusters.length > 0) {
        if (!customerClass) return false
        if (!clusters.includes(customerClass.toLowerCase())) return false
      }
    }

    return true
  })
}

export function useSeValuePropCardsFilter(
  cards: SeValuePropCardsItem[] | undefined,
  { locale, customerClass }: SeValuePropCardsFilterOptions = {}
): SeValuePropCardsItem[] {
  return useMemo(
    () => filterSeValuePropCards(cards, { locale, customerClass }),
    [cards, locale, customerClass]
  )
}
