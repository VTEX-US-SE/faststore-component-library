// @se-components source-copy: core-runtime
// Overrides FastStore's own product gallery section, which only works against the store's own
// @faststore/core instance (page context, search state, cart). So the CLI copies this component
// into the store, and it is exported from the `@vtex-us-se/components/product-gallery-b2b`
// subpath only, never from the package barrels (see SeProductListing).
import { useMemo, useState, type ComponentType } from 'react'
import { getOverriddenSection, ProductGallerySection } from '@faststore/core'
import { useBuyButton_unstable, useProductLink_unstable, useSession_unstable } from '@faststore/core/experimental'

export type B2bListingSku = {
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

/**
 * A gallery product: FastStore's own `ProductSummary_product` fields plus the `se*` fields the
 * resolvers package's `b2bProductFields` operation adds through the `ClientManyProducts` fragment.
 */
export type B2bListingProduct = {
  id?: string
  slug: string
  sku: string
  name: string
  brand?: { name?: string | null } | null
  isVariantOf: { name: string; productGroupID: string }
  image?: Array<{ url: string; alternateName?: string | null }> | null
  offers?: { offers?: Array<{ availability?: string | null }> | null } | null
  additionalProperty?: Array<{ propertyID?: string | null; name: string; value?: unknown; valueReference?: unknown }> | null
  seDescription?: string | null
  seProperties?: Array<{ name: string; values: string[] }> | null
  seSkus?: B2bListingSku[] | null
}

export type MoneyFormat = { locale: string; currency: string }

type Session = {
  person?: { id?: string } | null
  locale?: string
  currency?: { code?: string }
}

/**
 * FastStore's native gallery section (from the store's own @faststore/core) with its product card
 * replaced by `card`. Typed loosely on purpose: the store's generated section/card prop types
 * don't know the `se*` product fields, and the gallery's CMS props pass through untouched.
 */
export function productGalleryWithCard(
  card: ComponentType<{ product: B2bListingProduct; index: number }>,
  className?: string,
): ComponentType<Record<string, unknown>> {
  return getOverriddenSection({
    Section: ProductGallerySection,
    className,
    components: { __experimentalProductCard: { Component: card as never } },
  }) as unknown as ComponentType<Record<string, unknown>>
}

const IN_STOCK = 'https://schema.org/InStock'

export function formatMoney(value: number, { locale, currency }: MoneyFormat): string {
  return value.toLocaleString(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
}

/** Plain text from the catalog's HTML description (rendered as text, never as markup). */
export function descriptionText(html: string | null | undefined): string {
  return (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

/** "Material: Nitrile • Size: S, M, L". */
export function propertiesText(properties: B2bListingProduct['seProperties']): string {
  return (properties ?? []).map(({ name, values }) => `${name}: ${values.join(', ')}`).join('  •  ')
}

/** Lowest and highest SKU price, or undefined when no SKU has one. */
export function priceRange(skus: B2bListingSku[]): { min: number; max: number } | undefined {
  const prices = skus.map((sku) => sku.price).filter((price): price is number => typeof price === 'number')
  if (prices.length === 0) return undefined
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

/** Everything the listing card renders, derived from one gallery product. */
export function useB2bListingCard(product: B2bListingProduct, index: number) {
  const session = useSession_unstable() as Session
  const money: MoneyFormat = { locale: session?.locale ?? 'en-US', currency: session?.currency?.code ?? 'USD' }
  // `as never`: the store's generated ProductSummary type doesn't know the `se*` fields, and
  // useProductLink only reads `slug` (the kit cast the same way).
  const linkProps = useProductLink_unstable({ product: product as never, selectedOffer: 0, index })
  const skus = product.seSkus ?? []
  const range = priceRange(skus)

  return {
    isLoggedIn: Boolean(session?.person),
    href: linkProps.href,
    onClick: linkProps.onClick,
    name: product.isVariantOf?.name ?? product.name,
    brand: product.brand?.name ?? '',
    imageUrl: product.image?.[0]?.url,
    imageAlt: product.image?.[0]?.alternateName ?? product.name,
    outOfStock: product.offers?.offers?.[0]?.availability !== IN_STOCK,
    properties: propertiesText(product.seProperties),
    description: descriptionText(product.seDescription),
    minPrice: range ? formatMoney(range.min, money) : undefined,
    maxPrice: range && range.max !== range.min ? formatMoney(range.max, money) : undefined,
    hasSkus: skus.length > 0,
    money,
  }
}

/** The variation names shown as matrix columns, in the order the first SKU lists them. */
function attributeNames(skus: B2bListingSku[]): string[] {
  return skus[0]?.variations.map((variation) => variation.name) ?? []
}

/**
 * Quantities per SKU for the "View options" matrix, and the add-to-cart props for everything
 * chosen. Cart items are built the way FastStore's own buy button expects (`useBuyButton`), so
 * the minicart, analytics and the cart's own validation all see a normal add.
 */
export function useSkuMatrix(product: B2bListingProduct, money: MoneyFormat) {
  const skus = product.seSkus ?? []
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const setQuantity = (itemId: string, quantity: number, max: number) => {
    const clamped = Math.max(0, Math.min(Number.isFinite(quantity) ? Math.floor(quantity) : 0, max))
    setQuantities((current) => ({ ...current, [itemId]: clamped }))
  }

  const columns = attributeNames(skus)

  const rows = skus.map((sku) => ({
    itemId: sku.itemId,
    label: sku.referenceCode ?? sku.name,
    imageUrl: sku.imageUrl ?? undefined,
    imageAlt: sku.imageAlt ?? sku.name,
    attributes: columns.map((name) => sku.variations.find((variation) => variation.name === name)?.values[0] ?? ''),
    price: typeof sku.price === 'number' ? formatMoney(sku.price, money) : '—',
    available: sku.availableQuantity,
    quantity: quantities[sku.itemId] ?? 0,
    purchasable: typeof sku.price === 'number' && sku.availableQuantity > 0 && Boolean(sku.sellerId),
  }))

  const cartItems = useMemo(
    () =>
      skus
        .filter((sku) => (quantities[sku.itemId] ?? 0) > 0 && typeof sku.price === 'number' && sku.sellerId)
        .map((sku) => {
          const activeVariations = Object.fromEntries(sku.variations.map((variation) => [variation.name, variation.values[0]]))
          return {
            id: sku.itemId,
            quantity: quantities[sku.itemId] as number,
            price: sku.price as number,
            priceWithTaxes: sku.price as number,
            listPrice: sku.listPrice ?? (sku.price as number),
            listPriceWithTaxes: sku.listPrice ?? (sku.price as number),
            seller: { identifier: sku.sellerId as string },
            itemOffered: {
              sku: sku.itemId,
              name: sku.name,
              gtin: sku.ean ?? '',
              image: sku.imageUrl ? [{ url: sku.imageUrl, alternateName: sku.imageAlt ?? sku.name }] : [],
              brand: { name: product.brand?.name ?? '' },
              isVariantOf: {
                name: product.isVariantOf.name,
                productGroupID: product.isVariantOf.productGroupID,
                skuVariants: { activeVariations, slugsMap: null, availableVariations: null },
              },
              additionalProperty: sku.variations.map((variation) => ({
                name: variation.name,
                propertyID: product.additionalProperty?.find((property) => property.name === variation.name)?.propertyID,
                value: variation.values[0],
                valueReference: 'SPECIFICATION',
              })),
              unitMultiplier: sku.unitMultiplier ?? 1,
            },
          }
        }),
    [skus, quantities, product],
  )

  const totals = skus.reduce(
    (acc, sku) => {
      const quantity = quantities[sku.itemId] ?? 0
      return quantity > 0 && typeof sku.price === 'number'
        ? { items: acc.items + quantity, value: acc.value + quantity * sku.price }
        : acc
    },
    { items: 0, value: 0 },
  )

  // `as never`: matches the store's generated CartItem shape, built field by field above.
  const buyButton = useBuyButton_unstable(cartItems as never)

  return {
    columns,
    rows,
    setQuantity,
    totalItems: totals.items,
    subtotal: formatMoney(totals.value, money),
    addToCart: buyButton.onClick,
    reset: () => setQuantities({}),
  }
}
