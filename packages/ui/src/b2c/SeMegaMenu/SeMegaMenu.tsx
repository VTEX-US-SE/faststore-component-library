import {
  useCloseMenuOnEscape,
  useMegaMenuHoverState,
  useMegaMenuMobileNavigation,
  useNavbarHamburgerTrigger,
  type MegaMenuItem,
  type MegaMenuLogo,
} from '@vtex-us-se/components'
import styles from './SeMegaMenu.module.scss'
import { SeMegaMenuDesktop } from './SeMegaMenuDesktop'
import { SeMegaMenuMobile } from './SeMegaMenuMobile'

export type SeMegaMenuProps = {
  /** Top-level navigation items, each optionally nesting up to 3 levels of categories. */
  menuItems: MegaMenuItem[]
  /** Brand logo shown in the mobile drawer header. Omit to hide it. */
  logo?: MegaMenuLogo
  className?: string
}

export function SeMegaMenu(props: SeMegaMenuProps) {
  const { menuItems = [], logo, className } = props

  const { hoveredCategory, hoveredSub, handleCategoryHover, handleCategoryLeave, setHoveredSub } =
    useMegaMenuHoverState()

  const mobileNavigation = useMegaMenuMobileNavigation()

  // FastStore's navbar renders its own hamburger button outside this component's tree —
  // this hook is how the mobile drawer's open state stays in sync with it.
  useNavbarHamburgerTrigger(mobileNavigation.toggleMenu)
  useCloseMenuOnEscape(mobileNavigation.isMenuOpen, mobileNavigation.closeMenu)

  return (
    <div className={[styles.megaMenu, className].filter(Boolean).join(' ')} data-fs-mega-menu-root>
      <SeMegaMenuMobile menuItems={menuItems} logo={logo} navigation={mobileNavigation} />
      <SeMegaMenuDesktop
        menuItems={menuItems}
        hoveredCategory={hoveredCategory}
        hoveredSub={hoveredSub}
        onCategoryHover={handleCategoryHover}
        onCategoryLeave={handleCategoryLeave}
        onSubCategoryHover={setHoveredSub}
      />
    </div>
  )
}
