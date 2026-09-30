import { useEffect } from 'react'

/**
 * Accessibility addition not present in the original implementations: closes the mobile mega
 * menu drawer when the user presses Escape, matching standard disclosure-widget behavior.
 */
export function useCloseMenuOnEscape(isOpen: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])
}
