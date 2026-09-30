import type { SeHeroSectionBackgroundImage, SeHeroSectionCta } from '@vtex-us-se/components'
import styles from './SeHeroSection.module.scss'

export interface SeHeroSectionProps {
  title: string
  description: string
  backgroundImage?: SeHeroSectionBackgroundImage
  cta?: SeHeroSectionCta
  sectionId?: string
  className?: string
  testId?: string
}

export function SeHeroSection({
  title,
  description,
  backgroundImage,
  cta,
  sectionId,
  className,
  testId = 'se-hero-section',
}: SeHeroSectionProps) {
  const openInNewTab = Boolean(cta?.linkTargetBlank)
  const backgroundStyle = backgroundImage?.src
    ? {
        backgroundImage: `linear-gradient(0deg, rgba(10, 36, 64, 0.72), rgba(10, 36, 64, 0.72)), url(${backgroundImage.src})`,
      }
    : undefined

  return (
    <section
      className={[styles.heroSection, className].filter(Boolean).join(' ')}
      id={sectionId}
      style={backgroundStyle}
      data-testid={testId}
    >
      <div className={styles.row}>
        <div className={styles.headingColumn}>
          <h1 className={styles.title}>{title}</h1>
        </div>

        <div className={styles.contentColumn}>
          <div className={styles.divider} aria-hidden="true" />
          <p className={styles.description}>{description}</p>

          {cta?.text && cta?.href && (
            <a
              className={styles.button}
              href={cta.href}
              target={openInNewTab ? '_blank' : '_self'}
              rel={openInNewTab ? 'noopener noreferrer' : undefined}
            >
              {cta.text}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
