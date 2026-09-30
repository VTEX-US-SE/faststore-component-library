import { forwardRef } from 'react'
import type { HTMLAttributes, Ref } from 'react'
import { CarouselContext } from '@vtex-us-se/components'
import type { CarouselContextValue } from '@vtex-us-se/components'

export interface SeBannerCarouselRootProps extends HTMLAttributes<HTMLDivElement> {
  testId?: string
  activeIndex: number
  slideCount: number
  goTo: (index: number) => void
  goNext: () => void
  goPrev: () => void
}

export const SeBannerCarouselRoot = forwardRef<HTMLDivElement, SeBannerCarouselRootProps>(
  function SeBannerCarouselRoot(
    { children, testId = 'se-banner-carousel', activeIndex, slideCount, goTo, goNext, goPrev, ...otherProps },
    ref,
  ) {
    const context: CarouselContextValue = { activeIndex, slideCount, goTo, goNext, goPrev }

    return (
      <CarouselContext.Provider value={context}>
        <div
          ref={ref as Ref<HTMLDivElement>}
          data-fs-banner-carousel-viewport
          data-testid={testId}
          role="region"
          aria-roledescription="carousel"
          {...otherProps}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  },
)
