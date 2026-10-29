// Storybook-only mock for the `@faststore/core` package root — same reason as
// faststore-core-experimental.ts. Reached by the B2B product shelves and SeProductListing.
import type { ComponentType, CSSProperties } from 'react'

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

// SeProductListing: a PLP page context and a stand-in for the native gallery section that renders
// the same `data-fs-*` structure, so the listing's restyling shows. Only the gallery's own grid
// layout is inlined here; Storybook loads FastStore's tokens, not its section styles.
const PLP_CONTEXT = {
  data: {
    collection: {
      seo: { title: 'Storybook Category' },
      breadcrumbList: { itemListElement: [{ name: 'Home' }, { name: 'Storybook Category' }] },
    },
  },
}

export function usePage<T>(): T {
  return PLP_CONTEXT as T
}

export const isPLP = (context: unknown): boolean =>
  Boolean((context as typeof PLP_CONTEXT | undefined)?.data?.collection?.seo)

type GalleryProps = {
  totalCountLabel?: string
  sortBySelector?: { label?: string; options?: Record<string, string> }
  loadMorePageButton?: { label?: string }
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(var(--fs-product-grid-columns-desktop, 4), minmax(0, 1fr))',
  columnGap: 'var(--fs-product-grid-gap-desktop, 1rem)',
  margin: 0,
  padding: 0,
  listStyle: 'none',
}

export function ProductGallerySection({ totalCountLabel, sortBySelector, loadMorePageButton }: GalleryProps) {
  return (
    <section style={{ fontFamily: 'sans-serif' }}>
      <div data-fs-product-listing>
        <div data-fs-product-listing-content-grid>
          <div data-fs-product-listing-results-count>
            <h2>
              {FIXTURE_PRODUCTS.length} {totalCountLabel}
            </h2>
          </div>
          <div data-fs-product-listing-sort>
            <div data-fs-select-field>
              <label htmlFor="storybook-sort">{sortBySelector?.label}</label>
              <select id="storybook-sort">
                {Object.entries(sortBySelector?.options ?? {}).map(([key, label]) => (
                  <option key={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div data-fs-product-listing-results>
            <ul data-fs-product-grid style={gridStyle}>
              {FIXTURE_PRODUCTS.map((p) => (
                <li key={p.id}>
                  <article data-fs-product-card>
                    <div data-fs-product-card-image style={{ overflow: 'hidden' }}>
                      <img src={p.image[0].url} alt={p.name} style={{ width: '100%', height: '100%', display: 'block' }} />
                    </div>
                    <div data-fs-product-card-content>
                      <h3 data-fs-product-card-title>
                        <a href={`#${p.slug}`}>{p.name}</a>
                      </h3>
                      <span data-fs-product-card-prices>${p.offers.offers[0].price}</span>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
          <div data-fs-product-listing-pagination style={{ textAlign: 'center' }}>
            <button type="button" data-fs-button>
              {loadMorePageButton?.label}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
