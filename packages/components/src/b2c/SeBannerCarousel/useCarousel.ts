import { useCallback, useEffect, useState } from 'react'

export type UseCarouselOptions = {
  /** Total number of slides. */
  slideCount: number
  /** Wrap around from the last slide to the first (and vice-versa). Defaults to `true`. */
  loop?: boolean
  /** Automatically advance to the next slide. Defaults to `false`. */
  autoplay?: boolean
  /** Milliseconds between automatic slide changes. Defaults to `5000`. */
  autoplayDelay?: number
  /** Pause autoplay while the pointer is over the carousel. Defaults to `true`. */
  pauseOnHover?: boolean
}

export type UseCarouselResult = {
  activeIndex: number
  goTo: (index: number) => void
  goNext: () => void
  goPrev: () => void
  isPaused: boolean
  containerHandlers: {
    onMouseEnter: () => void
    onMouseLeave: () => void
  }
}

/**
 * Slide-index state machine for a carousel: clamps/wraps navigation, and optionally
 * advances slides on an interval (paused on hover) — no DOM/animation library involved,
 * so any renderer (CSS transform track, opacity crossfade, etc.) can consume it.
 */
export function useCarousel(options: UseCarouselOptions): UseCarouselResult {
  const { slideCount, loop = true, autoplay = false, autoplayDelay = 5000, pauseOnHover = true } = options

  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const clampIndex = useCallback(
    (index: number) => {
      if (slideCount <= 0) return 0
      if (loop) return ((index % slideCount) + slideCount) % slideCount
      return Math.min(Math.max(index, 0), slideCount - 1)
    },
    [slideCount, loop],
  )

  // Keeps `activeIndex` in range if `slideCount` changes (e.g. CMS content updates).
  useEffect(() => {
    setActiveIndex((current) => clampIndex(current))
  }, [clampIndex])

  const goTo = useCallback((index: number) => setActiveIndex(clampIndex(index)), [clampIndex])
  const goNext = useCallback(() => setActiveIndex((current) => clampIndex(current + 1)), [clampIndex])
  const goPrev = useCallback(() => setActiveIndex((current) => clampIndex(current - 1)), [clampIndex])

  useEffect(() => {
    if (!autoplay || slideCount <= 1 || isPaused) return undefined

    const id = setInterval(() => {
      setActiveIndex((current) => clampIndex(current + 1))
    }, autoplayDelay)

    return () => clearInterval(id)
  }, [autoplay, autoplayDelay, slideCount, isPaused, clampIndex])

  const onMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true)
  }, [pauseOnHover])

  const onMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false)
  }, [pauseOnHover])

  return {
    activeIndex,
    goTo,
    goNext,
    goPrev,
    isPaused,
    containerHandlers: { onMouseEnter, onMouseLeave },
  }
}
