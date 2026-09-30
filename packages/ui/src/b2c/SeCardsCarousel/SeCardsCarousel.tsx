import { useCardsCarouselLayout } from '@vtex-us-se/components'
import type { CardsCarouselItem } from '@vtex-us-se/components'
import styles from './SeCardsCarousel.module.scss'

export type SeCardsCarouselProps = {
  title: string
  banners: CardsCarouselItem[]
  className?: string
}

export function SeCardsCarousel(props: SeCardsCarouselProps) {
  const { title, banners, className } = props
  const { isCentered } = useCardsCarouselLayout(banners?.length ?? 0)

  if (!banners?.length) return null

  return (
    <section className={[styles.section, className].filter(Boolean).join(' ')}>
      <h2 className={styles.heading}>{title}</h2>
      <div className={isCentered ? styles.centered : styles.carousel}>
        {banners.map((banner) => {
          const { image, title: cardTitle, description, button, link } = banner

          return (
            <div
              className={styles.card}
              key={cardTitle}
              style={{ backgroundImage: `url(${image})` }}
            >
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{cardTitle}</h3>
                <p className={styles.cardDescription}>{description}</p>
                {button && link && (
                  <a href={link} className={styles.button}>
                    {button}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
