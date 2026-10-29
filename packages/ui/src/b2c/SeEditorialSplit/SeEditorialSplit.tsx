import type { CSSProperties } from 'react'
import { Icon } from '@faststore/ui'
import { filterItemsWithImage } from '@vtex-us-se/components'
import type {
  SeEditorialSplitAspectRatio,
  SeEditorialSplitCaptionPosition,
  SeEditorialSplitColumns,
  SeEditorialSplitItem,
} from '@vtex-us-se/components'
import styles from './SeEditorialSplit.module.scss'

export interface SeEditorialSplitProps {
  /** One or more full-bleed editorial images. */
  items?: SeEditorialSplitItem[]
  /** Columns from 768px up (1 to 3). Below 768px the items always stack. */
  columns?: SeEditorialSplitColumns
  /** Image aspect ratio, width:height. */
  aspectRatio?: SeEditorialSplitAspectRatio
  /** Caption bar below the image, or laid over its bottom edge. */
  captionPosition?: SeEditorialSplitCaptionPosition
  /** Accessible label for the section. */
  ariaLabel?: string
  className?: string
  testId?: string
}

export function SeEditorialSplit({
  items = [],
  columns = 2,
  aspectRatio = '3:4',
  captionPosition = 'below',
  ariaLabel = 'Featured',
  className,
  testId = 'se-editorial-split',
}: SeEditorialSplitProps) {
  const visibleItems = filterItemsWithImage(items)

  if (visibleItems.length === 0) return null

  return (
    <section
      className={[styles.editorialSplit, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      data-fs-editorial-split
      data-aspect-ratio={aspectRatio}
      data-caption-position={captionPosition}
      data-testid={testId}
      style={{ '--se-editorial-split-columns': columns } as CSSProperties}
    >
      <ul className={styles.list} data-fs-editorial-split-list>
        {visibleItems.map((item, index) => {
          const body = (
            <>
              <img
                className={styles.image}
                src={item.image}
                alt={item.alt ?? ''}
                loading="lazy"
                decoding="async"
                data-fs-editorial-split-image
              />
              {item.title && (
                <span className={styles.caption} data-fs-editorial-split-caption>
                  <span className={styles.title}>{item.title}</span>
                  {item.link && (
                    <Icon
                      name="ArrowRight"
                      width={20}
                      height={20}
                      aria-hidden
                      className={styles.arrow}
                    />
                  )}
                </span>
              )}
            </>
          )

          return (
            <li
              key={`${item.image}-${index}`}
              className={styles.item}
              data-fs-editorial-split-item
            >
              {item.link ? (
                <a className={styles.link} href={item.link} data-fs-editorial-split-link>
                  {body}
                </a>
              ) : (
                body
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
