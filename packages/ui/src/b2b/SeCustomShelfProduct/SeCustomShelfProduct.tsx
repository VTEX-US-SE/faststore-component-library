import { useB2bShelfProducts } from '@vtex-us-se/components/b2b'
import type { SeShelfFacet, SeShelfSort } from '@vtex-us-se/components/b2b'
import { SeCustomProductCard } from '../SeCustomProductCard/SeCustomProductCard'
import styles from './SeCustomShelfProduct.module.scss'

export type SeCustomShelfProductProps = {
  title?: string
  numberOfItems?: number
  sort?: SeShelfSort
  term?: string
  selectedFacets?: SeShelfFacet[]
  /** Passed through to every card — see `SeCustomProductCard`. */
  loginUrl?: string
}

const SKELETON_COUNT = 5

/**
 * Product shelf (by term / collection / category facets) rendered with the login-gated
 * `SeCustomProductCard`. The kit's `swiper` carousel is a CSS scroll-snap row here.
 */
export function SeCustomShelfProduct({
  title,
  numberOfItems = 10,
  sort = 'score_desc',
  term = '',
  selectedFacets = [],
  loginUrl,
}: SeCustomShelfProductProps) {
  const products = useB2bShelfProducts({ numberOfItems, sort, term, selectedFacets })

  return (
    <section className={styles.shelf} data-fs-se-b2b-shelf>
      {title && <h2 className={styles.title}>{title}</h2>}
      <ul className={styles.track}>
        {products.length > 0
          ? products.map((product, index) => (
              <li key={product.id || index} className={styles.item}>
                <SeCustomProductCard product={product} index={index} loginUrl={loginUrl} />
              </li>
            ))
          : Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <li key={index} className={styles.item} aria-hidden="true">
                <div className={styles.skeleton} />
              </li>
            ))}
      </ul>
    </section>
  )
}
