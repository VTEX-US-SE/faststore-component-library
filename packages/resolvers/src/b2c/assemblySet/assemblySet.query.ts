/**
 * Plain GraphQL strings, not wrapped in `gql(...)` -- @faststore/core/api's `gql` only
 * resolves inside a real FastStore project (it re-exports from that project's own codegen
 * output). Consumers wrap these strings with their own `gql(...)`.
 */

/**
 * Reads a customisable set's parent product plus every eligible child, resolved by
 * `assemblySet.resolver.ts`'s `StoreProduct.assemblyOptions` field resolver. Not
 * auto-scaffolded by `add-resolver` (it answers a field on an existing type, not a new
 * root operation) -- wrap it directly with your own `gql(...)`.
 */
export const ASSEMBLY_SET_QUERY = `
  query SeAssemblySetQuery($locator: [IStoreSelectedFacet!]!) {
    product(locator: $locator) {
      sku
      slug
      name
      image {
        url
        alternateName
      }
      offers {
        offers {
          price
        }
      }
      assemblyOptions {
        id
        name
        required
        groups {
          name
          minQuantity
          maxQuantity
          items {
            skuId
            minQuantity
            maxQuantity
            initialQuantity
            product {
              sku
              name
              image {
                url
                alternateName
              }
              offers {
                offers {
                  price
                  listPrice
                  availability
                  seller {
                    identifier
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

export const SE_ADD_COMPOSED_SET_MUTATION = `
  mutation SeAddComposedSet($data: SeComposedSetInput!) {
    seAddComposedSet(data: $data) {
      orderFormId
      value
      messages
    }
  }
`
