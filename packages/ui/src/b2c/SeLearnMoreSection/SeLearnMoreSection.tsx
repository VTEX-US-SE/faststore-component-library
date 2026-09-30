import type { SeLearnMoreSectionBlurb, SeLearnMoreSectionImage } from '@vtex-us-se/components'
import styles from './SeLearnMoreSection.module.scss'

export interface SeLearnMoreSectionProps {
  eyebrow?: string
  heading: string
  description?: string
  blurbs?: SeLearnMoreSectionBlurb[]
  image?: SeLearnMoreSectionImage
  sectionId?: string
  className?: string
  testId?: string
}

export function SeLearnMoreSection({
  eyebrow,
  heading,
  description,
  blurbs = [],
  image,
  sectionId,
  className,
  testId = 'se-learn-more-section',
}: SeLearnMoreSectionProps) {
  return (
    <section
      className={[styles.learnMoreSection, className].filter(Boolean).join(' ')}
      id={sectionId}
      data-testid={testId}
    >
      <div className={styles.row}>
        <div className={styles.leftColumn}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h2 className={styles.heading}>{heading}</h2>
          {description && <p className={styles.description}>{description}</p>}

          {blurbs.length > 0 && (
            <div className={styles.blurbs}>
              {blurbs.map((blurb, idx) => (
                <div className={styles.blurb} key={`${blurb.title}-${idx}`}>
                  {blurb.icon && (
                    <div className={styles.icon} aria-hidden>
                      {blurb.icon}
                    </div>
                  )}
                  <div className={styles.blurbContent}>
                    <h3 className={styles.blurbTitle}>{blurb.title}</h3>
                    <p className={styles.blurbDescription}>{blurb.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.rightColumn}>
          {image?.src && <img className={styles.image} src={image.src} alt={image.alt ?? ''} />}
        </div>
      </div>
    </section>
  )
}
