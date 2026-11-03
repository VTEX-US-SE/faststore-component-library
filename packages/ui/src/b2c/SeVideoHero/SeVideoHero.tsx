import { Icon } from '@faststore/ui'
import { useSeVideoHeroPlayback } from '@vtex-us-se/components'
import type {
  SeVideoHeroAspectRatio,
  SeVideoHeroCaptionPosition,
  SeVideoHeroLink,
  SeVideoHeroMobileAspectRatio,
  SeVideoHeroVideo,
} from '@vtex-us-se/components'
import styles from './SeVideoHero.module.scss'

export interface SeVideoHeroProps {
  /** The background video. Without `src` the hero shows its poster as a still image. */
  video?: SeVideoHeroVideo
  title?: string
  subtitle?: string
  /** Arrow link in the caption bar; the whole media area links to it too. */
  link?: SeVideoHeroLink
  /** Media aspect ratio from 768px up, width:height. */
  aspectRatio?: SeVideoHeroAspectRatio
  /** Media aspect ratio below 768px. */
  mobileAspectRatio?: SeVideoHeroMobileAspectRatio
  /** Caption bar below the video, or laid over its bottom edge. */
  captionPosition?: SeVideoHeroCaptionPosition
  /** Start playing muted on load. Never autoplays under reduced motion. */
  autoplay?: boolean
  loop?: boolean
  /** Labels of the pause/play button. */
  pauseLabel?: string
  playLabel?: string
  className?: string
  testId?: string
}

const PauseGlyph = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden focusable="false">
    <rect x="6" y="5" width="4" height="14" fill="currentColor" />
    <rect x="14" y="5" width="4" height="14" fill="currentColor" />
  </svg>
)

const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden focusable="false">
    <path d="M7 5v14l12-7z" fill="currentColor" />
  </svg>
)

export function SeVideoHero({
  video,
  title,
  subtitle,
  link,
  aspectRatio = '16:9',
  mobileAspectRatio = '2:3',
  captionPosition = 'below',
  autoplay = true,
  loop = true,
  pauseLabel = 'Pause video',
  playLabel = 'Play video',
  className,
  testId = 'se-video-hero',
}: SeVideoHeroProps) {
  const src = video?.src
  const { videoRef, isPlaying, toggle } = useSeVideoHeroPlayback({ autoplay, src })
  const poster = video?.poster

  if (!src && !poster) return null

  const target = link?.linkTargetBlank ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  const media = src ? (
    <video
      ref={videoRef}
      className={styles.media}
      poster={poster}
      muted
      loop={loop}
      playsInline
      preload="metadata"
      aria-label={video?.alt}
      data-fs-video-hero-video
      key={src}
    >
      {video?.mobileSrc && <source src={video.mobileSrc} media="(max-width: 767px)" />}
      <source src={src} />
    </video>
  ) : (
    <img className={styles.media} src={poster} alt={video?.alt ?? ''} data-fs-video-hero-poster />
  )

  return (
    <section
      className={[styles.videoHero, className].filter(Boolean).join(' ')}
      aria-label={title || video?.alt || 'Featured video'}
      data-fs-video-hero
      data-aspect-ratio={aspectRatio}
      data-mobile-aspect-ratio={mobileAspectRatio}
      data-caption-position={captionPosition}
      data-testid={testId}
    >
      <div className={styles.frame} data-fs-video-hero-frame>
        {link?.url ? (
          <a className={styles.mediaLink} href={link.url} tabIndex={-1} aria-hidden {...target}>
            {media}
          </a>
        ) : (
          media
        )}
        {src && (
          <button
            type="button"
            className={styles.toggle}
            onClick={toggle}
            aria-label={isPlaying ? pauseLabel : playLabel}
            aria-pressed={!isPlaying}
            data-fs-video-hero-toggle
          >
            {isPlaying ? <PauseGlyph /> : <PlayGlyph />}
          </button>
        )}
      </div>
      {(title || link?.text) && (
        <div className={styles.caption} data-fs-video-hero-caption>
          <div className={styles.heading}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {link?.url && (
            <a className={styles.cta} href={link.url} {...target} data-fs-video-hero-link>
              {link.text && <span>{link.text}</span>}
              <Icon name="ArrowRight" width={20} height={20} aria-hidden />
            </a>
          )}
        </div>
      )}
    </section>
  )
}
