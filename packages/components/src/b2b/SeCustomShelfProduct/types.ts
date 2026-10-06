export type SeShelfSort =
  | 'score_desc'
  | 'price_desc'
  | 'price_asc'
  | 'orders_desc'
  | 'name_asc'
  | 'name_desc'
  | 'release_desc'
  | 'discount_desc'

export type SeShelfFacet = {
  key: string
  value: string
}
