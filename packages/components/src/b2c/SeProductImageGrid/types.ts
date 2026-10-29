export type SeProductImageGridItem = {
  /** Catalog image URL or public path. Items without an image are skipped. */
  image: string
  /** Also used as the link label; falls back to "Product N". */
  alt?: string
  /** Product path, e.g. `/product-slug/p`. The tile is a link only when set. */
  link?: string
}

export type SeProductImageGridColumns = {
  /** Columns from 768px up. Defaults to 6. */
  desktop?: number
  /** Columns below 768px. Defaults to 4. */
  mobile?: number
}
