export type SeGridContentImage = {
  src: string
  alt?: string
}

export type SeGridContentItem = {
  title: string
  eyebrow?: string
  image?: string
  href?: string
  ctaLabel?: string
  secondaryHref?: string
  secondaryCtaLabel?: string
}

export type SeGridContentColumns = 1 | 2 | 3 | 4

/**
 * `overlay` (default): tall cards with the content in a colored box over the image.
 * `caption-below`: the image keeps its aspect ratio and the content sits under it.
 */
export type SeGridContentVariant = 'overlay' | 'caption-below'
