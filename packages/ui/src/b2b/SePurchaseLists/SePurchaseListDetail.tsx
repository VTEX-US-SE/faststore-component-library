import { useState } from 'react'
import {
  formatPurchaseListMoney,
  PURCHASE_LIST_ERROR_MESSAGES,
  purchaseListSkuHref,
  usePurchaseListLines,
  usePurchaseListSearch,
  type PurchaseList,
  type PurchaseListActionResult,
  type PurchaseListVisibility,
  type usePurchaseLists,
} from '@vtex-us-se/components/b2b'
import styles from './SePurchaseLists.module.scss'

type SePurchaseListDetailProps = {
  lists: ReturnType<typeof usePurchaseLists>
  list: PurchaseList
}

/** One list: add SKUs, edit quantities, add to cart; rename / share / delete for its owner. */
export function SePurchaseListDetail({ lists, list }: SePurchaseListDetailProps) {
  const lines = usePurchaseListLines(list, lists.money)
  const [term, setTerm] = useState('')
  const search = usePurchaseListSearch(term)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(list.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [message, setMessage] = useState('')

  const report = (result: PurchaseListActionResult) => setMessage(result.ok ? '' : PURCHASE_LIST_ERROR_MESSAGES[result.error])
  const error = message || (lists.saveError ? PURCHASE_LIST_ERROR_MESSAGES[lists.saveError] : '')

  return (
    <div className={styles.detail}>
      <button type="button" className={styles.back} onClick={() => lists.select(null)}>
        ← All purchase lists
      </button>

      <header className={styles.header}>
        {renaming ? (
          <form
            className={styles.renameForm}
            onSubmit={async (event) => {
              event.preventDefault()
              const result = await lists.rename(list.documentId, name)
              report(result)
              if (result.ok) setRenaming(false)
            }}
          >
            <input value={name} maxLength={100} autoFocus aria-label="List name" onChange={(event) => setName(event.target.value)} />
            <button type="submit" className={styles.primary} disabled={!name.trim()}>
              Save
            </button>
            <button type="button" className={styles.secondary} onClick={() => setRenaming(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <div>
            <h1>{list.name}</h1>
            <p>
              {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
              {!list.isOwner && ` · shared by ${list.ownerEmail}`}
            </p>
          </div>
        )}

        {list.isOwner && !renaming && (
          <div className={styles.ownerActions}>
            <label className={styles.visibility}>
              <span>Access</span>
              <select
                value={list.visibility}
                onChange={async (event) =>
                  report(await lists.setVisibility(list.documentId, event.target.value as PurchaseListVisibility))
                }
              >
                <option value="private">Only me</option>
                <option value="organization">My organization</option>
              </select>
            </label>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                setName(list.name)
                setRenaming(true)
              }}
            >
              Rename
            </button>
            {confirmDelete ? (
              <span className={styles.confirm}>
                Delete this list?
                <button type="button" className={styles.danger} onClick={async () => report(await lists.remove(list.documentId))}>
                  Delete
                </button>
                <button type="button" className={styles.secondary} onClick={() => setConfirmDelete(false)}>
                  Keep
                </button>
              </span>
            ) : (
              <button type="button" className={styles.secondary} onClick={() => setConfirmDelete(true)}>
                Delete
              </button>
            )}
          </div>
        )}
      </header>

      {error && (
        <p
          className={styles.error}
          role="alert"
          onClick={() => {
            setMessage('')
            lists.clearSaveError()
          }}
        >
          {error}
        </p>
      )}

      <div className={styles.search}>
        <input
          type="search"
          value={term}
          placeholder="Add items by Ref ID"
          aria-label="Add items by Ref ID"
          onChange={(event) => setTerm(event.target.value)}
        />
        {term.trim().length >= search.minLength && !search.searching && (
          <ul className={styles.dropdown}>
            {search.results.length === 0 ? (
              <li className={styles.noResults}>No results found. Please try a different Ref ID.</li>
            ) : (
              search.results.map(({ product, sku }) => (
                <li key={sku.itemId}>
                  <button
                    type="button"
                    onClick={async () => {
                      lines.remember(product, sku)
                      setTerm('')
                      report(await lists.addItems(list.documentId, [{ skuId: sku.itemId, quantity: 1 }]))
                    }}
                  >
                    <strong>{sku.referenceCode ?? sku.itemId}</strong>
                    <span>{sku.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {list.items.length === 0 ? (
        <p className={styles.empty}>This list is empty. Search above to add items.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Ref ID</th>
              <th scope="col">Unit Price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Subtotal</th>
              <th scope="col">
                <span className={styles.visuallyHidden}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.lines.map(({ item, product, sku }) => (
              <tr key={item.skuId}>
                <td data-label="Item" className={styles.itemName}>
                  {product && sku ? (
                    <a href={purchaseListSkuHref(product, sku)}>
                      {sku.imageUrl && <img src={sku.imageUrl} alt="" width={40} height={40} loading="lazy" />}
                      {sku.name}
                    </a>
                  ) : lines.loadingProducts ? (
                    <span className={styles.skeleton} aria-label="Loading" />
                  ) : (
                    <span className={styles.unavailable}>SKU {item.skuId} (no longer available)</span>
                  )}
                </td>
                <td data-label="Ref ID">{sku?.referenceCode ?? '—'}</td>
                <td data-label="Unit Price">
                  {typeof sku?.price === 'number' ? formatPurchaseListMoney(sku.price, lists.money) : '—'}
                </td>
                <td data-label="Quantity">
                  <div className={styles.quantity}>
                    <button
                      type="button"
                      aria-label={`− ${sku?.name ?? item.skuId}`}
                      disabled={item.quantity <= 1}
                      onClick={() => lists.setItemQuantity(list.documentId, item.skuId, item.quantity - 1)}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={item.quantity}
                      aria-label={`Quantity ${sku?.name ?? item.skuId}`}
                      onChange={(event) => {
                        const value = event.target.valueAsNumber
                        if (value >= 1) lists.setItemQuantity(list.documentId, item.skuId, value)
                      }}
                    />
                    <button
                      type="button"
                      aria-label={`+ ${sku?.name ?? item.skuId}`}
                      onClick={() => lists.setItemQuantity(list.documentId, item.skuId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td data-label="Subtotal" className={styles.price}>
                  {typeof sku?.price === 'number' ? formatPurchaseListMoney(sku.price * item.quantity, lists.money) : '—'}
                </td>
                <td className={styles.actions}>
                  <button
                    type="button"
                    aria-label={`Remove ${sku?.name ?? item.skuId}`}
                    onClick={() => lists.setItemQuantity(list.documentId, item.skuId, 0)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer className={styles.footer}>
        <p>
          <strong>{lines.totalItems}</strong> items · Total <strong>{lines.total}</strong>
        </p>
        <button type="button" className={styles.primary} disabled={lines.totalItems === 0} onClick={lines.addAllToCart}>
          Add list to cart
        </button>
      </footer>
    </div>
  )
}
