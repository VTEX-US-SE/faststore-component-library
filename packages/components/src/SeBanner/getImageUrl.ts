import type { ImageUrl } from './types'

export function getImageUrl(
  isMobile: boolean,
  image: ImageUrl,
  mobileImage?: ImageUrl,
): ImageUrl {
  return mobileImage && isMobile ? mobileImage : image
}
