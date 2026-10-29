export type StockSku = {
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

/** A `SeSkuSearch` result product: the native fields the cart needs plus `seSkus`. */
export type StockProduct = {
  slug: string
  brand?: { name?: string | null } | null
  isVariantOf: { name: string; productGroupID: string }
  additionalProperty?: Array<{ propertyID?: string | null; name: string }> | null
  seSkus?: StockSku[] | null
}

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'

export type StockAvailability = {
  status: StockStatus
  /** Null when the simulation only said whether the SKU is available, not how many units. */
  quantity: number | null
}

export type StockRow = {
  product: StockProduct
  sku: StockSku
  quantity: number
  /** Undefined while the simulation is running; null when it failed. */
  availability?: StockAvailability | null
}

export type StockMoneyFormat = { locale: string; currency: string }

export function formatStockMoney(value: number, { locale, currency }: StockMoneyFormat): string {
  return value.toLocaleString(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
}

/**
 * Maps a simulation result to a buyer-facing status. `lowStockThreshold` units or more is
 * "In Stock" (the kit used 50); with no unit count, VTEX's own "available" means in stock.
 */
export function stockStatus(
  result: { availability?: string | null; availableQuantity?: number | null },
  lowStockThreshold: number,
): StockAvailability {
  if (typeof result.availableQuantity === 'number') {
    const quantity = result.availableQuantity
    return {
      status: quantity <= 0 ? 'Out of Stock' : quantity >= lowStockThreshold ? 'In Stock' : 'Low Stock',
      quantity,
    }
  }
  return { status: result.availability === 'available' ? 'In Stock' : 'Out of Stock', quantity: null }
}

/** SKUs of `products` whose reference code contains `term` (case-insensitive), or whose id is `term`. */
export function matchSkus(products: StockProduct[], term: string): Array<{ product: StockProduct; sku: StockSku }> {
  const needle = term.trim().toLowerCase()
  if (!needle) return []
  return products.flatMap((product) =>
    (product.seSkus ?? [])
      .filter((sku) => sku.referenceCode?.toLowerCase().includes(needle) || sku.itemId === term.trim())
      .map((sku) => ({ product, sku })),
  )
}

/** The SKU whose reference code is exactly `refId` (CSV import), case-insensitive. */
export function findSkuByRefId(products: StockProduct[], refId: string) {
  const needle = refId.trim().toLowerCase()
  for (const product of products) {
    const sku = product.seSkus?.find((candidate) => candidate.referenceCode?.toLowerCase() === needle)
    if (sku) return { product, sku }
  }
  return undefined
}

/** FastStore PDP URL of one SKU: `/{product-slug}-{skuId}/p` (search slugs end in the product's own SKU id). */
export function skuHref(product: StockProduct, sku: StockSku): string {
  return `/${product.slug.replace(/-\d+$/, '')}-${sku.itemId}/p`
}

/** A cart item in the shape FastStore's `useBuyButton` expects. */
export function toCartItem({ product, sku, quantity }: StockRow) {
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
