export type SeFooterLink = {
  text: string
  /** Without a URL the item renders as a paragraph and its column becomes a text column. */
  url?: string
}

export type SeFooterColumn = {
  sectionTitle?: string
  items?: SeFooterLink[]
}

export type SeFooterSocialLink = {
  /**
   * Icon name in the store's FastStore icon sprite (e.g. `Facebook`, `Instagram`). The native
   * Footer's `{ icon }` object shape is accepted too, so its CMS content renders as is.
   */
  icon?: string | { icon?: string }
  /** Custom icon image URL, for networks the sprite doesn't have. Wins over `icon`. */
  image?: string
  alt: string
  url: string
}

export type SeFooterSocial = {
  title?: string
  socialLinks?: SeFooterSocialLink[]
}

export type SeFooterLogo = {
  src?: string
  alt?: string
  link?: { url?: string; title?: string }
}

export type SeFooterIncentive = {
  title: string
  /** Same field name as the native Footer's incentives. */
  firstLineText?: string
  /** Icon name in the store's FastStore icon sprite. */
  icon?: string
}

export type SeFooterPaymentMethod = {
  image: string
  alt: string
}

export type SeFooterPaymentMethods = {
  title?: string
  methods?: SeFooterPaymentMethod[]
}

/** Width below which link columns collapse into accordions: 768px or 1024px. */
export type SeFooterAccordionBreakpoint = 'tablet' | 'notebook'
