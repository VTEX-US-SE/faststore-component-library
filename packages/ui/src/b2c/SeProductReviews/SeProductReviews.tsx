import { useId, useState } from 'react'
import { useSeProductReviews } from '@vtex-us-se/components'
import type {
  SeProductReview,
  SeProductReviewsFilterOption,
  SeProductReviewsSortOption,
} from '@vtex-us-se/components'
import styles from './SeProductReviews.module.scss'

export interface SeProductReviewsProps {
  /** Reviews to show. Empty (the default) renders the empty state. */
  reviews?: SeProductReview[]
  /** Accessible label for the section. */
  ariaLabel?: string
  /** Accessible label of the star row. `{rating}` is replaced by the average. */
  starsLabel?: string
  averageRatingLabel?: string
  reviewsCountLabel?: string
  /** Hidden when empty. */
  loginLabel?: string
  /** Hidden when empty. */
  loginLink?: string
  sortLabel?: string
  /** The first one is selected by default. */
  sortOptions?: SeProductReviewsSortOption[]
  filterLabel?: string
  /** The first one is selected by default. */
  filterOptions?: SeProductReviewsFilterOption[]
  emptyMessage?: string
  className?: string
  testId?: string
}

const STAR_COUNT = 5

const DEFAULT_SORT_OPTIONS: SeProductReviewsSortOption[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'lowest', label: 'Lowest rated' },
  { key: 'highest', label: 'Highest rated' },
]

const DEFAULT_FILTER_OPTIONS: SeProductReviewsFilterOption[] = [
  { rating: 0, label: 'All' },
  { rating: 1, label: '1 star' },
  { rating: 2, label: '2 stars' },
  { rating: 3, label: '3 stars' },
  { rating: 4, label: '4 stars' },
  { rating: 5, label: '5 stars' },
]

function Stars({ rating, label }: { rating: number; label?: string }) {
  const filled = Math.round(rating)

  return (
    <span
      className={styles.stars}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-fs-product-reviews-stars
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => (
        <svg
          key={index}
          className={styles.star}
          viewBox="0 0 16 16"
          width="14"
          height="14"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M8 1.5l1.9 4.1 4.4.5-3.3 3 .9 4.4L8 11.3l-3.9 2.2.9-4.4-3.3-3 4.4-.5z"
            fill={index < filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  )
}

interface ToggleProps {
  label: string
  options: string[]
  selected: number
  onSelect: (index: number) => void
}

function Toggle({ label, options, selected, onSelect }: ToggleProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const current = options[selected] ?? options[0] ?? ''

  if (options.length === 0) return null

  return (
    <div className={styles.toggle} data-fs-product-reviews-toggle>
      <button
        type="button"
        className={styles.toggleButton}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${current}`}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
      >
        <span>{current}</span>
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
          <path d={open ? 'M1 8h14' : 'M8 1v14M1 8h14'} stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
      {open && (
        <ul id={listId} className={styles.options} aria-label={label}>
          {options.map((option, index) => (
            <li key={`${option}-${index}`}>
              <button
                type="button"
                className={styles.option}
                aria-pressed={index === selected}
                onClick={() => {
                  onSelect(index)
                  setOpen(false)
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function SeProductReviews({
  reviews = [],
  ariaLabel = 'Reviews',
  starsLabel = 'Rated {rating} out of 5',
  averageRatingLabel = 'Average rating',
  reviewsCountLabel = 'reviews',
  loginLabel = 'Log in to review',
  loginLink = '/login',
  sortLabel = 'Sort by',
  sortOptions = DEFAULT_SORT_OPTIONS,
  filterLabel = 'Filter by',
  filterOptions = DEFAULT_FILTER_OPTIONS,
  emptyMessage = 'No reviews yet',
  className,
  testId = 'se-product-reviews',
}: SeProductReviewsProps) {
  const [sortIndex, setSortIndex] = useState(0)
  const [filterIndex, setFilterIndex] = useState(0)
  const { summary, visibleReviews } = useSeProductReviews(reviews, {
    sort: sortOptions[sortIndex]?.key,
    rating: filterOptions[filterIndex]?.rating,
  })

  return (
    <section
      className={[styles.productReviews, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      data-fs-product-reviews
      data-testid={testId}
    >
      <Stars
        rating={summary.average}
        label={starsLabel.replace('{rating}', String(summary.average))}
      />
      <p className={styles.average} data-fs-product-reviews-average>
        {averageRatingLabel}: {summary.average} ({summary.count} {reviewsCountLabel})
      </p>

      {loginLink && loginLabel && (
        <a className={styles.login} href={loginLink} data-fs-product-reviews-login>
          {loginLabel}
        </a>
      )}

      <div className={styles.controls} data-fs-product-reviews-controls>
        <Toggle
          label={sortLabel}
          options={sortOptions.map((option) => option.label)}
          selected={sortIndex}
          onSelect={setSortIndex}
        />
        <Toggle
          label={filterLabel}
          options={filterOptions.map((option) => option.label)}
          selected={filterIndex}
          onSelect={setFilterIndex}
        />
      </div>

      {visibleReviews.length === 0 ? (
        <p className={styles.empty} data-fs-product-reviews-empty>
          {emptyMessage}
        </p>
      ) : (
        <ul className={styles.list} data-fs-product-reviews-list>
          {visibleReviews.map((review, index) => (
            <li
              key={review.id ?? `${review.author ?? 'review'}-${index}`}
              className={styles.review}
              data-fs-product-reviews-review
            >
              <Stars rating={review.rating} />
              {review.title && <h3 className={styles.reviewTitle}>{review.title}</h3>}
              {review.text && <p className={styles.reviewText}>{review.text}</p>}
              {(review.author || review.date) && (
                <p className={styles.reviewMeta}>
                  {[review.author, review.date].filter(Boolean).join(' · ')}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
