import type { ImageLoader } from './types'

export const DEFAULT_IMAGE_WIDTHS = [360, 768, 1200, 1920]

// Matches the aspect ratio of the original hardcoded 360x240 <img> so intrinsic
// width/height (used by browsers to reserve layout space and avoid shift) stay
// proportionate once the rendered width changes.
const ORIGINAL_ASPECT_RATIO = 240 / 360

export type ResponsiveImage = {
  src: string
  srcSet?: string
  width: number
  height: number
}

/**
 * Builds a `src`/`srcSet`/intrinsic `width`+`height` for a banner image by calling
 * `imageLoader` once per width in `widths`, instead of a single fixed-width request that
 * gets upscaled by the browser at larger viewports.
 *
 * Without an `imageLoader`, returns the original url unresized and no `srcSet` — behavior
 * is unchanged for consumers that don't pass one.
 */
export function buildResponsiveImage(
  src: string,
  imageLoader: ImageLoader | undefined,
  widths: number[] = DEFAULT_IMAGE_WIDTHS,
): ResponsiveImage {
  if (!imageLoader) {
    return { src, width: 360, height: 240 }
  }

  const maxWidth = Math.max(...widths)
  const height = Math.round(maxWidth * ORIGINAL_ASPECT_RATIO)
  const srcSet = widths.map((width) => `${imageLoader({ src, width })} ${width}w`).join(', ')

  return {
    src: imageLoader({ src, width: maxWidth }),
    srcSet,
    width: maxWidth,
    height,
  }
}
