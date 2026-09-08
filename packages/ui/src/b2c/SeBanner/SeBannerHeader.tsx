import { forwardRef } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { LinkButton, Icon } from '@faststore/ui'
import { useBannerContext, useSanitizedHtml } from '@vtex-us-se/components'

const ALLOWED_TAGS = ['p', 'span', 'a', 'div', 'br']
const ALLOWED_ATTRS = {
  a: ['class', 'href', 'title', 'target'],
  span: ['class'],
  p: ['class'],
  div: ['class'],
}

export interface SeBannerHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  icon?: ReactNode
  link?: string
  ctaText?: string
  testId?: string
  linkTargetBlank?: boolean
  textContainerStyle?: CSSProperties
  textAlignmentStyle?: CSSProperties
}

function SanitizedTitle({ content }: { content: string }) {
  const html = useSanitizedHtml(content, { allowedTags: ALLOWED_TAGS, allowedAttributes: ALLOWED_ATTRS })
  if (!html) return null
  return <h1 data-fs-hero-title dangerouslySetInnerHTML={html} />
}

function SanitizedSubtitle({ content }: { content: string }) {
  const html = useSanitizedHtml(content, { allowedTags: ALLOWED_TAGS, allowedAttributes: ALLOWED_ATTRS })
  if (!html) return null
  return <p data-fs-hero-subtitle dangerouslySetInnerHTML={html} />
}

function SanitizedCta({ content }: { content: string }) {
  const html = useSanitizedHtml(content, { allowedTags: ALLOWED_TAGS, allowedAttributes: ALLOWED_ATTRS })
  if (!html) return null
  return <span dangerouslySetInnerHTML={html} />
}

export const SeBannerHeader = forwardRef<HTMLDivElement, SeBannerHeaderProps>(
  function SeBannerHeader(
    {
      icon,
      link,
      title,
      ctaText,
      linkTargetBlank,
      subtitle,
      testId = 'se-banner-heading',
      textContainerStyle,
      textAlignmentStyle,
      style,
      ...otherProps
    },
    ref,
  ) {
    const { variant, colorVariant } = useBannerContext()

    return (
      <header ref={ref} data-fs-hero-heading data-testid={testId} style={style} {...otherProps}>
        <div
          data-fs-hero-wrapper
          data-fs-content="hero"
          style={{ ...textContainerStyle, ...textAlignmentStyle }}
        >
          {title && <SanitizedTitle content={title} />}
          {subtitle && <SanitizedSubtitle content={subtitle} />}
          {link && !!ctaText && (
            <LinkButton
              href={link}
              inverse={colorVariant === 'main'}
              icon={<Icon name="ArrowRight" />}
              iconPosition="right"
              target={linkTargetBlank ? '_blank' : undefined}
            >
              <SanitizedCta content={ctaText} />
            </LinkButton>
          )}
        </div>
        {!!icon && variant === 'secondary' && <span data-fs-hero-icon>{icon}</span>}
      </header>
    )
  },
)
