import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { parseSeVideoHeroSource, seVideoHeroEmbedCommand, type SeVideoHeroSource } from './videoSource'

export type UseSeVideoHeroPlaybackOptions = {
  /** Start playing (muted) on mount. Defaults to `true`. */
  autoplay?: boolean
  /** The video: a file URL, or a Vimeo or YouTube link. */
  src?: string
  /** The cut for screens under 768px, in the same forms as `src`. */
  mobileSrc?: string
}

export type UseSeVideoHeroPlaybackResult = {
  videoRef: RefObject<HTMLVideoElement>
  iframeRef: RefObject<HTMLIFrameElement>
  isPlaying: boolean
  /** True when the visitor asked the OS for reduced motion: the video never autoplays. */
  prefersReducedMotion: boolean
  /** True under 768px, once mounted: picks an embed's mobile cut. */
  isMobile: boolean
  /** The source playing on this breakpoint. */
  active?: SeVideoHeroSource
  /** Both sources are files: one `<video>` switches between them with `<source media>`. */
  fileOnly: boolean
  /** The source on this breakpoint is a file, played in a `<video>`; otherwise it is an embed. */
  playsFile: boolean
  /** An embed is loaded with autoplay on: on mount unless reduced motion, or once the visitor presses play. */
  embedStarted: boolean
  /** Width over height of the embed's video, once its player reports it (Vimeo); 16:9 until then. */
  embedRatio: number
  /** Call from the iframe's `onLoad`: asks the player for the video's size. */
  onEmbedLoad: () => void
  toggle: () => void
}

const DEFAULT_EMBED_RATIO = 16 / 9
const VIMEO_ORIGIN = 'https://player.vimeo.com'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const MOBILE = '(max-width: 767px)'

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener?.('change', update)
    return () => list.removeEventListener?.('change', update)
  }, [query])
  return matches
}

/**
 * Play/pause state for a background hero video. Autoplay is muted (browsers block it
 * otherwise) and skipped under `prefers-reduced-motion`; `toggle` backs the visible
 * pause button that WCAG 2.2.2 asks for on motion longer than five seconds. A file plays
 * in a `<video>`; a Vimeo or YouTube embed is paused and resumed through its player API.
 */
export function useSeVideoHeroPlayback({ autoplay = true, src, mobileSrc }: UseSeVideoHeroPlaybackOptions = {}): UseSeVideoHeroPlaybackResult {
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION)
  const isMobile = useMediaQuery(MOBILE)
  const desktop = src ? parseSeVideoHeroSource(src) : undefined
  const mobile = mobileSrc ? parseSeVideoHeroSource(mobileSrc) : undefined
  // An embed has no <source media>: the mobile cut is picked once mounted.
  const active = isMobile && mobile ? mobile : desktop
  const fileOnly = (desktop?.kind ?? 'file') === 'file' && (mobile?.kind ?? 'file') === 'file'
  const playsFile = fileOnly || active?.kind === 'file'
  const kind = playsFile ? 'file' : active?.kind ?? 'file'
  const activeKey = active ? `${active.kind}:${active.id}` : undefined
  const willAutoplay = autoplay && !prefersReducedMotion
  const [isPlaying, setIsPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const embedStarted = willAutoplay || started
  const [embedRatio, setEmbedRatio] = useState(DEFAULT_EMBED_RATIO)

  // Vimeo reports the video's size on request; YouTube has no such message, so it stays 16:9.
  useEffect(() => {
    if (kind !== 'vimeo') {
      setEmbedRatio(DEFAULT_EMBED_RATIO)
      return
    }
    const size: { width?: number; height?: number } = {}
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== VIMEO_ORIGIN || event.source !== iframeRef.current?.contentWindow) return
      let data: { method?: string; value?: unknown }
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return
      }
      if (data?.method === 'getVideoWidth' && typeof data.value === 'number') size.width = data.value
      if (data?.method === 'getVideoHeight' && typeof data.value === 'number') size.height = data.value
      if (size.width && size.height) setEmbedRatio(size.width / size.height)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [kind, activeKey])

  const onEmbedLoad = useCallback(() => {
    if (kind !== 'vimeo') return
    for (const method of ['getVideoWidth', 'getVideoHeight']) {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ method }), VIMEO_ORIGIN)
    }
  }, [kind])

  useEffect(() => {
    if (kind !== 'file') {
      // The embed URL already carries autoplay; assume it took.
      setIsPlaying(willAutoplay)
      setStarted(false)
      return
    }
    const video = videoRef.current
    if (!video) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    if (willAutoplay) {
      video.muted = true
      video.play().catch(() => setIsPlaying(false))
    } else {
      video.pause()
    }
    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [willAutoplay, activeKey, kind])

  const toggle = useCallback(() => {
    if (kind !== 'file') {
      if (!embedStarted) {
        // Not loaded with autoplay yet (reduced motion): reload the embed with it on.
        setStarted(true)
        setIsPlaying(true)
        return
      }
      const command = seVideoHeroEmbedCommand(kind, !isPlaying)
      if (!command) return
      iframeRef.current?.contentWindow?.postMessage(command.message, command.origin)
      setIsPlaying(!isPlaying)
      return
    }
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.muted = true
      video.play().catch(() => setIsPlaying(false))
    } else {
      video.pause()
    }
  }, [kind, isPlaying, embedStarted])

  return { videoRef, iframeRef, isPlaying, prefersReducedMotion, isMobile, active, fileOnly, playsFile, embedStarted, embedRatio, onEmbedLoad, toggle }
}
