import type { SeFooterColumn, SeFooterSocialLink } from './types'

export const isExternalUrl = (url: string) => /^https?:\/\//.test(url)

/** A column with at least one URL-less item is a text column (e.g. a loyalty-club teaser). */
export const getSeFooterColumnVariant = (column: SeFooterColumn): 'text' | 'links' =>
  (column.items ?? []).some((item) => !item.url) ? 'text' : 'links'

export const getSeFooterSocialIconName = (link: SeFooterSocialLink): string | undefined =>
  typeof link.icon === 'string' ? link.icon : link.icon?.icon
