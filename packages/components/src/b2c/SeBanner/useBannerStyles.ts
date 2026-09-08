import type { CSSProperties } from 'react'
import { getImageUrl } from './getImageUrl'
import { useIsMobile } from './useIsMobile'
import {
  MobileOverlayTextPosition,
  OverlayTextPos,
  TextAlignment,
  TextPosition,
  type ImageUrl,
} from './types'

export type BannerStyleProps = {
  imageWithText: boolean
  isFullModeStyle: boolean
  textPosition: TextPosition
  overlayTextPos: OverlayTextPos
  textAlignment: TextAlignment
  image: ImageUrl
  uploadMobileImage?: ImageUrl
  mobileOverlayTextPos: MobileOverlayTextPosition
}

export type BannerStyles = {
  containerStyle: CSSProperties
  textContainerStyle: CSSProperties
  imagePositionStyle: CSSProperties
  textAlignmentStyle: CSSProperties
  mobileOverlayTextPosStyle: CSSProperties
}

export function useBannerStyles(props: BannerStyleProps): BannerStyles {
  const { isMobile } = useIsMobile()

  const getContainerStyle = (): CSSProperties => {
    const { imageWithText, isFullModeStyle, image, uploadMobileImage } = props
    if (!isFullModeStyle) return {}

    if (imageWithText) {
      return { width: '100%', height: 'auto', cursor: 'pointer' }
    }

    const finalImageUrl = getImageUrl(isMobile, image, uploadMobileImage)
    return {
      backgroundImage: `url(${finalImageUrl?.src ?? ''})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
    }
  }

  const getTextContainerStyle = (): CSSProperties => {
    const { textPosition, isFullModeStyle } = props
    const baseStyles: CSSProperties = {
      flexDirection: 'column',
      ...(isMobile || isFullModeStyle ? {} : { position: 'absolute' as const, width: '50%' }),
    }
    const textContainerStyles: Record<TextPosition, CSSProperties> = {
      [TextPosition.LEFT]: { ...baseStyles, left: 0, right: '50%', alignItems: 'flex-start' },
      [TextPosition.CENTER]: { ...baseStyles, left: 0, right: '50%', alignItems: 'center' },
      [TextPosition.RIGHT]: { ...baseStyles, left: '50%', right: 0, alignItems: 'flex-end' },
    }
    return textContainerStyles[textPosition] ?? {}
  }

  const getImagePositionStyle = (): CSSProperties => {
    const { textPosition, isFullModeStyle } = props
    if (isFullModeStyle) return {}

    const imagePositionStyles: Record<TextPosition, CSSProperties> = {
      [TextPosition.LEFT]: { left: '50%' },
      [TextPosition.CENTER]: { left: '50%' },
      [TextPosition.RIGHT]: { right: '50%' },
    }
    return imagePositionStyles[textPosition] ?? {}
  }

  const getTextAlignmentStyle = (): CSSProperties => {
    const { textAlignment, overlayTextPos, isFullModeStyle } = props
    const commonStyles: CSSProperties = {
      padding: isMobile ? '0 1.5rem' : '0 5rem',
      flexDirection: 'column',
    }
    const textAlignmentStyles: Record<TextAlignment, CSSProperties> = {
      [TextAlignment.LEFT]: { alignItems: 'flex-start' },
      [TextAlignment.CENTER]: { alignItems: 'center', textAlign: 'center' },
      [TextAlignment.RIGHT]: { alignItems: 'flex-end', textAlign: 'right' },
    }
    const resolved = isFullModeStyle ? overlayTextPos : textAlignment
    return { ...commonStyles, ...(textAlignmentStyles[resolved as TextAlignment] ?? {}) }
  }

  const getMobileOverlayTextPosStyle = (): CSSProperties => {
    const { isFullModeStyle, mobileOverlayTextPos } = props
    if (!isMobile) return {}

    const MOBILE_OVERLAY_TEXT_STYLES: Record<
      MobileOverlayTextPosition,
      { fullmodeActive: CSSProperties; fullmodeOff: CSSProperties }
    > = {
      [MobileOverlayTextPosition.TOP]: {
        fullmodeActive: { display: 'flex', alignItems: 'flex-start' },
        fullmodeOff: { flexDirection: 'column' },
      },
      [MobileOverlayTextPosition.BOTTOM]: {
        fullmodeActive: { display: 'flex', alignItems: 'flex-end' },
        fullmodeOff: { flexDirection: 'column-reverse' },
      },
    }
    const styleType = isFullModeStyle ? 'fullmodeActive' : 'fullmodeOff'
    return MOBILE_OVERLAY_TEXT_STYLES[mobileOverlayTextPos]?.[styleType] ?? {}
  }

  return {
    containerStyle: getContainerStyle(),
    textContainerStyle: getTextContainerStyle(),
    imagePositionStyle: getImagePositionStyle(),
    textAlignmentStyle: getTextAlignmentStyle(),
    mobileOverlayTextPosStyle: getMobileOverlayTextPosStyle(),
  }
}
