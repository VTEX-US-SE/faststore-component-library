import type { SeGridContentImage, SeGridContentItem } from '@vtex-us-se/components'
import styles from './SeGridContent.module.scss'

export interface SeGridContentProps {
  bannerImage?: SeGridContentImage
  items?: SeGridContentItem[]
  className?: string
  testId?: string
}

export function SeGridContent({
  bannerImage,
  items = [],
  className,
  testId = 'se-grid-content',
}: SeGridContentProps) {
  return (
    <section
      className={[styles.gridContent, className].filter(Boolean).join(' ')}
      data-testid={testId}
    >
      <div className={styles.container}>
        <div className={styles.grid}>
          {items.map((item, idx) => (
            <article key={item.href ?? `${item.title}-${idx}`} className={styles.card}>
              {item.image &&
                (item.href ? (
                  <a href={item.href} className={styles.mediaLink}>
                    <div
                      className={styles.media}
                      style={{ backgroundImage: `url(${item.image})` }}
                    />
                  </a>
                ) : (
                  <div className={styles.media} style={{ backgroundImage: `url(${item.image})` }} />
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
