export type ActionHubItem = {
  /** Icon image URL (CMS media gallery). */
  icon?: string
  text?: string
  url?: string
  newTab?: boolean
}

export type ActionHub = {
  title?: string
  actionList?: ActionHubItem[]
}

export type BulletinLabel = 'platform' | 'supplier' | 'compliance' | 'product'

export type BulletinItem = {
  title?: string
  text?: string
  /** Free text, shown as-is (e.g. `2025-09-15`). */
  date?: string
  label?: BulletinLabel
}

export type BulletinBoard = {
  title?: string
  items?: BulletinItem[]
}
