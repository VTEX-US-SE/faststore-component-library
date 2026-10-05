import type { FormEvent } from 'react'
import type {
  SeHeaderAccount,
  SeHeaderLogo,
  SeHeaderSearch,
  SeHeaderSearchSubmit,
  SeHeaderTopbar,
} from '@vtex-us-se/components'
import styles from './SeHeader.module.scss'

export interface SeHeaderProps {
  topbar?: SeHeaderTopbar
  logo?: SeHeaderLogo
  search?: SeHeaderSearch
  account?: SeHeaderAccount
  /** Called on search submit. When provided, the native form submission is prevented. */
  onSearch?: (submit: SeHeaderSearchSubmit) => void
  className?: string
  testId?: string
}

export function SeHeader({
  topbar,
  logo,
  search,
  account,
  onSearch,
  className,
  testId = 'se-header',
}: SeHeaderProps) {
  const topbarItems = (topbar?.rightItems ?? []).filter((item) => item?.label)
  const categories = (search?.categories ?? []).filter((c) => c?.label)
  const hasTopbar = Boolean(topbar?.leftText) || topbarItems.length > 0
  const hasAccount = Boolean(account?.welcome || account?.guestLabel || account?.loginLabel)
  const logoAlt = logo?.text ?? ''

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!onSearch) return
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onSearch({
      term: String(data.get('term') ?? ''),
      category: String(data.get('category') ?? ''),
    })
  }

  const logoContent = logo?.imageUrl ? (
    <img src={logo.imageUrl} alt={logoAlt} className={styles.logoImg} data-fs-se-header-logo-image />
  ) : (
    logo?.text
  )

  return (
    <header className={[styles.header, className].filter(Boolean).join(' ')} data-fs-se-header data-testid={testId}>
      {hasTopbar && (
        <div className={styles.topbar} data-fs-se-header-topbar>
          <div className={styles.left} data-fs-se-header-topbar-left>
            {topbar?.leftText}
          </div>
          <ul className={styles.right} data-fs-se-header-topbar-right>
            {topbarItems.map((item, idx) => (
              <li key={`${item.label}-${idx}`} className={styles.rightItem} data-fs-se-header-topbar-item>
                {item.href ? (
                  <a className={styles.link} href={item.href} data-fs-se-header-topbar-link>
                    {item.label}
                  </a>
                ) : (
                  <span className={styles.link} data-fs-se-header-topbar-link>
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.main} data-fs-se-header-main>
        {(logo?.imageUrl || logo?.text) && (
          <div className={styles.logo} data-fs-se-header-logo>
            {logo?.href ? (
              <a href={logo.href} aria-label={logoAlt || undefined} data-fs-se-header-logo-link>
                {logoContent}
              </a>
            ) : (
              logoContent
            )}
          </div>
        )}

        <div className={styles.searchWrap} data-fs-se-header-search>
          <form
            className={styles.searchBox}
            role="search"
            action={search?.action}
            method={search?.action ? 'get' : undefined}
            onSubmit={handleSubmit}
            data-fs-se-header-search-form
          >
            {categories.length > 0 && (
              <select
                className={styles.category}
                name="category"
                aria-label="Search category"
                data-fs-se-header-search-category
              >
                {categories.map((c, i) => (
                  <option key={`${c.label}-${i}`} value={c.value ?? c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
            <input
              className={styles.input}
              type="search"
              name="term"
              placeholder={search?.placeholder}
              aria-label={search?.placeholder || 'Search'}
              data-fs-se-header-search-input
            />
            <button className={styles.clear} type="reset" aria-label="Clear search" data-fs-se-header-search-clear>
              <span aria-hidden="true">&#10005;</span>
            </button>
            <button className={styles.searchBtn} type="submit" aria-label="Search" data-fs-se-header-search-submit>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
            </button>
          </form>
        </div>

        {hasAccount && (
          <div className={styles.account} data-fs-se-header-account>
            {(account?.welcome || account?.guestLabel) && (
              <div className={styles.greeting} data-fs-se-header-account-greeting>
                {account?.welcome} {account?.guestLabel && <span>{account.guestLabel}</span>}
              </div>
            )}
            <div className={styles.avatar} data-fs-se-header-account-avatar>
              {account?.showAvatar && <div className={styles.icon} aria-hidden="true" />}
              {account?.loginLabel &&
                (account.loginHref ? (
                  <a className={styles.login} href={account.loginHref} data-fs-se-header-account-login>
                    {account.loginLabel}
                  </a>
                ) : (
                  <span className={styles.login} data-fs-se-header-account-login>
                    {account.loginLabel}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
