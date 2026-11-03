export type SeVideoHeroVideo = {
  /** MP4 or WebM URL. Without it the hero shows the poster only. */
  src?: string
  /** Optional portrait cut for screens under 768px. Falls back to `src`. */
  mobileSrc?: string
  /** Image shown before the video plays, and instead of it under reduced motion. */
  poster?: string
  /** Text alternative describing the video, announced by screen readers. */
  alt?: string
}

export type SeVideoHeroLink = {
  text?: string
  url?: string
  linkTargetBlank?: boolean
}

export type SeVideoHeroAspectRatio = '16:9' | '21:9' | '4:3'

export type SeVideoHeroMobileAspectRatio = '2:3' | '9:16' | '1:1'

export type SeVideoHeroCaptionPosition = 'below' | 'overlay'
