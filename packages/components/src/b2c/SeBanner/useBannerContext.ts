import { createContext, useContext } from 'react'
import type { BannerContextValue } from './types'

export const BannerContext = createContext<BannerContextValue | undefined>(undefined)

export function useBannerContext(): BannerContextValue {
  const context = useContext(BannerContext)
  if (context === undefined) {
    throw new Error('useBannerContext must be used within a SeBanner root element.')
  }
  return context
}
