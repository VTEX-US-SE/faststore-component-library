import { useEffect } from 'react'

const HAMBURGER_BUTTON_SELECTOR = '[data-fs-navbar-button-menu]'

/**
 * Wires the mobile mega menu's open state to FastStore's own navbar hamburger button, which
 * renders outside this component's tree and isn't reachable through props or context. Mirrors
 * the original implementation's direct `document.querySelector` wiring — this button is a
 * fixed FastStore convention (`data-fs-navbar-button-menu`), not something this component owns.
 *
 * `onTrigger` is only read on mount: pass a stable callback (e.g. the `toggleMenu` returned by
 * `useMegaMenuMobileNavigation`, which is safe to capture once since it only uses functional
 * `setState` updates internally).
 */
export function useNavbarHamburgerTrigger(onTrigger: () => void): void {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      event.stopPropagation()
      onTrigger()
    }

    const hamburgerButton = document.querySelector<HTMLButtonElement>(HAMBURGER_BUTTON_SELECTOR)
    hamburgerButton?.addEventListener('click', handleClick)

    return () => {
      hamburgerButton?.removeEventListener('click', handleClick)
    }
  }, [])
}
