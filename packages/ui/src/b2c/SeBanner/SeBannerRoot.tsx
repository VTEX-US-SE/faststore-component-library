import { forwardRef } from 'react'
import type { HTMLAttributes, Ref } from 'react'
import { BannerContext } from '@vtex-us-se/components'

export interface SeBannerRootTextImage {
  src: string
  alt: string
  srcSet?: string
  width?: number
  height?: number
}

export interface SeBannerRootProps extends HTMLAttributes<HTMLElement> {
  variant?: 'primary' | 'secondary'
  colorVariant?: 'main' | 'light' | 'accent'
  testId?: string
  imageWithText?: boolean
  textImage?: SeBannerRootTextImage
  isFullModeStyle?: boolean
  link?: { url?: string; linkTargetBlank?: boolean }
}

export const SeBannerRoot = forwardRef<
  HTMLElement | HTMLAnchorElement | HTMLImageElement,
  SeBannerRootProps
>(function SeBannerRoot(
  {
    children,
    testId = 'se-banner',
    variant = 'primary',
    colorVariant = 'main',
    textImage,
    isFullModeStyle,
    imageWithText,
    link,
    ...otherProps
  },
  ref,
) {
  const context = { variant, colorVariant }
  const dataAttrs = {
    'data-fs-hero': true,
    'data-fs-hero-variant': variant,
    'data-fs-hero-color-variant': colorVariant,
    'data-testid': testId,
  } as const

  if (imageWithText && isFullModeStyle) {
    return (
      <BannerContext.Provider value={context}>
        {link?.url ? (
          <a
            ref={ref as Ref<HTMLAnchorElement>}
            href={link.url}
            target={link.linkTargetBlank ? '_blank' : undefined}
            rel={link.linkTargetBlank ? 'noopener noreferrer' : undefined}
            {...dataAttrs}
            {...otherProps}
          >
            <img
              alt={textImage?.alt ?? ''}
              src={textImage?.src ?? ''}
              srcSet={textImage?.srcSet}
              sizes={textImage?.srcSet ? '100vw' : undefined}
              width={textImage?.width}
              height={textImage?.height}
            />
          </a>
        ) : (
          <img
            ref={ref as Ref<HTMLImageElement>}
            {...dataAttrs}
            {...otherProps}
            alt={textImage?.alt ?? ''}
            src={textImage?.src ?? ''}
            srcSet={textImage?.srcSet}
            sizes={textImage?.srcSet ? '100vw' : undefined}
            width={textImage?.width}
            height={textImage?.height}
          />
        )}
      </BannerContext.Provider>
    )
  }

  return (
    <BannerContext.Provider value={context}>
      <article ref={ref as Ref<HTMLElement>} {...dataAttrs} {...otherProps}>
        {children}
      </article>
    </BannerContext.Provider>
  )
})
