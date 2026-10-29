/**
 * Plain GraphQL string, not wrapped in `gql(...)` -- see assemblySet.query.ts for why.
 *
 * Not an operation a component sends: `se-components add-resolver b2bProductFields` writes it to
 * the project's `src/fragments/ClientManyProducts.ts`, which FastStore merges into the query its
 * own product gallery (PLP and search) already runs -- so every gallery product also carries the
 * `se*` fields. The arguments must match FastStore's `ClientManyProductsQuery` exactly.
 */
export const SE_CLIENT_MANY_PRODUCTS_FRAGMENT = `
  fragment ClientManyProducts on Query {
    search(
      first: $first
      after: $after
      sort: $sort
      term: $term
      selectedFacets: $selectedFacets
      sponsoredCount: $sponsoredCount
    ) {
      products {
        edges {
          node {
            seDescription
            seProperties {
              name
              values
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
