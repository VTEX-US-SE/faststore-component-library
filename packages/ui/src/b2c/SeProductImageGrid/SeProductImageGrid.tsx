import type { CSSProperties } from 'react'
import { filterItemsWithImage } from '@vtex-us-se/components'
import type { SeProductImageGridColumns, SeProductImageGridItem } from '@vtex-us-se/components'
import styles from './SeProductImageGrid.module.scss'

export interface SeProductImageGridProps {
  /** Product cut-out images, each optionally linking to its product page. */
  items?: SeProductImageGridItem[]
  /** Columns per breakpoint. Defaults to 6 from 768px up and 4 below. */
  columns?: SeProductImageGridColumns
  /** Shown when no item has an image. */
  emptyMessage?: string
  /** Accessible label for the section. */
  ariaLabel?: string
  className?: string
  testId?: string
}

export function SeProductImageGrid({
  items = [],
  columns,
  emptyMessage = 'No products to show yet.',
  ariaLabel = 'Collection',
  className,
  testId = 'se-product-image-grid',
}: SeProductImageGridProps) {
  const visibleItems = filterItemsWithImage(items)
  const columnStyle = {
    '--se-product-image-grid-columns-desktop': columns?.desktop ?? 6,
    '--se-product-image-grid-columns-mobile': columns?.mobile ?? 4,
  } as CSSProperties

  return (
    <section
      className={[styles.productImageGrid, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      data-fs-product-image-grid
      data-testid={testId}
      style={columnStyle}
    >
      {visibleItems.length === 0 ? (
        <p className={styles.empty} data-fs-product-image-grid-empty>
          {emptyMessage}
        </p>
      ) : (
        <ul className={styles.list} data-fs-product-image-grid-list>
          {visibleItems.map((item, index) => {
            const alt = item.alt ?? ''
            const image = (
              <img
                className={styles.image}
                src={item.image}
                alt={alt}
                loading="lazy"
                decoding="async"
                data-fs-product-image-grid-image
              />
            )

            return (
              <li
                key={`${item.image}-${index}`}
                className={styles.item}
                data-fs-product-image-grid-item
              >
                {item.link ? (
                  <a
                    className={styles.link}
                    href={item.link}
                    aria-label={alt || `Product ${index + 1}`}
                    data-fs-product-image-grid-link
                  >
                    {image}
                  </a>
                ) : (
                  image
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
