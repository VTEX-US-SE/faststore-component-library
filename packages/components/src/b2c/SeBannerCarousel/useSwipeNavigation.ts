import { useCallback, useRef } from 'react'
import type { TouchEvent } from 'react'

export type UseSwipeNavigationOptions = {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  /** Minimum horizontal drag distance (px) to register as a swipe. Defaults to `40`. */
  threshold?: number
}

export type SwipeHandlers = {
  onTouchStart: (event: TouchEvent) => void
  onTouchMove: (event: TouchEvent) => void
  onTouchEnd: () => void
}

/**
 * Touch-swipe gesture recognizer for a carousel, framework/library-free (no Swiper/Hammer).
 * Tracks the horizontal delta between touchstart and touchend and fires the matching
 * callback once it crosses `threshold`.
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 40,
}: UseSwipeNavigationOptions): SwipeHandlers {
  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)

  const onTouchStart = useCallback((event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
    touchDeltaX.current = 0
  }, [])

  const onTouchMove = useCallback((event: TouchEvent) => {
    if (touchStartX.current === null) return
    const currentX = event.touches[0]?.clientX ?? touchStartX.current
    touchDeltaX.current = currentX - touchStartX.current
  }, [])

  const onTouchEnd = useCallback(() => {
    if (Math.abs(touchDeltaX.current) >= threshold) {
      if (touchDeltaX.current < 0) {
        onSwipeLeft()
      } else {
        onSwipeRight()
      }
    }
    touchStartX.current = null
    touchDeltaX.current = 0
  }, [threshold, onSwipeLeft, onSwipeRight])

  return { onTouchStart, onTouchMove, onTouchEnd }
}
