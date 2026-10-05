export type SeValuePropCardsCta = {
  buttonText?: string
  link?: string
}

export type SeValuePropCardsItem = {
  /** Image URL for the card icon. Decorative (rendered with empty alt). */
  icon?: string
  title?: string
  description?: string
  cta?: SeValuePropCardsCta
  /**
   * Comma-separated list of locales (e.g. `en-US,es-MX`). When set, the card is only
   * visible when the `locale` passed to the component matches one of them (case-insensitive).
   */
  languagesToShow?: string
  /**
   * Comma-separated list of customer clusters/classes. When set, the card is only visible
   * when the `customerClass` passed to the component matches one of them (case-insensitive).
   */
  clustersToShow?: string
}

export type SeValuePropCardsFilterOptions = {
  locale?: string | null
  customerClass?: string | null
}
