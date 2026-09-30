import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'
import { Link } from '@faststore/ui'
import type { MegaMenuItem, MegaMenuLogo, MegaMenuMobileNavigationState } from '@vtex-us-se/components'
import styles from './SeMegaMenu.module.scss'

export interface SeMegaMenuMobileProps extends HTMLAttributes<HTMLDivElement> {
  menuItems: MegaMenuItem[]
  logo?: MegaMenuLogo
  navigation: MegaMenuMobileNavigationState
  testId?: string
}

function panelStateClassName(activePanel: MegaMenuMobileNavigationState['activePanel']) {
  if (activePanel === 'l2' || activePanel === 'l3') return styles.panelOpenL23
  if (activePanel === 'l1') return styles.panelOpenL1
  return ''
}

export const SeMegaMenuMobile = forwardRef<HTMLDivElement, SeMegaMenuMobileProps>(
  function SeMegaMenuMobile({ menuItems, logo, navigation, testId = 'se-mega-menu-mobile', ...otherProps }, ref) {
    const {
      isMenuOpen,
      closeMenu,
      selectedL1Category,
      selectedL2Category,
      selectedL3Category,
      activePanel,
      openL1Category,
      closeL1Category,
      openL2Category,
      closeL2Category,
      openL3Category,
      closeL3Category,
    } = navigation

    // See useMegaMenuMobileNavigation's doc comment for why the indices walk the tree this way.
    const l1MenuItem = selectedL1Category !== null ? menuItems[selectedL1Category] : undefined
    const l2Category = l1MenuItem && selectedL2Category !== null ? l1MenuItem.level1?.[selectedL2Category] : undefined
    const l3Category = l2Category && selectedL3Category !== null ? l2Category.level2?.[selectedL3Category] : undefined

    return (
      <div ref={ref} data-fs-mega-menu-mobile data-testid={testId} {...otherProps}>
        <div
          className={[styles.mobileMenuOverlay, isMenuOpen ? styles.open : ''].filter(Boolean).join(' ')}
          onClick={closeMenu}
          data-fs-mega-menu-mobile-trigger
        />

        {isMenuOpen && (
          <div className={[styles.mobileMenuContent, panelStateClassName(activePanel)].filter(Boolean).join(' ')}>
            <div className={styles.mobileMenuContentHeader}>
              {logo?.src && (
                <div data-fs-logo>
                  <Link variant="display" href={logo?.link ?? ''}>
                    <img alt={logo?.alt ?? ''} src={logo.src} style={{ width: '7rem', height: 'auto' }} />
                  </Link>
                </div>
              )}
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeMenu}
                data-fs-mega-menu-mobile-close-button
              >
                &times;
              </button>
            </div>

            {activePanel === 'main' && (
              <div data-fs-mega-menu-mobile-main-menu>
                {menuItems.map((menuItem, index) => (
                  <div key={menuItem.text} className={styles.mobileMenuItem}>
                    <Link variant="display" href={menuItem.url} className={styles.mobileMenuItemLink}>
                      {menuItem.text}
                    </Link>
                    {!!menuItem.level1?.length && (
                      <span
                        className={styles.arrow}
                        onClick={() => openL1Category(index)}
                        data-fs-mega-menu-mobile-main-menu-span
                      >
                        &gt;
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activePanel === 'l1' && l1MenuItem && (
              <>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={closeL1Category}
                  data-fs-mega-menu-mobile-l1-category-back-button
                >
                  &larr; {l1MenuItem.text}
                </button>
                <div>
                  {l1MenuItem.level1?.map((category, idx) => (
                    <div key={category.text} className={styles.mobileCategoryRow} data-fs-mega-menu-mobile-l1-category>
                      <Link variant="display" href={category.url} className={styles.mobileCategoryLink}>
                        {category.text}
                      </Link>
                      {!!category.level2?.length && (
                        <span
                          className={styles.arrow}
                          onClick={() => openL2Category(idx)}
                          data-fs-mega-menu-mobile-l1-category-span
                        >
                          &gt;
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {activePanel === 'l2' && l2Category && (
              <>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={closeL2Category}
                  data-fs-mega-menu-mobile-l2-category-back-button
                >
                  &larr; {l2Category.text}
                </button>
                <div className={styles.mobileLeafList} data-fs-mega-menu-mobile-l2-category>
                  {l2Category.level2?.map((sub, idx) => (
                    <div className={styles.mobileCategoryRow} key={sub.text}>
                      <Link variant="display" href={sub.url} className={styles.mobileCategoryLink}>
                        {sub.text}
                      </Link>
                      {!!sub.level3?.length && (
                        <span
                          className={styles.arrow}
                          onClick={() => openL3Category(idx)}
                          data-fs-mega-menu-mobile-l2-category-span
                        >
                          &gt;
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {activePanel === 'l3' && l3Category && (
              <>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={closeL3Category}
                  data-fs-mega-menu-mobile-l3-category-back-button
                >
                  &larr; {l3Category.text}
                </button>
                <div className={styles.mobileLeafList}>
                  {l3Category.level3?.map((subItem) => (
                    <div className={styles.mobileCategoryRow} key={subItem.text}>
                      <Link variant="display" href={subItem.url} className={styles.mobileCategoryLink}>
                        {subItem.text}
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )
  },
)
