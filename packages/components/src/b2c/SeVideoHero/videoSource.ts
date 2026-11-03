export type SeVideoHeroSourceKind = 'file' | 'vimeo' | 'youtube'

export type SeVideoHeroSource = {
  kind: SeVideoHeroSourceKind
  /** The URL as given, for a file; the video id, for an embed. */
  id: string
  /** Vimeo's privacy hash of an unlisted video (`vimeo.com/<id>/<hash>`). */
  hash?: string
}

export type SeVideoHeroEmbedOptions = {
  autoplay: boolean
  loop: boolean
}

const YOUTUBE_ID = /^[\w-]{11}$/

/**
 * Tells a direct video file from a Vimeo or YouTube page, share, or embed link. Anything that is
 * not one of those hosts is treated as a file URL for a `<video>` element.
 */
export function parseSeVideoHeroSource(src: string): SeVideoHeroSource {
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return { kind: 'file', id: src }
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, '')
  const parts = url.pathname.split('/').filter(Boolean)

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const at = parts.findIndex((part) => /^\d+$/.test(part))
    const id = parts[at]
    if (id) {
      const next = parts[at + 1]
      const hash = url.searchParams.get('h') ?? (next && /^[\da-f]+$/i.test(next) ? next : undefined)
      return { kind: 'vimeo', id, hash }
    }
  }

  const [first = '', second] = parts
  if (host === 'youtu.be' && YOUTUBE_ID.test(first)) return { kind: 'youtube', id: first }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const id = url.searchParams.get('v') ?? (['embed', 'shorts', 'live'].includes(first) ? second : undefined)
    if (id && YOUTUBE_ID.test(id)) return { kind: 'youtube', id }
  }

  return { kind: 'file', id: src }
}

/** The background-mode player URL of an embed: muted, no controls or branding, autoplay and loop as asked. */
export function seVideoHeroEmbedUrl(source: SeVideoHeroSource, { autoplay, loop }: SeVideoHeroEmbedOptions): string | undefined {
  const flag = (value: boolean) => (value ? '1' : '0')
  if (source.kind === 'vimeo') {
    const params = new URLSearchParams({ background: '1', autoplay: flag(autoplay), loop: flag(loop), muted: '1', autopause: '0', dnt: '1' })
    if (source.hash) params.set('h', source.hash)
    return `https://player.vimeo.com/video/${source.id}?${params}`
  }
  if (source.kind === 'youtube') {
    const params = new URLSearchParams({
      autoplay: flag(autoplay),
      mute: '1',
      controls: '0',
      playsinline: '1',
      rel: '0',
      disablekb: '1',
      iv_load_policy: '3',
      enablejsapi: '1',
    })
    // YouTube loops a single video only as a one-item playlist.
    if (loop) {
      params.set('loop', '1')
      params.set('playlist', source.id)
    }
    return `https://www.youtube-nocookie.com/embed/${source.id}?${params}`
  }
  return undefined
}

/** The origin and message that pause or play an embed through its player's postMessage API. */
export function seVideoHeroEmbedCommand(kind: SeVideoHeroSourceKind, play: boolean): { origin: string; message: string } | undefined {
  if (kind === 'vimeo') return { origin: 'https://player.vimeo.com', message: JSON.stringify({ method: play ? 'play' : 'pause' }) }
  if (kind === 'youtube') {
    return { origin: 'https://www.youtube-nocookie.com', message: JSON.stringify({ event: 'command', func: play ? 'playVideo' : 'pauseVideo', args: [] }) }
  }
  return undefined
}
