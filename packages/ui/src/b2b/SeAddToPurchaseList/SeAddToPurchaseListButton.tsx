import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  ADD_TO_PURCHASE_LIST_ERROR_MESSAGES,
  useAddToPurchaseList,
  type AddToPurchaseListProduct,
  type AddToPurchaseListVisibility,
} from '@vtex-us-se/components/b2b'
import styles from './SeAddToPurchaseList.module.scss'

export type SeAddToPurchaseListLabels = {
  /** The button that opens the picker. */
  buttonLabel?: string
  drawerTitle?: string
  emptyMessage?: string
  newListLabel?: string
  createLabel?: string
  /** `{list}` is replaced with the list's name. */
  successMessage?: string
  /** SePurchaseLists' page: when set, a success links to the list there (`?list=<id>`). */
  listsUrl?: string
  viewListLabel?: string
  /** Shown to anonymous shoppers instead of the button (a link to `loginUrl`). */
  signedOutLabel?: string
  loginUrl?: string
}

export type SeAddToPurchaseListButtonProps = SeAddToPurchaseListLabels & {
  /** What gets saved: SKUs with no positive quantity are left out, repeated SKUs summed. */
  products: AddToPurchaseListProduct[]
  /** Replaces the trigger button's own class, to match the surrounding buttons. */
  className?: string
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

type Notice = { kind: 'success'; listName: string; documentId: string } | { kind: 'error'; message: string }

/**
 * "Add to a purchase list": a button that opens a drawer with the buyer's purchase lists (their
 * own and their organization's shared ones); picking one adds `products` to it, or a new list can
 * be created with them. Used by the SeAddToPurchaseList PDP section and by SeCheckStockAndPricing.
 */
export function SeAddToPurchaseListButton({
  products,
  className,
  buttonLabel = 'Add to a purchase list',
  drawerTitle = 'Add to a purchase list',
  emptyMessage = 'You have no purchase lists yet.',
  newListLabel = 'Create a new list',
  createLabel = 'Create and add',
  successMessage = 'Added to {list}.',
  listsUrl = '',
  viewListLabel = 'View list',
  signedOutLabel = 'Sign in to save to a purchase list',
  loginUrl = '/login',
}: SeAddToPurchaseListButtonProps) {
  const picker = useAddToPurchaseList(products)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<AddToPurchaseListVisibility>('private')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const { load } = picker

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    void load()
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, load])

  if (!picker.isLoggedIn) {
    return (
      <a className={className ?? styles.trigger} href={loginUrl} data-fs-se-add-to-purchase-list>
        {signedOutLabel}
      </a>
    )
  }

  const units = picker.items.reduce((sum, item) => sum + item.quantity, 0)

  const run = async (action: () => ReturnType<typeof picker.addTo>) => {
    setBusy(true)
    setNotice(null)
    const outcome = await action()
    setBusy(false)
    if (outcome.ok) {
      setNotice({ kind: 'success', listName: outcome.list.name, documentId: outcome.list.documentId })
      setCreating(false)
      setName('')
    } else {
      setNotice({ kind: 'error', message: ADD_TO_PURCHASE_LIST_ERROR_MESSAGES[outcome.error] })
    }
  }

  const submitNewList = (event: FormEvent) => {
    event.preventDefault()
    void run(() => picker.createWith(name, visibility))
  }

  const close = () => {
    setOpen(false)
    setCreating(false)
    setNotice(null)
  }

  return (
    <>
      <button
        type="button"
        className={className ?? styles.trigger}
        disabled={picker.items.length === 0}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        data-fs-se-add-to-purchase-list
      >
        {buttonLabel}
      </button>

      {open && (
        <div className={styles.overlay} onClick={close}>
          <aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.header}>
              <h2 id={titleId}>{drawerTitle}</h2>
              <button ref={closeRef} type="button" className={styles.close} aria-label="Close" onClick={close}>
                <CloseIcon />
              </button>
            </header>

            <div className={styles.body}>
              <p className={styles.summary}>
                {picker.items.length} {picker.items.length === 1 ? 'item' : 'items'} · {units} {units === 1 ? 'unit' : 'units'}
              </p>

              {notice?.kind === 'success' && (
                <p className={styles.success} role="status">
                  {successMessage.replace('{list}', notice.listName)}{' '}
                  {listsUrl && (
                    <a href={`${listsUrl}${listsUrl.includes('?') ? '&' : '?'}list=${encodeURIComponent(notice.documentId)}`}>
                      {viewListLabel}
                    </a>
                  )}
                </p>
              )}
              {notice?.kind === 'error' && (
                <p className={styles.error} role="alert">
                  {notice.message}
                </p>
              )}

              {picker.state === 'loading' || picker.state === 'idle' ? (
                <ul className={styles.lists} aria-busy="true">
                  {[0, 1, 2].map((key) => (
                    <li key={key}>
                      <span className={styles.skeleton} />
                    </li>
                  ))}
                </ul>
              ) : picker.state === 'error' ? (
                <p className={styles.error} role="alert">
                  {ADD_TO_PURCHASE_LIST_ERROR_MESSAGES.FAILED}
                </p>
              ) : picker.lists.length === 0 ? (
                <p className={styles.empty}>{emptyMessage}</p>
              ) : (
                <ul className={styles.lists}>
                  {picker.lists.map((list) => (
                    <li key={list.documentId}>
                      <button
                        type="button"
                        className={styles.list}
                        disabled={busy}
                        onClick={() => void run(() => picker.addTo(list.documentId))}
                      >
                        <span className={styles.listName}>{list.name}</span>
                        <span className={styles.listMeta}>
                          {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                          {list.visibility === 'organization' && <span className={styles.badge}>Shared</span>}
                          {!list.isOwner && <span>by {list.ownerEmail}</span>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className={styles.footer}>
              {creating ? (
                <form className={styles.createForm} onSubmit={submitNewList}>
                  <label>
                    <span>Name</span>
                    <input value={name} maxLength={100} required autoFocus onChange={(event) => setName(event.target.value)} />
                  </label>
                  <label>
                    <span>Access</span>
                    <select value={visibility} onChange={(event) => setVisibility(event.target.value as AddToPurchaseListVisibility)}>
                      <option value="private">Only me</option>
                      <option value="organization">My organization</option>
                    </select>
                  </label>
                  <div className={styles.formActions}>
                    <button type="button" className={styles.secondary} onClick={() => setCreating(false)}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.primary} disabled={busy || !name.trim()}>
                      {createLabel}
                    </button>
                  </div>
                </form>
              ) : (
                <button type="button" className={styles.secondary} disabled={busy} onClick={() => setCreating(true)}>
                  {newListLabel}
                </button>
              )}
            </footer>
          </aside>
        </div>
      )}
    </>
  )
}
