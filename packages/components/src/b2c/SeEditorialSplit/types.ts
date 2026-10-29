export type SeEditorialSplitItem = {
  /** Public path or absolute URL. Items without an image are skipped. */
  image: string
  alt?: string
  /** Caption. Without it the caption is hidden. */
  title?: string
  /** Wraps image and caption. The arrow icon shows only with a link. */
  link?: string
}

export type SeEditorialSplitColumns = 1 | 2 | 3

export type SeEditorialSplitAspectRatio = '3:4' | '4:5' | '1:1'

export type SeEditorialSplitCaptionPosition = 'below' | 'overlay'
