import type { ReactNode } from 'react'
import type { HeroProps, HeroHeaderProps } from '@faststore/ui'
import {
  getImageUrl,
  useBannerStyles,
  useIsMobile,
  type ImageLoader,
  type ImageUrl,
  type MobileOverlayTextPosition,
  type OverlayTextPos,
  type TextAlignment,
  type TextPosition,
} from '@vtex-us-se/components'
import styles from './SeBanner.module.scss'
import { SeBannerImage } from './SeBannerImage'
import { SeBannerHeader } from './SeBannerHeader'
import { SeBannerRoot } from './SeBannerRoot'

export type SeBannerProps = {
  isFullModeStyle: boolean
  textPosition: TextPosition
  overlayTextPos: OverlayTextPos
  textAlignment: TextAlignment
  textMode: 'html'
  uploadMobileImage?: ImageUrl
  mobileOverlayTextPos: MobileOverlayTextPosition
  title: HeroHeaderProps['title']
  subtitle?: HeroHeaderProps['subtitle']
  link?: {
    show: boolean
    text: string
    url: string
    linkTargetBlank: boolean
  }
  image: ImageUrl
  variant?: HeroProps['variant']
  colorVariant?: HeroProps['colorVariant']
  icon?: ReactNode
  imageLoader?: ImageLoader
  className?: string
}

export function SeBanner(props: SeBannerProps) {
  const {
    isFullModeStyle,
    textPosition,
    textAlignment,
    overlayTextPos,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    textMode,
    mobileOverlayTextPos,
    link,
    title,
    subtitle,
    image,
    variant,
    uploadMobileImage,
    colorVariant,
    icon,
    imageLoader,
    className,
    ...rest
  } = props

  const bannerStyles = useBannerStyles({
    imageWithText: !link?.show,
    isFullModeStyle,
    textPosition,
    overlayTextPos,
    textAlignment,
    image,
    uploadMobileImage,
    mobileOverlayTextPos,
  })

  const { isMobile } = useIsMobile()
  const finalImageUrl = getImageUrl(isMobile, image, uploadMobileImage)
  const resolvedSrc = imageLoader
    ? imageLoader({ src: finalImageUrl?.src ?? '', width: 360 })
    : finalImageUrl?.src ?? ''

  return (
    <section className={[styles.banner, className].filter(Boolean).join(' ')}>
      <SeBannerRoot
        variant={variant ?? 'primary'}
        colorVariant={colorVariant ?? 'main'}
        textImage={{ src: resolvedSrc, alt: finalImageUrl?.alt ?? '' }}
        imageWithText={!link?.show}
        isFullModeStyle={isFullModeStyle}
        link={link?.show ? undefined : { url: link?.url, linkTargetBlank: link?.linkTargetBlank }}
        style={{
          ...bannerStyles?.containerStyle,
          ...bannerStyles?.mobileOverlayTextPosStyle,
          ...(!isFullModeStyle && { minHeight: '29rem' }),
        }}
      >
        {(link?.show || !isFullModeStyle) && (
          <SeBannerHeader
            title={title}
            subtitle={subtitle}
            link={link?.url}
            ctaText={link?.text}
            linkTargetBlank={link?.linkTargetBlank}
            icon={icon}
            textContainerStyle={bannerStyles?.textContainerStyle}
            textAlignmentStyle={bannerStyles?.textAlignmentStyle}
            style={{
              ...(isMobile && Boolean(isFullModeStyle) && bannerStyles.mobileOverlayTextPosStyle),
            }}
            {...rest}
          />
        )}
        {!isFullModeStyle && (
          <SeBannerImage style={bannerStyles?.imagePositionStyle}>
            <img
              loading="eager"
              src={resolvedSrc}
              alt={finalImageUrl?.alt ?? ''}
              width={360}
              height={240}
              sizes="(max-width: 360px) 50vw, (max-width: 768px) 90vw, 50vw"
            />
          </SeBannerImage>
        )}
      </SeBannerRoot>
    </section>
  )
}
