export type SeProductReview = {
  id?: string
  /** 1 to 5. */
  rating: number
  title?: string
  text?: string
  author?: string
  /** ISO 8601 date, used for sorting and shown as is. */
  date?: string
}

export type SeProductReviewsSortKey = 'newest' | 'oldest' | 'lowest' | 'highest'

export type SeProductReviewsSortOption = {
  key: SeProductReviewsSortKey
  label: string
}

export type SeProductReviewsFilterOption = {
  /** 0 shows every review; 1 to 5 shows only reviews with that rating. */
  rating: number
  label: string
}

export type SeProductReviewsSelection = {
  sort?: SeProductReviewsSortKey
  rating?: number
}

export type SeProductReviewsSummary = {
  /** Average rating rounded to one decimal, 0 without reviews. */
  average: number
  count: number
}
