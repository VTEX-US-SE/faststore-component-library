import { useProductsQuery } from '@faststore/core'
import type { SeProductSummary } from '../SeCustomProductCard/types'
import type { SeShelfFacet, SeShelfSort } from './types'

export type B2bShelfQuery = {
  numberOfItems?: number
  sort?: SeShelfSort
  term?: string
  selectedFacets?: SeShelfFacet[]
}

/**
 * Products for a B2B shelf through FastStore's own `useProductsQuery` — a native query, so
 * there's no custom GraphQL here and no copy-paste distribution needed. Facets missing a key or
 * value are dropped (a half-filled CMS row would otherwise be sent as an empty facet).
 */
export function useB2bShelfProducts({
  numberOfItems = 10,
  sort = 'score_desc',
  term = '',
  selectedFacets = [],
}: B2bShelfQuery): SeProductSummary[] {
  const data = useProductsQuery({
    first: numberOfItems,
    term,
    sort,
    selectedFacets: selectedFacets.filter((facet) => facet?.key && facet?.value),
  })

  return (data?.search?.products?.edges ?? []).map((edge) => edge.node as SeProductSummary)
}
