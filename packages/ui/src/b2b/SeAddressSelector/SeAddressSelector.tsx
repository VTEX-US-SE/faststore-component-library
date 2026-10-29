import { useEffect, useId, useRef, useState } from 'react'
import { formatShopperAddress, useAddressSelector } from '@vtex-us-se/components/b2b'
import styles from './SeAddressSelector.module.scss'

export type SeAddressSelectorProps = {
  label?: string
  addAddressLabel?: string
  /** Address book page; `{unitId}` and `{customerId}` are replaced from the B2B session. */
  addAddressUrl?: string
  /** Only list addresses of this Master Data `addressType` (empty = all). The kit listed only "commercial". */
  addressType?: string
  /** Shown on the button before the session points at one of the shopper's addresses. */
  placeholder?: string
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * "Ship to" selector for B2B buyers: lists the addresses saved on their account and points the
 * FastStore session (regionalization: prices, availability, shipping) at the one they pick.
 * Renders nothing outside a B2B session.
 *
 * Needs GraphQL of its own, so it must be added with `se-components add SeAddressSelector`
 * (source copy, query text inlined) plus `se-components add-resolver shopperAddresses`. Unlike
 * the kit's version it doesn't depend on the kit's navbar having run first.
 */
export function SeAddressSelector({
  label = 'Ship to',
  addAddressLabel = 'Add new Address',
  addAddressUrl = '/pvt/organization-account/addresses/{unitId}/{customerId}',
  addressType = 'commercial',
  placeholder = 'Select an address',
}: SeAddressSelectorProps) {
  const { isB2b, unitId, customerId, loaded, addresses, current, select } = useAddressSelector()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!isB2b || !loaded) return null

  const href = addAddressUrl
    .replace('{unitId}', encodeURIComponent(unitId ?? ''))
    .replace('{customerId}', encodeURIComponent(customerId ?? ''))
  const options = addresses.filter((address) => address.isActive !== false && (!addressType || address.addressType === addressType))

  return (
    <section className={styles.addressSelector} data-fs-se-address-selector>
      <div className={styles.row} ref={containerRef}>
        <span className={styles.label}>{label}</span>

        {options.length === 0 ? (
          <a className={styles.trigger} href={href}>
            <PlusIcon />
            {addAddressLabel}
          </a>
        ) : (
          <div className={styles.dropdown}>
            <button
              type="button"
              className={styles.trigger}
              aria-haspopup="true"
              aria-expanded={open}
              aria-controls={menuId}
              onClick={() => setOpen((value) => !value)}
            >
              <PinIcon />
              <span className={styles.triggerText}>{current ? formatShopperAddress(current) : placeholder}</span>
              <svg className={styles.caret} data-open={open} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {open && (
              <ul className={styles.menu} id={menuId}>
                {options.map((address) => (
                  <li key={address.id}>
                    <button
                      type="button"
                      className={styles.option}
                      aria-current={address.id === current?.id ? 'true' : undefined}
                      onClick={() => {
                        select(address.id)
                        setOpen(false)
                      }}
                    >
                      <PinIcon />
                      {formatShopperAddress(address)}
                    </button>
                  </li>
                ))}
                <li className={styles.divider} aria-hidden="true" />
                <li>
                  <a className={styles.option} href={href}>
                    <PlusIcon />
                    {addAddressLabel}
                  </a>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
