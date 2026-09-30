export interface MegaMenuSubCategoryItem {
  text: string
  url: string
}

export interface MegaMenuSubCategory {
  text: string
  url: string
  level3?: MegaMenuSubCategoryItem[]
}

export interface MegaMenuMainCategory {
  text: string
  url: string
  level2?: MegaMenuSubCategory[]
}

export interface MegaMenuItem {
  text: string
  url: string
  level1?: MegaMenuMainCategory[]
}

export type MegaMenuLogo = {
  src: string | null
  alt: string | null
  link: string | null
}

/** Which drill-down panel the mobile drawer is currently showing. */
export type MegaMenuMobilePanel = 'main' | 'l1' | 'l2' | 'l3'
