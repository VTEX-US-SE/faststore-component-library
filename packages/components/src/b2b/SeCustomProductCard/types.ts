/**
 * The subset of FastStore's `ProductSummary_product` fragment (what `useProductsQuery` and the
 * native shelves hand to a product card) that the B2B card actually reads. Typed locally because
 * the real generated type only exists inside a consuming FastStore project's codegen output.
 */
export type SeProductSummary = {
  id: string
  slug: string
  sku: string
  name: string
  gtin?: string
  brand?: { name?: string }
  isVariantOf: { productGroupID: string; name: string }
  image?: Array<{ url?: string; alternateName?: string }>
  offers: { offers: Array<{ price: number; listPrice?: number }> }
}
