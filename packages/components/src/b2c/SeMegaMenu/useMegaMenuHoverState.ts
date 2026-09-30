import { useState } from 'react'

export type MegaMenuHoverState = {
  hoveredCategory: number | null
  hoveredSub: number
  handleCategoryHover: (index: number) => void
  handleCategoryLeave: () => void
  setHoveredSub: (index: number) => void
}

/**
 * Tracks which top-level menu item is hovered on desktop (opening its dropdown panel) and
 * which of that item's level-1 columns is active within the panel. Hovering a new top-level
 * item always resets the active column back to the first one, matching the original
 * mouseenter/mouseleave behavior.
 */
export function useMegaMenuHoverState(): MegaMenuHoverState {
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null)
  const [hoveredSub, setHoveredSub] = useState(0)

  const handleCategoryHover = (index: number) => {
    setHoveredCategory(index)
    setHoveredSub(0)
  }

  const handleCategoryLeave = () => setHoveredCategory(null)

  return { hoveredCategory, hoveredSub, handleCategoryHover, handleCategoryLeave, setHoveredSub }
}
