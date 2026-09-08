import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'

export interface SeBannerImageProps extends HTMLAttributes<HTMLDivElement> {
  testId?: string
}

export const SeBannerImage = forwardRef<HTMLDivElement, SeBannerImageProps>(
  function SeBannerImage({ children, testId = 'se-banner-image', ...otherProps }, ref) {
    return (
      <div ref={ref} data-fs-hero-image data-testid={testId} {...otherProps}>
        {children}
      </div>
    )
  },
)
