import { useId, useState } from 'react'
import { Icon } from '@faststore/ui'
import {
  getSeFooterColumnVariant,
  getSeFooterSocialIconName,
  isExternalUrl,
} from '@vtex-us-se/components'
import type {
  SeFooterAccordionBreakpoint,
  SeFooterColumn as SeFooterColumnData,
  SeFooterIncentive,
  SeFooterLogo,
  SeFooterPaymentMethods,
  SeFooterSocial,
} from '@vtex-us-se/components'
import styles from './SeFooter.module.scss'

export interface SeFooterProps {
  /** Up to 4 columns. Collapsed into accordions below `accordionBreakpoint`. */
  footerLinks?: SeFooterColumnData[]
  footerSocial?: SeFooterSocial
  logo?: SeFooterLogo
  copyrightInfo?: string
  /** Optional row above the columns. */
  incentives?: SeFooterIncentive[]
  /** Optional row next to the copyright. */
  acceptedPaymentMethods?: SeFooterPaymentMethods
  /** Defaults to `notebook` (1024px). */
  accordionBreakpoint?: SeFooterAccordionBreakpoint
  className?: string
  testId?: string
}

const MAX_COLUMNS = 4

const externalProps = (url: string) =>
  isExternalUrl(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {}

function FooterColumn({ column }: { column: SeFooterColumnData }) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const items = column.items ?? []

  return (
    <div
      className={styles.column}
      data-fs-footer-column
      data-open={open}
      data-variant={getSeFooterColumnVariant(column)}
    >
      <button
        type="button"
        className={styles.columnTitle}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{column.sectionTitle}</span>
        <Icon
          name={open ? 'Minus' : 'Plus'}
          width={20}
          height={20}
          aria-hidden
          className={styles.columnIcon}
        />
      </button>
      <ul id={listId} className={styles.columnList}>
        {items.map((item, index) => (
          <li key={`${item.text}-${index}`}>
            {item.url ? (
              <a className={styles.link} href={item.url} {...externalProps(item.url)}>
                {item.text}
              </a>
            ) : (
              <p className={styles.text}>{item.text}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SeFooter({
  footerLinks = [],
  footerSocial,
  logo,
  copyrightInfo,
  incentives = [],
  acceptedPaymentMethods,
  accordionBreakpoint = 'notebook',
  className,
  testId = 'se-footer',
}: SeFooterProps) {
  const columns = footerLinks.slice(0, MAX_COLUMNS)
  const socialLinks = (footerSocial?.socialLinks ?? []).filter((link) => link?.url)
  const paymentMethods = (acceptedPaymentMethods?.methods ?? []).filter((method) => method?.image)

  return (
    <footer
      className={[styles.footer, className].filter(Boolean).join(' ')}
      data-fs-se-footer
      data-accordion-breakpoint={accordionBreakpoint}
      data-testid={testId}
    >
      <div className={styles.inner}>
        {incentives.length > 0 && (
          <ul className={styles.incentives} data-fs-footer-incentives>
            {incentives.map((incentive, index) => (
              <li key={`${incentive.title}-${index}`} className={styles.incentive}>
                {incentive.icon && <Icon name={incentive.icon} width={24} height={24} aria-hidden />}
                <span>
                  <strong>{incentive.title}</strong>
                  {incentive.text && <span className={styles.incentiveText}>{incentive.text}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}

        {columns.length > 0 && (
          <nav className={styles.columns} data-fs-footer-columns>
            {columns.map((column, index) => (
              <FooterColumn key={`${column.sectionTitle}-${index}`} column={column} />
            ))}
          </nav>
        )}

        {logo?.src && (
          <a
            className={styles.logo}
            href={logo.link?.url || '/'}
            title={logo.link?.title}
            data-fs-footer-logo
          >
            <img src={logo.src} alt={logo.alt ?? ''} loading="lazy" />
          </a>
        )}

        <div className={styles.bottom} data-fs-footer-bottom>
          <div className={styles.legal}>
            {paymentMethods.length > 0 && (
              <div className={styles.payments} data-fs-footer-payments>
                {acceptedPaymentMethods?.title && <span>{acceptedPaymentMethods.title}</span>}
                <ul>
                  {paymentMethods.map((method, index) => (
                    <li key={`${method.alt}-${index}`}>
                      <img src={method.image} alt={method.alt} loading="lazy" />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {copyrightInfo && <p className={styles.copyright}>{copyrightInfo}</p>}
          </div>

          {socialLinks.length > 0 && (
            <ul className={styles.social} aria-label={footerSocial?.title} data-fs-footer-social>
              {socialLinks.map((link, index) => {
                const iconName = getSeFooterSocialIconName(link)

                return (
                  <li key={`${link.url}-${index}`}>
                    <a
                      className={styles.socialLink}
                      href={link.url}
                      title={link.alt}
                      aria-label={link.alt}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.image ? (
                        <img src={link.image} alt="" width={20} height={20} loading="lazy" />
                      ) : (
                        iconName && <Icon name={iconName} width={20} height={20} aria-hidden />
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </footer>
  )
}
