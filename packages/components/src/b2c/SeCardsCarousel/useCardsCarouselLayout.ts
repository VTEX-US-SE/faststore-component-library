/**
 * Layout decision for a row of content cards: below three items there's no room to justify
 * the row, so it's centered instead of spread edge-to-edge. Ported from the original
 * `banners.length < 3 ? styles.centered : styles.carousel` inline check so the rule lives
 * next to the component's logic instead of being re-derived at the call site.
 */
export function useCardsCarouselLayout(itemCount: number): { isCentered: boolean } {
  return { isCentered: itemCount < 3 }
}
