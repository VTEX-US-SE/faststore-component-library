export type SeProductListingLabels = {
  filterButton?: string
  filtersTitle?: string
  clearFilters?: string
  applyFilters?: string
  sortBy?: string
  resultsCount?: string
  loadMore?: string
  previousPage?: string
  sponsored?: string
  errorMessage?: string
}

/** Label per native sort key. */
export type SeProductListingSortOptions = {
  score_desc?: string
  orders_desc?: string
  release_desc?: string
  price_asc?: string
  price_desc?: string
  discount_desc?: string
  name_asc?: string
  name_desc?: string
}

export type SeProductListingLink = {
  label?: string
  url?: string
}

export type SeProductListingEmptyState = {
  title?: string
  firstLink?: SeProductListingLink
  secondLink?: SeProductListingLink
}

export type SeProductListingColumns = {
  /** Below 768px. Defaults to 2. */
  mobile?: number
  /** From 768px. Defaults to 4. */
  desktop?: number
}

export type SeProductListingImageAspectRatio = '2:3' | '3:4' | '1:1'
