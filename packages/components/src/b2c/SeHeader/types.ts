export type SeHeaderTopbarItem = {
  label?: string
  href?: string
}

export type SeHeaderTopbar = {
  leftText?: string
  rightItems?: SeHeaderTopbarItem[]
}

export type SeHeaderLogo = {
  text?: string
  href?: string
  imageUrl?: string
}

export type SeHeaderSearchCategory = {
  label?: string
  value?: string
}

export type SeHeaderSearch = {
  placeholder?: string
  categories?: SeHeaderSearchCategory[]
  /** Optional form action URL (plain GET form submission) when no onSearch handler is given. */
  action?: string
}

export type SeHeaderAccount = {
  welcome?: string
  guestLabel?: string
  loginLabel?: string
  loginHref?: string
  showAvatar?: boolean
}

export type SeHeaderSearchSubmit = {
  term: string
  category: string
}
