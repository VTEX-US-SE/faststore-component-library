export type ImageTile = {
  src: string
  url: string
  alt: string
  /** Caption title, shown when `captionPosition` is `below`. */
  title?: string
  /** Small label under the title, shown when `captionPosition` is `below`. Defaults to "See more". */
  linkLabel?: string
}

export type SeImageTilesCaptionPosition = 'none' | 'below'

export type SeImageTilesColumns = 2 | 3 | 4

export type SeImageTilesAspectRatio = '3:4' | '2:3' | '4:5' | '1:1'
