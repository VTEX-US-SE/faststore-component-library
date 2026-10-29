import { useMemo } from 'react'
import type {
  SeProductReview,
  SeProductReviewsSelection,
  SeProductReviewsSortKey,
  SeProductReviewsSummary,
} from './types'

export function summarizeSeProductReviews(
  reviews: SeProductReview[] | undefined
): SeProductReviewsSummary {
  const list = reviews ?? []
  if (list.length === 0) return { average: 0, count: 0 }

  const total = list.reduce((sum, review) => sum + review.rating, 0)
  return { average: Math.round((total / list.length) * 10) / 10, count: list.length }
}

const timeOf = (review: SeProductReview) => {
  const time = review.date ? Date.parse(review.date) : NaN
  return Number.isNaN(time) ? 0 : time
}

const COMPARATORS: Record<SeProductReviewsSortKey, (a: SeProductReview, b: SeProductReview) => number> = {
  newest: (a, b) => timeOf(b) - timeOf(a),
  oldest: (a, b) => timeOf(a) - timeOf(b),
  lowest: (a, b) => a.rating - b.rating,
  highest: (a, b) => b.rating - a.rating,
}

/** Filters by exact rating (0 or unset keeps all), then sorts. Never mutates `reviews`. */
export function selectSeProductReviews(
  reviews: SeProductReview[] | undefined,
  { sort = 'newest', rating = 0 }: SeProductReviewsSelection = {}
): SeProductReview[] {
  const filtered = (reviews ?? []).filter(
    (review) => !rating || Math.round(review.rating) === rating
  )
  return [...filtered].sort(COMPARATORS[sort])
}

export function useSeProductReviews(
  reviews: SeProductReview[] | undefined,
  { sort, rating }: SeProductReviewsSelection = {}
) {
  const summary = useMemo(() => summarizeSeProductReviews(reviews), [reviews])
  const visibleReviews = useMemo(
    () => selectSeProductReviews(reviews, { sort, rating }),
    [reviews, sort, rating]
  )
  return { summary, visibleReviews }
}
