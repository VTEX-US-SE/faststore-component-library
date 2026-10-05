import { useState, type FormEvent } from 'react'
import { useNewsletterSubscription } from '@vtex-us-se/components/b2b'
import type {
  FooterB2BBottomBar,
  FooterB2BColumn,
  FooterB2BNewsletter,
  FooterB2BSocialLink,
} from '@vtex-us-se/components/b2b'
import styles from './SeFooterB2B.module.scss'

export type SeFooterB2BProps = {
  columns?: FooterB2BColumn[]
  newsletter?: FooterB2BNewsletter
  socialLinks?: FooterB2BSocialLink[]
  footerBottomBar?: FooterB2BBottomBar
}

const MAX_COLUMNS = 4

/**
 * Link columns are always in the DOM; below 1024px CSS turns each column title into an
 * accordion toggle and hides closed columns' links. (The kit swapped between two different
 * trees with a JS screen-size hook, which renders the desktop tree on the server and then
 * re-renders on mobile.)
 */
function FooterLinks({ columns }: { columns: FooterB2BColumn[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <nav className={styles.links} data-fs-se-footer-b2b-links>
      {columns.map((column, idx) => {
        const isOpen = openIndex === idx
        const links = (column.links ?? []).filter((link) => link?.url && link?.text)

        return (
          <div key={`${column.title ?? ''}-${idx}`} className={styles.column} data-open={isOpen}>
            {column.title && (
              <button
                type="button"
                className={styles.columnToggle}
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
              >
                <h4>{column.title}</h4>
                <span className={styles.toggleIcon} aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
            )}
            <div className={styles.columnLinks}>
              {links.map((link, linkIdx) => (
                <a
                  key={`${link.url}-${linkIdx}`}
                  href={link.url}
                  target={link.newTab ? '_blank' : undefined}
                  rel={link.newTab ? 'noopener noreferrer' : undefined}
                >
                  {link.text}
                </a>
              ))}
            </div>
          </div>
        )
      })}
    </nav>
  )
}

function FooterNewsletter({
  title = 'Subscribe to Newsletter',
  text,
  placeholder = 'Your Email ID',
  submitLabel = 'Submit',
  successMessage = 'Thank you! You’ve successfully subscribed to our newsletter.',
  errorMessage = 'Error while submitting newsletter',
}: FooterB2BNewsletter) {
  const { email, setEmail, subscribe, subscribed, failed, loading } = useNewsletterSubscription()

  if (subscribed) {
    return (
      <div className={styles.newsletter} data-fs-se-footer-b2b-newsletter>
        <p className={styles.newsletterText}>{successMessage}</p>
      </div>
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void subscribe()
  }

  return (
    <form className={styles.newsletter} onSubmit={handleSubmit} data-fs-se-footer-b2b-newsletter>
      <div className={styles.newsletterHeader}>
        <h4>{title}</h4>
        {text && <p className={styles.newsletterText}>{text}</p>}
      </div>
      <div className={styles.newsletterField}>
        <input
          type="email"
          required
          value={email}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button type="submit" disabled={loading}>
          {submitLabel}
        </button>
      </div>
      {failed && (
        <p className={styles.newsletterError} role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  )
}

function ContactIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 7.33325H4C4.35362 7.33325 4.69276 7.47373 4.94281 7.72378C5.19286 7.97382 5.33333 8.31296 5.33333 8.66658V10.6666C5.33333 11.0202 5.19286 11.3593 4.94281 11.6094C4.69276 11.8594 4.35362 11.9999 4 11.9999H3.33333C2.97971 11.9999 2.64057 11.8594 2.39052 11.6094C2.14048 11.3593 2 11.0202 2 10.6666V7.33325ZM2 7.33325C2 6.54532 2.15519 5.7651 2.45672 5.03715C2.75825 4.3092 3.20021 3.64776 3.75736 3.09061C4.31451 2.53346 4.97595 2.0915 5.7039 1.78997C6.43185 1.48845 7.21207 1.33325 8 1.33325C8.78793 1.33325 9.56815 1.48845 10.2961 1.78997C11.0241 2.0915 11.6855 2.53346 12.2426 3.09061C12.7998 3.64776 13.2417 4.3092 13.5433 5.03715C13.8448 5.7651 14 6.54532 14 7.33325M14 7.33325V10.6666M14 7.33325H12C11.6464 7.33325 11.3072 7.47373 11.0572 7.72378C10.8071 7.97382 10.6667 8.31296 10.6667 8.66658V10.6666C10.6667 11.0202 10.8071 11.3593 11.0572 11.6094C11.3072 11.8594 11.6464 11.9999 12 11.9999H12.6667C13.0203 11.9999 13.3594 11.8594 13.6095 11.6094C13.8595 11.3593 14 11.0202 14 10.6666M14 10.6666V11.9999C14 12.7072 13.719 13.3854 13.219 13.8855C12.7189 14.3856 12.0406 14.6666 11.3333 14.6666H8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FooterBottomBar({ logo, contactCopyright }: FooterB2BBottomBar) {
  const logoImage = logo?.src ? <img src={logo.src} alt={logo.alt ?? ''} /> : null

  return (
    <div className={styles.bottomBar} data-fs-se-footer-b2b-bottom-bar>
      <div className={styles.bottomBarWrapper}>
        <div className={styles.logoContact}>
          {logoImage &&
            (logo?.link?.url ? (
              <a href={logo.link.url} title={logo.link.title}>
                {logoImage}
              </a>
            ) : (
              logoImage
            ))}
          {contactCopyright?.contact && (
            <div className={styles.contact}>
              <ContactIcon />
              <p>{contactCopyright.contact}</p>
            </div>
          )}
        </div>
        {contactCopyright?.copyright && <p className={styles.copyright}>{contactCopyright.copyright}</p>}
      </div>
    </div>
  )
}

export function SeFooterB2B({ columns, newsletter, socialLinks, footerBottomBar }: SeFooterB2BProps) {
  const visibleColumns = (columns ?? []).slice(0, MAX_COLUMNS)
  const social = (socialLinks ?? []).filter((item) => item?.url && item?.icon)

  return (
    <footer className={styles.footer} data-fs-se-footer-b2b>
      <div className={styles.footerTop}>
        <FooterLinks columns={visibleColumns} />
        <div className={styles.footerRight}>
          <FooterNewsletter {...newsletter} />
          {social.length > 0 && (
            <div className={styles.social} data-fs-se-footer-b2b-social>
              {social.map((item, idx) => (
                <a key={`${item.url}-${idx}`} href={item.url} target="_blank" rel="noopener noreferrer">
                  <img src={item.icon} alt={item.alt ?? ''} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <FooterBottomBar {...footerBottomBar} />
    </footer>
  )
}
