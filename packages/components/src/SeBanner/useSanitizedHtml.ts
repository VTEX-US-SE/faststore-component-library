import { useMemo } from 'react'
import sanitizeHtml from 'sanitize-html'

export type SanitizeOptions = {
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
  allowedClasses?: Record<string, string[]>
}

const DEFAULTS = {
  allowedAttributes: {
    '*': ['id', 'title', 'accesskey', 'class', 'style', 'aria-label', 'width', 'height', 'hidden'],
    a: ['href', 'name', 'target'],
    iframe: ['allow', 'allowfullscreen', 'frameborder', 'src'],
    img: ['src', 'alt'],
    link: ['rel', 'type', 'href'],
    td: ['colspan', 'rowspan', 'headers'],
  },
  allowedClasses: {},
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedTags: [
    'a', 'abbr', 'article', 'b', 'blockquote', 'br', 'caption', 'code', 'del', 'details',
    'div', 'em', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'header', 'footer', 'i',
    'img', 'ins', 'iframe', 'kbd', 'li', 'main', 'mark', 'ol', 'p', 'picture', 'pre', 'section',
    'span', 'strike', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'th', 'thead',
    'tr', 'u', 'ul',
  ],
}

/**
 * Sanitizes CMS-authored HTML for safe use with `dangerouslySetInnerHTML`.
 * Returns `null` for empty content so callers can skip rendering entirely.
 */
export function useSanitizedHtml(
  content: string,
  { allowedAttributes, allowedClasses, allowedTags }: SanitizeOptions = {},
): { __html: string } | null {
  return useMemo(() => {
    if (!content) return null

    const clean = sanitizeHtml(content, {
      ...DEFAULTS,
      allowedAttributes: allowedAttributes ?? DEFAULTS.allowedAttributes,
      allowedClasses: allowedClasses ?? DEFAULTS.allowedClasses,
      allowedTags: allowedTags ?? DEFAULTS.allowedTags,
    })
    return { __html: clean }
  }, [content, allowedAttributes, allowedClasses, allowedTags])
}
