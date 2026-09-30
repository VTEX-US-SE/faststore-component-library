export type SeProductCardImage = {
  src: string
  alt: string
}

export type SeProductCardPrice = {
  current: number
  listPrice?: number
  /** ISO 4217 currency code used to format `current`/`listPrice`. Defaults to `USD`. */
  currencyCode?: string
  /** BCP 47 locale used to format `current`/`listPrice`. Defaults to `en-US`. */
  currencyLocale?: string
}

export type SeProductCardProduct = {
  name: string
  image: SeProductCardImage
  price: SeProductCardPrice
  /** Destination for the card's image/title links and the action button. */
  href: string
}
