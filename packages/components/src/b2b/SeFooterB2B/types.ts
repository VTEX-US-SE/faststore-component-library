export type FooterB2BLink = {
  text?: string
  url?: string
  newTab?: boolean
}

export type FooterB2BColumn = {
  title?: string
  links?: FooterB2BLink[]
}

export type FooterB2BNewsletter = {
  title?: string
  text?: string
  placeholder?: string
  /** Button label. */
  submitLabel?: string
  successMessage?: string
  errorMessage?: string
}

export type FooterB2BSocialLink = {
  /** Icon image URL (CMS media gallery). */
  icon?: string
  alt?: string
  url?: string
}

export type FooterB2BBottomBar = {
  logo?: {
    src?: string
    alt?: string
    link?: {
      url?: string
      title?: string
    }
  }
  contactCopyright?: {
    contact?: string
    copyright?: string
  }
}
