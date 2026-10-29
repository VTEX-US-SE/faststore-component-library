/**
 * The slice of FastStore's `StoreProduct` root (an Intelligent Search SKU, with its whole product
 * under `isVariantOf`) these field resolvers read. Typed locally rather than imported from
 * `@faststore/api` so this package doesn't depend on it.
 */
export interface B2bProductRoot {
  isVariantOf?: {
    description?: string | null
    properties?: Array<{ name: string; values: string[] }> | null
    items?: Array<{
      itemId: string
      name: string
      ean?: string | null
      referenceId?: Array<{ Key: string; Value: string }> | null
      unitMultiplier?: number | null
      images?: Array<{ imageUrl: string; imageText?: string | null }> | null
      variations?: Array<{ name: string; values: string[] }> | null
      sellers?: Array<{
        sellerId: string
        sellerDefault?: boolean
        commertialOffer?: { Price?: number; ListPrice?: number; AvailableQuantity?: number } | null
      }> | null
    }> | null
  } | null
}

export interface SeProductSku {
  itemId: string
  name: string
  ean: string | null
  referenceCode: string | null
  unitMultiplier: number | null
  imageUrl: string | null
  imageAlt: string | null
  variations: Array<{ name: string; values: string[] }>
  sellerId: string | null
  price: number | null
  listPrice: number | null
  availableQuantity: number
}

/** Catalog properties FastStore/VTEX add for their own bookkeeping, not specs a buyer reads. */
const INTERNAL_PROPERTIES = new Set(['sellerId'])

/**
 * Factory (same shape as the other operations, though this one needs no config) returning a
 * `StoreProduct` resolver map (`resolverShape: "map"`, `namespace: "vtex"`: it only extends an
 * existing type with data already on the resolver's root, no external call).
 *
 * Ported from faststore-b2b-buyer-portal-kit's `product.ts`, with the fields prefixed (`se*`)
 * so a project that already installed the kit's unprefixed `items`/`properties` extension
 * doesn't get conflicting definitions, and flattened to what the B2B listing card reads.
 */
// The (empty) config param keeps the same call shape `add-resolver` generates for every factory.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createB2bProductFieldsResolver(_config: Record<string, unknown> = {}) {
  return {
    StoreProduct: {
      seDescription: (root: B2bProductRoot) => root.isVariantOf?.description ?? null,

      seProperties: (root: B2bProductRoot) =>
        (root.isVariantOf?.properties ?? []).filter((property) => !INTERNAL_PROPERTIES.has(property.name)),

      seSkus: (root: B2bProductRoot): SeProductSku[] =>
        (root.isVariantOf?.items ?? []).map((item) => {
          const seller = item.sellers?.find((candidate) => candidate.sellerDefault) ?? item.sellers?.[0]
          const offer = seller?.commertialOffer
          const image = item.images?.[0]

          return {
            itemId: item.itemId,
            name: item.name,
            ean: item.ean || null,
            referenceCode: item.referenceId?.[0]?.Value || null,
            unitMultiplier: item.unitMultiplier ?? null,
            imageUrl: image?.imageUrl ?? null,
            imageAlt: image?.imageText || null,
            variations: (item.variations ?? []).filter((variation) => variation.values.length > 0),
            sellerId: seller?.sellerId ?? null,
            price: offer?.Price ?? null,
            listPrice: offer?.ListPrice ?? null,
            availableQuantity: offer?.AvailableQuantity ?? 0,
          }
        }),
    },
  }
}
