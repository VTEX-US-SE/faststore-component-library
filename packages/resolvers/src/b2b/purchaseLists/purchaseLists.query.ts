/**
 * Plain GraphQL strings, not wrapped in `gql(...)` -- see assemblySet.query.ts for why.
 * Consumers get them inlined as literal text by `se-components add` / `add-resolver`.
 */
const LIST_FIELDS = `
      documentId
      name
      visibility
      ownerEmail
      isOwner
      items {
        skuId
        quantity
      }`

const RESULT_FIELDS = `
      ok
      error
      list {${LIST_FIELDS}
      }`

export const SE_PURCHASE_LISTS_QUERY = `
  query SePurchaseLists {
    sePurchaseLists {${LIST_FIELDS}
    }
  }
`

export const SE_PURCHASE_LIST_CREATE_MUTATION = `
  mutation SePurchaseListCreate($name: String!, $visibility: SePurchaseListVisibility!, $items: [SePurchaseListItemInput!]) {
    sePurchaseListCreate(name: $name, visibility: $visibility, items: $items) {${RESULT_FIELDS}
    }
  }
`

export const SE_PURCHASE_LIST_ADD_ITEMS_MUTATION = `
  mutation SePurchaseListAddItems($documentId: String!, $items: [SePurchaseListItemInput!]!) {
    sePurchaseListAddItems(documentId: $documentId, items: $items) {${RESULT_FIELDS}
    }
  }
`

export const SE_PURCHASE_LIST_SET_ITEM_QUANTITY_MUTATION = `
  mutation SePurchaseListSetItemQuantity($documentId: String!, $skuId: String!, $quantity: Int!) {
    sePurchaseListSetItemQuantity(documentId: $documentId, skuId: $skuId, quantity: $quantity) {${RESULT_FIELDS}
    }
  }
`

export const SE_PURCHASE_LIST_RENAME_MUTATION = `
  mutation SePurchaseListRename($documentId: String!, $name: String!) {
    sePurchaseListRename(documentId: $documentId, name: $name) {${RESULT_FIELDS}
    }
  }
`

export const SE_PURCHASE_LIST_SET_VISIBILITY_MUTATION = `
  mutation SePurchaseListSetVisibility($documentId: String!, $visibility: SePurchaseListVisibility!) {
    sePurchaseListSetVisibility(documentId: $documentId, visibility: $visibility) {${RESULT_FIELDS}
    }
  }
`

export const SE_PURCHASE_LIST_DELETE_MUTATION = `
  mutation SePurchaseListDelete($documentId: String!) {
    sePurchaseListDelete(documentId: $documentId) {
      ok
      error
    }
  }
`

/**
 * The "add to a purchase list" picker's own copies of the list query and the two mutations it
 * sends (SeAddToPurchaseList, and SeCheckStockAndPricing through it). Named apart from
 * SePurchaseLists' operations: every copied component inlines its operation text into the
 * store's src/, and FastStore's codegen fails the whole build once two definitions of one
 * operation name differ (e.g. after only one of the components is re-copied on an upgrade).
 */
export const SE_ADD_TO_PURCHASE_LIST_LISTS_QUERY = `
  query SeAddToPurchaseListLists {
    sePurchaseLists {${LIST_FIELDS}
    }
  }
`

export const SE_ADD_TO_PURCHASE_LIST_ADD_ITEMS_MUTATION = `
  mutation SeAddToPurchaseListAddItems($documentId: String!, $items: [SePurchaseListItemInput!]!) {
    sePurchaseListAddItems(documentId: $documentId, items: $items) {${RESULT_FIELDS}
    }
  }
`

export const SE_ADD_TO_PURCHASE_LIST_CREATE_MUTATION = `
  mutation SeAddToPurchaseListCreate($name: String!, $visibility: SePurchaseListVisibility!, $items: [SePurchaseListItemInput!]) {
    sePurchaseListCreate(name: $name, visibility: $visibility, items: $items) {${RESULT_FIELDS}
    }
  }
`

const PRODUCT_FIELDS = `
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
      }`

/**
 * One list item's product, by SKU id -- FastStore's own `product` query (the PDP's lookup), plus
 * `seSkus` from the `b2bProductFields` operation, which must be installed too. Its own operation
 * name (not SeCheckStockAndPricing's `SeSkuSearch`) so both components can live in one store
 * without defining the same operation twice.
 */
export const SE_PURCHASE_LIST_PRODUCT_QUERY = `
  query SePurchaseListProduct($locator: [IStoreSelectedFacet!]!) {
    product(locator: $locator) {${PRODUCT_FIELDS}
    }
  }
`

/** Products whose SKUs match `term`, for adding SKUs to a list by reference code. */
export const SE_PURCHASE_LIST_SEARCH_QUERY = `
  query SePurchaseListSearch($term: String!, $first: Int!) {
    search(first: $first, term: $term, sort: score_desc, selectedFacets: []) {
      products {
        edges {
          node {${PRODUCT_FIELDS}
          }
        }
      }
    }
  }
`
