// Storybook-only mock for the `@faststore/core` package root — same reason as
// faststore-core-experimental.ts. Only the B2B product shelves reach it.
import type { ComponentType } from 'react'

const product = (id: number, name: string, prices: number[]) => ({
  id: `storybook-product-${id}`,
  slug: `storybook-product-${id}`,
  sku: `${id}`,
  name,
  gtin: `${id}`,
  brand: { name: 'Storybook' },
  isVariantOf: { productGroupID: `${id}`, name },
  image: [{ url: `https://placehold.co/300x300?text=${encodeURIComponent(name)}`, alternateName: name }],
  offers: { offers: prices.map((price) => ({ price, listPrice: price })) },
})

// Module scope: stable identity across renders, like the real SWR-backed hook.
const FIXTURE_PRODUCTS = [
  product(1, 'Industrial Safety Gloves', [12.5, 14]),
  product(2, 'Heavy Duty Work Boots', [89]),
  product(3, 'Hi-Vis Safety Vest', [9.99, 11.49]),
  product(4, 'Hard Hat, Type II', [32]),
  product(5, 'Protective Eyewear (12 pack)', [48, 52]),
  product(6, 'Ear Protection Muffs', [24.75]),
]

export function useProductsQuery(variables: { first?: number }) {
  return {
    search: {
      products: {
        edges: FIXTURE_PRODUCTS.slice(0, variables.first ?? FIXTURE_PRODUCTS.length).map((node) => ({ node })),
      },
    },
  }
}

export function usePDP() {
  return { data: { product: FIXTURE_PRODUCTS[0] } }
}

type ShelfProps = { title: string; numberOfItems: number; kind: 'buy' | 'view' }

export const CrossSellingShelfSection: ComponentType<ShelfProps> = () => null

/**
 * Stands in for the native section: renders the overridden product card over fixture products,
 * which is the only part of the real section the B2B override changes.
 */
export function getOverriddenSection(override: {
  className?: string
  components?: { __experimentalProductCard?: { Component?: ComponentType<{ product: unknown; index: number }> } }
}) {
  const Card = override.components?.__experimentalProductCard?.Component

  return function OverriddenSection({ title, numberOfItems }: ShelfProps) {
    return (
      <section className={override.className}>
        <h2 style={{ fontFamily: 'sans-serif' }}>{title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24 }}>
          {Card && FIXTURE_PRODUCTS.slice(0, numberOfItems).map((p, i) => <Card key={p.id} product={p} index={i} />)}
        </div>
      </section>
    )
  }
}
