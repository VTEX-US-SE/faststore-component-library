import { createContext, useContext } from 'react'
import type { CarouselContextValue } from './types'

export const CarouselContext = createContext<CarouselContextValue | undefined>(undefined)

export function useCarouselContext(): CarouselContextValue {
  const context = useContext(CarouselContext)
  if (context === undefined) {
    throw new Error('useCarouselContext must be used within a SeBannerCarousel root element.')
  }
  return context
}
