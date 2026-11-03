import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export type UseSeVideoHeroPlaybackOptions = {
  /** Start playing (muted) on mount. Defaults to `true`. */
  autoplay?: boolean
  /** The current video URL: playback restarts when it changes. */
  src?: string
}

export type UseSeVideoHeroPlaybackResult = {
  videoRef: RefObject<HTMLVideoElement>
  isPlaying: boolean
  /** True when the visitor asked the OS for reduced motion: the video never autoplays. */
  prefersReducedMotion: boolean
  toggle: () => void
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/**
 * Play/pause state for a background hero video. Autoplay is muted (browsers block it
 * otherwise) and skipped under `prefers-reduced-motion`; `toggle` backs the visible
 * pause button that WCAG 2.2.2 asks for on motion longer than five seconds.
 */
export function useSeVideoHeroPlayback({ autoplay = true, src }: UseSeVideoHeroPlaybackOptions = {}): UseSeVideoHeroPlaybackResult {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const query = window.matchMedia(REDUCED_MOTION)
    const update = () => setPrefersReducedMotion(query.matches)
    update()
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    if (autoplay && !prefersReducedMotion) {
      video.muted = true
      video.play().catch(() => setIsPlaying(false))
    } else {
      video.pause()
    }
    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [autoplay, prefersReducedMotion, src])

  const toggle = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.muted = true
      video.play().catch(() => setIsPlaying(false))
    } else {
      video.pause()
    }
  }, [])

  return { videoRef, isPlaying, prefersReducedMotion, toggle }
}
