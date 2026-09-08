export enum TextPosition {
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center',
}

export enum OverlayTextPos {
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center',
}

export enum TextAlignment {
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center',
}

export enum MobileOverlayTextPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
}

export type ImageUrl = {
  src: string
  alt: string
}

export type BannerContextValue = {
  variant: 'primary' | 'secondary'
  colorVariant: 'main' | 'light' | 'accent'
}

export type ImageLoaderParams = {
  src: string
  width: number
  quality?: number
}

export type ImageLoader = (params: ImageLoaderParams) => string
