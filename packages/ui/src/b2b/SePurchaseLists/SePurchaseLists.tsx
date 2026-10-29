import { useState, type FormEvent } from 'react'
import { PURCHASE_LIST_ERROR_MESSAGES, usePurchaseLists, type PurchaseListVisibility } from '@vtex-us-se/components/b2b'
import { SePurchaseListDetail } from './SePurchaseListDetail'
import styles from './SePurchaseLists.module.scss'

export type SePurchaseListsProps = {
  title?: string
  description?: string
  newListLabel?: string
  emptyMessage?: string
  signedOutMessage?: string
  loginUrl?: string
  loginLabel?: string
}

/**
 * Buyer Portal purchase lists: the buyer's own lists and their organization's shared ones, a
 * form to create one, and a detail view (opened in place, deep-linkable with `?list=`) to add SKUs
 * by reference code, change quantities, add the whole list to the cart, and -- for the owner --
 * rename, share with the organization, or delete it.
 *
 * Needs GraphQL of its own, so it must be added with `se-components add SePurchaseLists` plus
 * `se-components add-resolver purchaseLists` and `se-components add-resolver b2bProductFields`.
 * Lists are stored in the Master Data `PL` entity, through the app key/token in
 * FS_DISCOVERY_APP_KEY / FS_DISCOVERY_APP_TOKEN.
 */
export function SePurchaseLists({
  title = 'Purchase Lists',
  description = 'Save the items you order regularly and add them to the cart in one click.',
  newListLabel = 'New list',
  emptyMessage = 'You have no purchase lists yet.',
  signedOutMessage = 'Sign in to see your purchase lists.',
  loginUrl = '/login',
  loginLabel = 'Sign in',
}: SePurchaseListsProps) {
  const lists = usePurchaseLists()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<PurchaseListVisibility>('private')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!lists.isLoggedIn) {
    return (
      <section className={styles.signedOut} data-fs-se-purchase-lists>
        <p>{signedOutMessage}</p>
        <a className={styles.primary} href={loginUrl}>
          {loginLabel}
        </a>
      </section>
    )
  }

  if (lists.selected) {
    return (
      <section className={styles.page} data-fs-se-purchase-lists>
        <SePurchaseListDetail lists={lists} list={lists.selected} />
      </section>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = await lists.create(name, visibility)
    setBusy(false)
    if (result.ok) {
      setCreating(false)
      setName('')
    } else {
      setError(PURCHASE_LIST_ERROR_MESSAGES[result.error])
    }
  }

  return (
    <section className={styles.page} data-fs-se-purchase-lists>
      <header className={styles.header}>
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {!creating && (
          <button type="button" className={styles.primary} onClick={() => setCreating(true)}>
            {newListLabel}
          </button>
        )}
      </header>

      {creating && (
        <form className={styles.createForm} onSubmit={submit}>
          <label>
            <span>Name</span>
            <input value={name} maxLength={100} required autoFocus onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            <span>Access</span>
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as PurchaseListVisibility)}>
              <option value="private">Only me</option>
              <option value="organization">My organization</option>
            </select>
          </label>
          <div className={styles.formActions}>
            <button type="button" className={styles.secondary} onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="submit" className={styles.primary} disabled={busy || !name.trim()}>
              Create
            </button>
          </div>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </form>
      )}

      {lists.state === 'loading' ? (
        <div className={styles.grid} aria-busy="true">
          {[0, 1, 2].map((key) => (
            <span key={key} className={styles.cardSkeleton} />
          ))}
        </div>
      ) : lists.state === 'error' ? (
        <p className={styles.error} role="alert">
          {PURCHASE_LIST_ERROR_MESSAGES.FAILED}
        </p>
      ) : lists.lists.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ul className={styles.grid}>
          {lists.lists.map((list) => (
            <li key={list.documentId}>
              <button type="button" className={styles.card} onClick={() => lists.select(list.documentId)}>
                <span className={styles.cardName}>{list.name}</span>
                <span className={styles.cardMeta}>
                  {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                </span>
                <span className={styles.badges}>
                  <span className={styles.badge} data-visibility={list.visibility}>
                    {list.visibility === 'organization' ? 'Shared' : 'Private'}
                  </span>
                  {!list.isOwner && <span className={styles.owner}>by {list.ownerEmail}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
