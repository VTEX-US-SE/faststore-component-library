import { useSyncExternalStore } from 'react'

const MOBILE_MEDIA_QUERY = '(max-width: 768px)'

function subscribe(callback: () => void) {
  const mql = window.matchMedia(MOBILE_MEDIA_QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

// Server renders as "desktop" (false) rather than guessing "mobile" — avoids the
// mount-time flash the original implementation had from defaulting to `true`.
function getServerSnapshot() {
  return false
}

export function useIsMobile(): { isMobile: boolean } {
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return { isMobile }
}
