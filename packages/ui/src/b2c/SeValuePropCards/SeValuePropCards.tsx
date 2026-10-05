import { Icon } from '@faststore/ui'
import { useSeValuePropCardsFilter } from '@vtex-us-se/components'
import type { SeValuePropCardsItem } from '@vtex-us-se/components'
import styles from './SeValuePropCards.module.scss'

export interface SeValuePropCardsProps {
  cards?: SeValuePropCardsItem[]
  /** Current locale, used to evaluate each card's `languagesToShow`. */
  locale?: string
  /** Current customer class/cluster, used to evaluate each card's `clustersToShow`. */
  customerClass?: string
  /** Shows the card position as a small badge next to the title. */
  showIndexBadge?: boolean
  /** Accessible label for the section. */
  ariaLabel?: string
  className?: string
  testId?: string
}

export function SeValuePropCards({
  cards = [],
  locale,
  customerClass,
  showIndexBadge = false,
  ariaLabel,
  className,
  testId = 'se-value-prop-cards',
}: SeValuePropCardsProps) {
  const visibleCards = useSeValuePropCardsFilter(cards, { locale, customerClass })

  if (visibleCards.length === 0) return null

  return (
    <section
      className={[styles.valuePropCards, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      data-fs-value-prop-cards
      data-testid={testId}
    >
      <ul className={styles.list} data-fs-value-prop-cards-list>
        {visibleCards.map((card, index) => {
          const hasCta = Boolean(card.cta?.buttonText && card.cta?.link)

          return (
            <li
              className={styles.card}
              key={`${card.title ?? 'card'}-${index}`}
              data-fs-value-prop-card
              data-has-cta={hasCta}
            >
              {card.icon && (
                <img
                  className={styles.icon}
                  src={card.icon}
                  alt=""
                  loading="lazy"
                  data-fs-value-prop-card-icon
                />
              )}

              <div className={styles.info} data-fs-value-prop-card-info>
                {card.title && (
                  <h3 className={styles.title} data-fs-value-prop-card-title>
                    {card.title}
                    {showIndexBadge && (
                      <span className={styles.badge} aria-hidden data-fs-value-prop-card-badge>
                        {index}
                      </span>
                    )}
                  </h3>
                )}
                {card.description && (
                  <p className={styles.description} data-fs-value-prop-card-description>
                    {card.description}
                  </p>
                )}
              </div>

              {hasCta && (
                <div className={styles.cta} data-fs-value-prop-card-cta>
                  <a href={card.cta?.link}>{card.cta?.buttonText}</a>
                  <Icon name="ArrowRight" width={16} height={16} aria-hidden />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
