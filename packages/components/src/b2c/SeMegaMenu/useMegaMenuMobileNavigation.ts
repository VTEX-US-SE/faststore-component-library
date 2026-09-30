import { useState } from 'react'
import type { MegaMenuMobilePanel } from './types'

export type MegaMenuMobileNavigationState = {
  isMenuOpen: boolean
  toggleMenu: () => void
  closeMenu: () => void
  /** Index into the root `menuItems` array. */
  selectedL1Category: number | null
  /** Index into the selected item's `level1` array. */
  selectedL2Category: number | null
  /** Index into the selected level-1 category's `level2` array. */
  selectedL3Category: number | null
  activePanel: MegaMenuMobilePanel
  openL1Category: (index: number) => void
  closeL1Category: () => void
  openL2Category: (index: number) => void
  closeL2Category: () => void
  openL3Category: (index: number) => void
  closeL3Category: () => void
}

/**
 * Drawer open/close state plus the three-level drill-down navigation for the mobile mega
 * menu. Naming mirrors the source implementation: `selectedL1Category` opens the panel
 * built from `MegaMenuItem.level1`, `selectedL2Category` (an index into that `level1` array)
 * opens the panel built from the selected category's `level2`, and `selectedL3Category` (an
 * index into that `level2` array) opens the leaf `level3` items. Closing the drawer always
 * resets the drill-down back to the main panel.
 */
export function useMegaMenuMobileNavigation(): MegaMenuMobileNavigationState {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedL1Category, setSelectedL1Category] = useState<number | null>(null)
  const [selectedL2Category, setSelectedL2Category] = useState<number | null>(null)
  const [selectedL3Category, setSelectedL3Category] = useState<number | null>(null)

  const resetDrillDown = () => {
    setSelectedL1Category(null)
    setSelectedL2Category(null)
    setSelectedL3Category(null)
  }

  const toggleMenu = () => {
    setIsMenuOpen((prev) => {
      const next = !prev
      if (!next) resetDrillDown()
      return next
    })
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
    resetDrillDown()
  }

  const openL1Category = (index: number) => {
    setSelectedL1Category(index)
    setSelectedL2Category(null)
    setSelectedL3Category(null)
  }
  const closeL1Category = () => setSelectedL1Category(null)

  const openL2Category = (index: number) => setSelectedL2Category(index)
  const closeL2Category = () => {
    setSelectedL2Category(null)
    setSelectedL3Category(null)
  }

  const openL3Category = (index: number) => setSelectedL3Category(index)
  const closeL3Category = () => setSelectedL3Category(null)

  const activePanel: MegaMenuMobilePanel =
    selectedL3Category !== null
      ? 'l3'
      : selectedL2Category !== null
        ? 'l2'
        : selectedL1Category !== null
          ? 'l1'
          : 'main'

  return {
    isMenuOpen,
    toggleMenu,
    closeMenu,
    selectedL1Category,
    selectedL2Category,
    selectedL3Category,
    activePanel,
    openL1Category,
    closeL1Category,
    openL2Category,
    closeL2Category,
    openL3Category,
    closeL3Category,
  }
}
