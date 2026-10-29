import type { CSSProperties } from 'react'
import type {
  SeGridContentColumns,
  SeGridContentImage,
  SeGridContentItem,
  SeGridContentVariant,
} from '@vtex-us-se/components'
import styles from './SeGridContent.module.scss'

export interface SeGridContentProps {
  bannerImage?: SeGridContentImage
  items?: SeGridContentItem[]
  /** Columns on desktop (1 to 4). Tablets show up to 2, phones 1. Defaults to 4. */
  columns?: SeGridContentColumns
  /** Card layout. Defaults to `overlay`. */
  variant?: SeGridContentVariant
  className?: string
  testId?: string
}

export function SeGridContent({
  bannerImage,
  items = [],
  columns = 4,
  variant = 'overlay',
  className,
  testId = 'se-grid-content',
}: SeGridContentProps) {
  const columnStyle = {
    '--se-grid-content-columns': columns,
    '--se-grid-content-columns-tablet': Math.min(columns, 2),
  } as CSSProperties

  return (
    <section
      className={[styles.gridContent, className].filter(Boolean).join(' ')}
      data-fs-grid-content
      data-variant={variant}
      data-testid={testId}
      style={columnStyle}
    >
      <div className={styles.container}>
        <div className={styles.grid}>
          {items.map((item, idx) => (
            <article key={item.href ?? `${item.title}-${idx}`} className={styles.card}>
              {item.image &&
                (item.href ? (
                  <a href={item.href} className={styles.mediaLink} tabIndex={-1} aria-hidden>
                    <div
                      className={styles.media}
                      style={{ backgroundImage: `url(${item.image})` }}
                    />
                  </a>
                ) : (
                  <div className={styles.mediaLink}>
                    <div
                      className={styles.media}
                      style={{ backgroundImage: `url(${item.image})` }}
                    />
                  </div>
                ))}
              <div className={styles.overlayCard}>
                <div className={styles.content}>
                  {item.eyebrow && <div className={styles.eyebrow}>{item.eyebrow}</div>}
                  {item.href ? (
                    <a href={item.href} className={styles.titleLink}>
                      <h3 className={styles.title}>{item.title}</h3>
                    </a>
                  ) : (
                    <h3 className={styles.title}>{item.title}</h3>
                  )}
                  {item.ctaLabel && (
                    <a href={item.href ?? '#'} className={styles.cta}>
                      {item.ctaLabel}
                    </a>
                  )}
                  {item.secondaryCtaLabel && item.secondaryHref && (
                    <div className={styles.secondaryBlock}>
                      <div className={styles.divider} />
                      <a href={item.secondaryHref} className={styles.secondaryCta}>
                        {item.secondaryCtaLabel}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
        {bannerImage?.src && (
          <div className={styles.banner}>
            <img className={styles.bannerImage} src={bannerImage.src} alt={bannerImage.alt ?? ''} />
          </div>
        )}
      </div>
    </section>
  )
}
