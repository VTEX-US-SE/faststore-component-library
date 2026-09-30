import { Icon } from '@faststore/ui'
import { useCarouselContext } from '@vtex-us-se/components'

export interface SeBannerCarouselArrowsProps {
  testId?: string
}

export function SeBannerCarouselArrows({ testId = 'se-banner-carousel-arrows' }: SeBannerCarouselArrowsProps) {
  const { goPrev, goNext } = useCarouselContext()

  return (
    <div data-fs-banner-carousel-arrows data-testid={testId}>
      <button
        type="button"
        aria-label="Previous slide"
        data-fs-banner-carousel-arrow="prev"
        onClick={goPrev}
      >
        <Icon name="ArrowLeft" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        data-fs-banner-carousel-arrow="next"
        onClick={goNext}
      >
        <Icon name="ArrowRight" />
      </button>
    </div>
  )
}

export interface SeBannerCarouselDotsProps {
  testId?: string
}

export function SeBannerCarouselDots({ testId = 'se-banner-carousel-dots' }: SeBannerCarouselDotsProps) {
  const { activeIndex, slideCount, goTo } = useCarouselContext()

  return (
    <div data-fs-banner-carousel-dots data-testid={testId} role="tablist">
      {Array.from({ length: slideCount }, (_, index) => (
        <button
          key={index}
          type="button"
          role="tab"
          aria-label={`Go to slide ${index + 1}`}
          aria-selected={index === activeIndex}
          data-fs-banner-carousel-dot
          data-active={index === activeIndex ? '' : undefined}
          onClick={() => goTo(index)}
        />
      ))}
    </div>
  )
}
