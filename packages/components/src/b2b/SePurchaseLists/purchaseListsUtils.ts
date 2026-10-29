export type PurchaseListVisibility = 'private' | 'organization'

export type PurchaseListItem = { skuId: string; quantity: number }

export type PurchaseList = {
  documentId: string
  name: string
  visibility: PurchaseListVisibility
  ownerEmail: string
  isOwner: boolean
  items: PurchaseListItem[]
}

export type PurchaseListError = 'UNAUTHENTICATED' | 'INVALID' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'FAILED'

export type PurchaseListSku = {
  itemId: string
  name: string
  ean?: string | null
  referenceCode?: string | null
  unitMultiplier?: number | null
  imageUrl?: string | null
  imageAlt?: string | null
  variations: Array<{ name: string; values: string[] }>
  sellerId?: string | null
  price?: number | null
  listPrice?: number | null
  availableQuantity: number
}

export type PurchaseListProduct = {
  slug: string
  brand?: { name?: string | null } | null
  isVariantOf: { name: string; productGroupID: string }
  additionalProperty?: Array<{ propertyID?: string | null; name: string }> | null
  seSkus?: PurchaseListSku[] | null
}

export type PurchaseListMoney = { locale: string; currency: string }

export function formatPurchaseListMoney(value: number, { locale, currency }: PurchaseListMoney): string {
  return value.toLocaleString(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
}

/** The text a buyer sees for each error code the resolvers send back. */
export const PURCHASE_LIST_ERROR_MESSAGES: Record<PurchaseListError, string> = {
  UNAUTHENTICATED: 'Your session expired. Sign in again to manage purchase lists.',
  INVALID: 'Please check the name and quantities and try again.',
  NOT_FOUND: 'That purchase list (or item) no longer exists.',
  FORBIDDEN: 'Only the owner of this list can do that.',
  CONFLICT: 'You already have a purchase list with that name.',
  FAILED: 'Something went wrong. Please try again.',
}

/** SKUs of `products` whose reference code contains `term` (case-insensitive), or whose id is `term`. */
export function matchPurchaseListSkus(products: PurchaseListProduct[], term: string) {
  const needle = term.trim().toLowerCase()
  if (!needle) return []
  return products.flatMap((product) =>
    (product.seSkus ?? [])
      .filter((sku) => sku.referenceCode?.toLowerCase().includes(needle) || sku.itemId === term.trim())
      .map((sku) => ({ product, sku })),
  )
}

/** FastStore PDP URL of one SKU: `/{product-slug}-{skuId}/p`. */
export function purchaseListSkuHref(product: PurchaseListProduct, sku: PurchaseListSku): string {
  return `/${product.slug.replace(/-\d+$/, '')}-${sku.itemId}/p`
}

/** A cart item in the shape FastStore's `useBuyButton` expects. */
export function purchaseListCartItem(product: PurchaseListProduct, sku: PurchaseListSku, quantity: number) {
  const price = sku.price ?? 0
  return {
    id: sku.itemId,
    quantity,
    price,
    priceWithTaxes: price,
    listPrice: sku.listPrice ?? price,
    listPriceWithTaxes: sku.listPrice ?? price,
    seller: { identifier: sku.sellerId ?? '1' },
    itemOffered: {
      sku: sku.itemId,
      name: sku.name,
      gtin: sku.ean ?? '',
      image: sku.imageUrl ? [{ url: sku.imageUrl, alternateName: sku.imageAlt ?? sku.name }] : [],
      brand: { name: product.brand?.name ?? '' },
      isVariantOf: {
        name: product.isVariantOf.name,
        productGroupID: product.isVariantOf.productGroupID,
        skuVariants: {
          activeVariations: Object.fromEntries(sku.variations.map((variation) => [variation.name, variation.values[0]])),
          slugsMap: null,
          availableVariations: null,
        },
      },
      additionalProperty: sku.variations.map((variation) => ({
        name: variation.name,
        propertyID: product.additionalProperty?.find((property) => property.name === variation.name)?.propertyID ?? '',
        value: variation.values[0],
        valueReference: 'SPECIFICATION',
      })),
      unitMultiplier: sku.unitMultiplier ?? 1,
    },
  }
}
