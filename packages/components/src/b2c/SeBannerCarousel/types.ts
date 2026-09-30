export type BannerCarouselSlide = {
  image: string
  imageMobile?: string
  alt?: string
  title?: string
  text?: string
  linkText?: string
  url?: string
}

export type CarouselContextValue = {
  activeIndex: number
  slideCount: number
  goTo: (index: number) => void
  goNext: () => void
  goPrev: () => void
}
