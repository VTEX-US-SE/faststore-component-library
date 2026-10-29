import { createContext, useContext, useMemo, useState } from 'react'
import { productGalleryWithCard, useB2bListingCard, type B2bListingProduct } from '@vtex-us-se/components/product-gallery-b2b'
import { SeSkuMatrixDrawer } from './SeSkuMatrixDrawer'
import styles from './SeProductGalleryB2B.module.scss'

export type SeProductGalleryB2BLabels = {
  perUnit?: string
  viewOptions?: string
  loginForPrice?: string
  outOfStock?: string
  chooseOptions?: string
  productsCount?: string
  itemId?: string
  price?: string
  quantity?: string
  available?: string
  subtotal?: string
  items?: string
  addToCart?: string
  close?: string
}

/** The native gallery's own CMS props (filters, sorting, pagination labels) pass straight through. */
export type SeProductGalleryB2BProps = Record<string, unknown> & {
  /** Where anonymous shoppers are sent from "Login for price". */
  loginUrl?: string
  labels?: SeProductGalleryB2BLabels
}

const DEFAULT_LABELS: Required<SeProductGalleryB2BLabels> = {
  perUnit: 'Per unit',
  viewOptions: 'View Options',
  loginForPrice: 'Login for Price',
  outOfStock: 'Unavailable',
  chooseOptions: 'Choose from Options',
  productsCount: 'Products',
  itemId: 'Item ID',
  price: 'Price',
  quantity: 'Quantity',
  available: 'available',
  subtotal: 'Subtotal',
  items: 'items',
  addToCart: 'Add to Cart',
  close: 'Close',
}

type CardConfig = { loginUrl: string; labels: Required<SeProductGalleryB2BLabels> }

// The native gallery instantiates each card itself, so section-level settings reach it through context.
const CardConfigContext = createContext<CardConfig>({ loginUrl: '/login', labels: DEFAULT_LABELS })

function B2bListingCard({ product, index }: { product: B2bListingProduct; index: number }) {
  const { loginUrl, labels } = useContext(CardConfigContext)
  const card = useB2bListingCard(product, index)
  const [matrixOpen, setMatrixOpen] = useState(false)

  return (
    <article className={styles.card} data-fs-se-b2b-listing-card data-out-of-stock={card.outOfStock}>
      <a className={styles.image} href={card.href} onClick={card.onClick} tabIndex={-1} aria-hidden="true">
        {card.imageUrl && <img src={card.imageUrl} alt="" loading="lazy" width={120} height={120} />}
      </a>

      <div className={styles.info}>
        <h3 className={styles.name}>
          <a href={card.href} onClick={card.onClick}>
            {card.name}
          </a>
        </h3>
        {card.brand && <span className={styles.brand}>{card.brand}</span>}
        {card.properties && <p className={styles.properties}>{card.properties}</p>}
        {card.description && <p className={styles.description}>{card.description}</p>}
        {card.outOfStock && <span className={styles.outOfStock}>{labels.outOfStock}</span>}
      </div>

      <div className={styles.prices}>
        {card.isLoggedIn ? (
          <>
            {card.minPrice && (
              <>
                <p className={styles.perUnit}>{labels.perUnit}</p>
                <span className={styles.priceRange}>
                  {card.minPrice}
                  {card.maxPrice && ` – ${card.maxPrice}`}
                </span>
              </>
            )}
            <button
              type="button"
              className={styles.primary}
              disabled={!card.hasSkus}
              onClick={() => setMatrixOpen(true)}
            >
              {labels.viewOptions}
            </button>
          </>
        ) : (
          <a className={styles.primary} href={loginUrl}>
            {labels.loginForPrice}
          </a>
        )}
      </div>

      {card.isLoggedIn && matrixOpen && (
        <SeSkuMatrixDrawer product={product} money={card.money} labels={labels} onClose={() => setMatrixOpen(false)} />
      )}
    </article>
  )
}

/**
 * FastStore's native PLP/search product gallery (facets, sorting, pagination, analytics) with a
 * B2B list-style card: login-gated price range across the product's SKUs, and a "View options"
 * matrix to add several SKUs to the cart at once. Use it in place of the native ProductGallery
 * section on PLP and search pages.
 *
 * Must be added with `se-components add SeProductGalleryB2B` (source copy: it overrides a native
 * section, which only works against the store's own @faststore/core) plus `se-components
 * add-resolver b2bProductFields`, which writes the `ClientManyProducts` fragment that gives every
 * gallery product the `se*` fields this card reads.
 */
export function SeProductGalleryB2B({ loginUrl = '/login', labels, ...galleryProps }: SeProductGalleryB2BProps) {
  const GallerySection = useMemo(() => productGalleryWithCard(B2bListingCard, styles.productGallery), [])

  const config = useMemo(() => ({ loginUrl, labels: { ...DEFAULT_LABELS, ...labels } }), [loginUrl, labels])

  return (
    <CardConfigContext.Provider value={config}>
      <GallerySection
        {...galleryProps}
        productCard={{
          showDiscountBadge: false,
          bordered: false,
          sponsoredLabel: '',
          taxesConfiguration: { usePriceWithTaxes: false, taxesLabel: '' },
        }}
        productComparison={{ enabled: false }}
      />
    </CardConfigContext.Provider>
  )
}
