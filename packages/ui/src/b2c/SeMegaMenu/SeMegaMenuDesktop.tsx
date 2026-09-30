import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'
import { Link } from '@faststore/ui'
import type { MegaMenuItem } from '@vtex-us-se/components'
import styles from './SeMegaMenu.module.scss'

export interface SeMegaMenuDesktopProps extends HTMLAttributes<HTMLElement> {
  menuItems: MegaMenuItem[]
  hoveredCategory: number | null
  hoveredSub: number
  onCategoryHover: (index: number) => void
  onCategoryLeave: () => void
  onSubCategoryHover: (index: number) => void
  testId?: string
}

export const SeMegaMenuDesktop = forwardRef<HTMLElement, SeMegaMenuDesktopProps>(
  function SeMegaMenuDesktop(
    {
      menuItems,
      hoveredCategory,
      hoveredSub,
      onCategoryHover,
      onCategoryLeave,
      onSubCategoryHover,
      testId = 'se-mega-menu-desktop',
      ...otherProps
    },
    ref,
  ) {
    return (
      <nav ref={ref} className={styles.nav} data-fs-mega-menu data-testid={testId} {...otherProps}>
        <ul className={styles.menu}>
          {menuItems.map((menuItem, index) => {
            const activeColumn = menuItem.level1?.[hoveredSub]
            return (
              <li
                key={menuItem.text}
                className={styles.menuItem}
                onMouseEnter={() => onCategoryHover(index)}
                onMouseLeave={onCategoryLeave}
                data-fs-mega-menu-item
              >
                <Link variant="display" href={menuItem.url} className={styles.menuItemLink}>
                  {menuItem.text}
                </Link>

                {hoveredCategory === index && !!menuItem.level1?.length && (
                  <div className={styles.megaMenuPanel} data-fs-mega-menu-item-hovered>
                    <div className={styles.level1}>
                      {menuItem.level1.map((category, idx) => (
                        <Link
                          key={category.text}
                          variant="display"
                          href={category.url}
                          className={[styles.mainCategory, hoveredSub === idx ? styles.active : '']
                            .filter(Boolean)
                            .join(' ')}
                          onMouseEnter={() => onSubCategoryHover(idx)}
                          data-fs-mega-menu-main-category
                        >
                          {category.text}
                        </Link>
                      ))}
                    </div>

                    {!!activeColumn?.level2?.length && (
                      <div className={styles.subCategoriesAndItems} data-fs-mega-menu-main-category-hovered>
                        {activeColumn.level2.map((sub) => (
                          <div key={sub.text} className={styles.subCategoryColumn}>
                            <div className={styles.subCategoryHeading}>
                              <Link variant="display" href={sub.url} className={styles.subCategoryHeadingLink}>
                                {sub.text}
                              </Link>
                            </div>
                            {!!sub.level3?.length && (
                              <div className={styles.level3}>
                                {sub.level3.map((item) => (
                                  <Link
                                    key={item.text}
                                    variant="display"
                                    href={item.url}
                                    className={styles.subCategoryItem}
                                  >
                                    {item.text}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        <div
          className={[styles.menuOverlayBg, hoveredCategory !== null ? styles.menuOverlayBgActive : '']
            .filter(Boolean)
            .join(' ')}
        />
      </nav>
    )
  },
)
