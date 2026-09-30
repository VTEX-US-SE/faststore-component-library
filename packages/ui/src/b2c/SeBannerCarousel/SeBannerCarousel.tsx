import { useMemo } from 'react'
import { useCarousel, useSwipeNavigation } from '@vtex-us-se/components'
import type { BannerCarouselSlide } from '@vtex-us-se/components'
import styles from './SeBannerCarousel.module.scss'
import { SeBannerCarouselRoot } from './SeBannerCarouselRoot'
import { SeBannerCarouselArrows, SeBannerCarouselDots } from './SeBannerCarouselControls'

export type SeBannerCarouselProps = {
  banners: BannerCarouselSlide[]
  autoplay?: boolean
  autoplayDelay?: number
  showNavigation?: boolean
  showPagination?: boolean
  className?: string
}

export function SeBannerCarousel(props: SeBannerCarouselProps) {
  const {
    banners,
    autoplay = true,
    autoplayDelay = 5000,
    showNavigation = true,
    showPagination = true,
    className,
  } = props

  const slides = useMemo(() => (banners ?? []).filter((banner) => Boolean(banner?.image)), [banners])

  const { activeIndex, goTo, goNext, goPrev, containerHandlers } = useCarousel({
    slideCount: slides.length,
    loop: slides.length > 1,
    autoplay: autoplay && slides.length > 1,
    autoplayDelay,
  })

  const swipeHandlers = useSwipeNavigation({ onSwipeLeft: goNext, onSwipeRight: goPrev })

  if (!slides.length) return null

  return (
    <section className={[styles.bannerCarousel, className].filter(Boolean).join(' ')}>
      <SeBannerCarouselRoot
        activeIndex={activeIndex}
        slideCount={slides.length}
        goTo={goTo}
        goNext={goNext}
        goPrev={goPrev}
        className={styles.viewport}
        {...containerHandlers}
        {...swipeHandlers}
      >
        <div
          className={styles.slides}
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide, index) => {
            const { image, imageMobile, alt, title, text, linkText, url } = slide

            const content = (
              <>
                <picture className={styles.media}>
                  {imageMobile && <source media="(max-width: 1023px)" srcSet={imageMobile} />}
                  <img
                    src={image}
                    alt={alt || title || `Banner ${index + 1}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </picture>

                {(title || text || (linkText && url)) && (
                  <div className={styles.overlay}>
                    {title && <h2 className={styles.title}>{title}</h2>}
                    {text && <p className={styles.text}>{text}</p>}
                    {linkText && url && <span className={styles.cta}>{linkText}</span>}
                  </div>
                )}
              </>
            )

            return (
              <div
                className={styles.slide}
                key={`${image}-${index}`}
                aria-hidden={index !== activeIndex}
              >
                {url ? (
                  <a href={url} className={styles.bannerLink}>
                    {content}
                  </a>
                ) : (
                  <div className={styles.bannerLink}>{content}</div>
                )}
              </div>
            )
          })}
        </div>
        {showNavigation && slides.length > 1 && <SeBannerCarouselArrows />}
        {showPagination && slides.length > 1 && <SeBannerCarouselDots />}
      </SeBannerCarouselRoot>
    </section>
  )
}
