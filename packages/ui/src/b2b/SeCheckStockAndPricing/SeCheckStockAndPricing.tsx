import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { formatStockMoney, skuHref, useCheckStockAndPricing, useStockSkuSearch } from '@vtex-us-se/components/b2b'
import { SeAddToPurchaseListButton } from '../SeAddToPurchaseList/SeAddToPurchaseListButton'
import { SeStockImportModal } from './SeStockImportModal'
import styles from './SeCheckStockAndPricing.module.scss'

export type SeCheckStockAndPricingProps = {
  title?: string
  description?: string
  searchPlaceholder?: string
  noResultsMessage?: string
  importLabel?: string
  emptyTitle?: string
  emptyMessage?: string
  clearLabel?: string
  addToCartLabel?: string
  /** Saves every row with a quantity to one of the buyer's purchase lists (SeAddToPurchaseList's picker). */
  addToListLabel?: string
  /** SePurchaseLists' page, linked to after saving to a list. */
  purchaseListsUrl?: string
  totalLabel?: string
  /** Shown to anonymous shoppers instead of the worksheet. */
  signedOutMessage?: string
  loginUrl?: string
  loginLabel?: string
  /** Units at or above which a SKU shows "In Stock" rather than "Low Stock". */
  lowStockThreshold?: number
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function RemoveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * B2B "Check stock and pricing" worksheet: buyers add SKUs by reference code (search, or a
 * `refId,quantity` CSV), see their session price and live stock for each, adjust quantities,
 * and add everything to the cart at once. Anonymous shoppers get a sign-in prompt.
 *
 * Needs GraphQL of its own, so it must be added with `se-components add SeCheckStockAndPricing`
 * plus `se-components add-resolver skuAvailability` and `se-components add-resolver
 * b2bProductFields` (its search reads the `seSkus` product field). Pair it with the
 * `SeAddressSelector` section: stock is simulated at the session's postal code. Its "add all to a
 * purchase list" button is SeAddToPurchaseList's, which `add` copies alongside (a sibling folder),
 * so `se-components add-resolver purchaseLists` is needed too.
 */
export function SeCheckStockAndPricing({
  title = 'Check Stock and Pricing',
  description = 'Search for items or import a CSV to check real-time availability and pricing.',
  searchPlaceholder = 'Search product by Ref ID',
  noResultsMessage = 'No results found. Please try a different Ref ID.',
  importLabel = 'Import CSV',
  emptyTitle = 'No items added yet',
  emptyMessage = 'Search for products above by Ref ID, or import a CSV file to check stock availability and pricing in bulk.',
  clearLabel = 'Clear List',
  addToCartLabel = 'Add all to cart',
  addToListLabel = 'Add all to a purchase list',
  purchaseListsUrl = '',
  totalLabel = 'Total Estimated:',
  signedOutMessage = 'Sign in to check stock and pricing.',
  loginUrl = '/login',
  loginLabel = 'Sign in',
  lowStockThreshold = 50,
}: SeCheckStockAndPricingProps) {
  const sheet = useCheckStockAndPricing({ lowStockThreshold })
  const [term, setTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const search = useStockSkuSearch(sheet.searchProducts, term)
  const searchRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const listProducts = useMemo(
    () => sheet.rows.map((row) => ({ skuId: row.sku.itemId, quantity: row.quantity })),
    [sheet.rows],
  )

  useEffect(() => {
    if (!dropdownOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [dropdownOpen])

  if (!sheet.isLoggedIn) {
    return (
      <section className={styles.signedOut} data-fs-se-check-stock-and-pricing>
        <p>{signedOutMessage}</p>
        <a className={styles.primary} href={loginUrl}>
          {loginLabel}
        </a>
      </section>
    )
  }

  const showDropdown = dropdownOpen && term.trim().length >= search.minLength && !search.searching

  return (
    <section className={styles.sheet} data-fs-se-check-stock-and-pricing>
      <header className={styles.heading}>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </header>

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.search} ref={searchRef}>
            <SearchIcon />
            <input
              type="search"
              value={term}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-expanded={showDropdown}
              aria-controls={listboxId}
              onChange={(event) => {
                setTerm(event.target.value)
                setDropdownOpen(true)
              }}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={(event) => event.key === 'Escape' && setDropdownOpen(false)}
            />
            {showDropdown && (
              <ul className={styles.dropdown} id={listboxId}>
                {search.results.length === 0 ? (
                  <li className={styles.noResults}>{noResultsMessage}</li>
                ) : (
                  search.results.map(({ product, sku }) => (
                    <li key={sku.itemId}>
                      <button
                        type="button"
                        onClick={() => {
                          sheet.addSkus([{ product, sku, quantity: 1 }])
                          setTerm('')
                          setDropdownOpen(false)
                        }}
                      >
                        {sku.imageUrl ? <img src={sku.imageUrl} alt="" width={40} height={40} /> : <span className={styles.noImage} />}
                        <span>
                          <strong>{sku.referenceCode ?? sku.itemId}</strong>
                          <span>{sku.name}</span>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <span className={styles.or}>or</span>
          <button type="button" className={styles.secondary} onClick={() => setImportOpen(true)}>
            {importLabel}
          </button>
        </div>

        {sheet.rows.length === 0 ? (
          <div className={styles.empty}>
            <h2>{emptyTitle}</h2>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Ref ID</th>
                <th scope="col">Name</th>
                <th scope="col">Unit Price</th>
                <th scope="col">Availability</th>
                <th scope="col">Available Qty</th>
                <th scope="col">Quantity</th>
                <th scope="col">
                  <span className={styles.visuallyHidden}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((row, index) => {
                const loading = row.availability === undefined
                return (
                  <tr key={row.sku.itemId}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label="Ref ID">{row.sku.referenceCode ?? '—'}</td>
                    <td data-label="Name" className={styles.name}>
                      <a href={skuHref(row.product, row.sku)} target="_blank" rel="noreferrer">
                        {row.sku.imageUrl && <img src={row.sku.imageUrl} alt="" width={40} height={40} loading="lazy" />}
                        {row.sku.name}
                      </a>
                    </td>
                    <td data-label="Unit Price" className={styles.price}>
                      {typeof row.sku.price === 'number' ? formatStockMoney(row.sku.price, sheet.money) : '—'}
                    </td>
                    <td data-label="Availability">
                      {loading ? (
                        <span className={styles.skeleton} aria-label="Loading" />
                      ) : (
                        <span className={styles.status} data-stock={row.availability?.status ?? 'Unknown'}>
                          {row.availability?.status ?? 'Unavailable'}
                        </span>
                      )}
                    </td>
                    <td data-label="Available Qty">
                      {loading ? <span className={styles.skeleton} aria-label="Loading" /> : (row.availability?.quantity ?? '—')}
                    </td>
                    <td data-label="Quantity">
                      <div className={styles.quantity}>
                        <button
                          type="button"
                          aria-label={`− ${row.sku.name}`}
                          disabled={row.quantity === 0}
                          onClick={() => sheet.setQuantity(row.sku.itemId, row.quantity - 1)}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={row.quantity}
                          aria-label={`Quantity ${row.sku.name}`}
                          onChange={(event) => sheet.setQuantity(row.sku.itemId, event.target.valueAsNumber)}
                        />
                        <button
                          type="button"
                          aria-label={`+ ${row.sku.name}`}
                          disabled={row.availability?.quantity != null && row.quantity >= row.availability.quantity}
                          onClick={() => sheet.setQuantity(row.sku.itemId, row.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className={styles.actions}>
                      <button type="button" aria-label={`Remove ${row.sku.name}`} onClick={() => sheet.remove(row.sku.itemId)}>
                        <RemoveIcon />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <footer className={styles.footer}>
        <div className={styles.totals}>
          <p>
            <strong>{sheet.totalItems}</strong> items
          </p>
          <p>
            {totalLabel} <strong>{sheet.total}</strong>
          </p>
        </div>
        <div className={styles.footerActions}>
          <button type="button" className={styles.secondary} disabled={sheet.rows.length === 0} onClick={sheet.clear}>
            {clearLabel}
          </button>
          <SeAddToPurchaseListButton
            products={listProducts}
            className={styles.secondary}
            buttonLabel={addToListLabel}
            drawerTitle={addToListLabel}
            listsUrl={purchaseListsUrl}
            loginUrl={loginUrl}
          />
          <button type="button" className={styles.primary} disabled={sheet.totalItems === 0} onClick={sheet.addAllToCart}>
            {addToCartLabel}
          </button>
        </div>
      </footer>

      {importOpen && (
        <SeStockImportModal
          importCsv={sheet.importCsv}
          onConfirm={(report) => {
            sheet.confirmImport(report)
            setImportOpen(false)
          }}
          onClose={() => setImportOpen(false)}
        />
      )}
    </section>
  )
}
