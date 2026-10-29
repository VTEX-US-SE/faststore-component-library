import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from 'react'
import { SeProductListingGallery, useSeProductListingTitle } from '@vtex-us-se/components'
import type {
  SeProductListingColumns,
  SeProductListingEmptyState,
  SeProductListingImageAspectRatio,
  SeProductListingLabels,
  SeProductListingSortOptions,
} from '@vtex-us-se/components'
import styles from './SeProductListing.module.scss'

export interface SeProductListingProps {
  /** Overrides the category name read from the page. Empty uses the category name. */
  title?: string
  showTitle?: boolean
  labels?: SeProductListingLabels
  sortOptions?: SeProductListingSortOptions
  emptyState?: SeProductListingEmptyState
  /** Product grid columns. Defaults to 2 on mobile and 4 from 768px. */
  columns?: SeProductListingColumns
  /** Product image aspect ratio, width:height. Defaults to 2:3. */
  imageAspectRatio?: SeProductListingImageAspectRatio
  /** No gaps between product cards. Defaults to true. */
  edgeToEdge?: boolean
  /** Uppercase title, controls and card names. Defaults to true. */
  uppercase?: boolean
  className?: string
  testId?: string
}

const DEFAULT_LABELS: Required<SeProductListingLabels> = {
  filterButton: 'Filters',
  filtersTitle: 'Filters',
  clearFilters: 'Clear all',
  applyFilters: 'Apply',
  sortBy: 'Sort by',
  resultsCount: 'Results',
  loadMore: 'Load more products',
  previousPage: 'Previous page',
  sponsored: 'Sponsored',
  errorMessage: 'Products could not be loaded. Please refresh the page.',
}

const DEFAULT_SORT_OPTIONS: Required<SeProductListingSortOptions> = {
  score_desc: 'Relevance',
  orders_desc: 'Top sales',
  release_desc: 'Newest',
  price_asc: 'Price, low to high',
  price_desc: 'Price, high to low',
  discount_desc: 'Discount',
  name_asc: 'Name, A-Z',
  name_desc: 'Name, Z-A',
}

const DEFAULT_EMPTY_STATE: SeProductListingEmptyState = {
  title: 'No products match your selection',
  firstLink: { label: 'Clear filters', url: '?' },
  secondLink: { label: 'Back to home', url: '/' },
}

class GalleryErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SeProductListing: the product gallery failed to render', error, info)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * PLP and search listing: a category title above FastStore's native product gallery (facets,
 * sorting, load more, SEO links and analytics keep working), restyled through props.
 */
export function SeProductListing({
  title,
  showTitle = true,
  labels,
  sortOptions,
  emptyState,
  columns,
  imageAspectRatio = '2:3',
  edgeToEdge = true,
  uppercase = true,
  className,
  testId = 'se-product-listing',
}: SeProductListingProps) {
  const text = { ...DEFAULT_LABELS, ...labels }
  const options = { ...DEFAULT_SORT_OPTIONS, ...sortOptions }
  const empty = { ...DEFAULT_EMPTY_STATE, ...emptyState }
  const heading = useSeProductListingTitle(title)
  const layoutStyle = {
    '--se-product-listing-columns-mobile': columns?.mobile ?? 2,
    '--se-product-listing-columns-desktop': columns?.desktop ?? 4,
  } as CSSProperties

  return (
    <div
      className={[styles.productListing, className].filter(Boolean).join(' ')}
      data-fs-se-product-listing
      data-image-aspect-ratio={imageAspectRatio}
      data-edge-to-edge={edgeToEdge}
      data-uppercase={uppercase}
      data-testid={testId}
      style={layoutStyle}
    >
      {showTitle && heading && (
        <header className={styles.header}>
          <h1 className={styles.title}>{heading}</h1>
        </header>
      )}
      <GalleryErrorBoundary
        fallback={
          <p className={styles.error} role="alert">
            {text.errorMessage}
          </p>
        }
      >
        <SeProductListingGallery
          totalCountLabel={text.resultsCount}
          filter={{
            title: text.filtersTitle,
            mobileOnly: {
              filterButton: {
                label: text.filterButton,
                icon: { icon: 'FadersHorizontal', alt: text.filterButton },
              },
              clearButtonLabel: text.clearFilters,
              applyButtonLabel: text.applyFilters,
            },
          }}
          sortBySelector={{ label: text.sortBy, options }}
          loadMorePageButton={{ label: text.loadMore }}
          previousPageButton={{
            label: text.previousPage,
            icon: { icon: 'ArrowLeft', alt: text.previousPage },
          }}
          productCard={{
            showDiscountBadge: true,
            bordered: false,
            sponsoredLabel: text.sponsored,
            taxesConfiguration: { usePriceWithTaxes: false, taxesLabel: '' },
          }}
          emptyGallery={{
            title: empty.title,
            firstButton: {
              label: empty.firstLink?.label ?? '',
              url: empty.firstLink?.url ?? '/',
              icon: 'ArrowLeft',
            },
            secondButton: {
              label: empty.secondLink?.label ?? '',
              url: empty.secondLink?.url ?? '/',
              icon: 'House',
            },
          }}
        />
      </GalleryErrorBoundary>
    </div>
  )
}
