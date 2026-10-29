/**
 * Plain GraphQL strings, not wrapped in `gql(...)` -- see assemblySet.query.ts for why.
 * Consumers get them inlined as literal text by `se-components add` / `add-resolver`.
 */

/**
 * Products whose SKUs match `term`, through FastStore's own `search` (so prices follow the
 * shopper's B2B session) plus the `seSkus` field from the `b2bProductFields` operation -- which
 * must be installed too (`se-components add-resolver b2bProductFields`).
 */
export const SE_SKU_SEARCH_QUERY = `
  query SeSkuSearch($term: String!, $first: Int!) {
    search(first: $first, term: $term, sort: score_desc, selectedFacets: []) {
      products {
        edges {
          node {
            slug
            brand {
              name
            }
            isVariantOf {
              name
              productGroupID
            }
            additionalProperty {
              propertyID
              name
            }
            seSkus {
              itemId
              name
              ean
              referenceCode
              unitMultiplier
              imageUrl
              imageAlt
              variations {
                name
                values
              }
              sellerId
              price
              listPrice
              availableQuantity
            }
          }
        }
      }
    }
  }
`

export const SE_SKU_AVAILABILITY_QUERY = `
  query SeSkuAvailability($items: [SeSkuAvailabilityInput!]!, $country: String!, $postalCode: String) {
    seSkuAvailability(items: $items, country: $country, postalCode: $postalCode) {
      id
      availability
      availableQuantity
    }
  }
`
