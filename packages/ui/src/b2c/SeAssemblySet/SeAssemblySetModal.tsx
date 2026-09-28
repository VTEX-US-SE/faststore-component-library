import { Icon } from '@faststore/ui'
import styles from './SeAssemblySet.module.scss'

export interface SeAssemblySetModalLine {
  name: string
  quantity: number
}

export interface SeAssemblySetModalProps {
  isOpen: boolean
  setName?: string
  sets: number
  lines: SeAssemblySetModalLine[]
  formattedTotal?: string
  notice?: string
  checkoutHref: string
  onKeepCustomizing: () => void
}

/**
 * Confirmation after a composed set reaches the cart.
 *
 * The cart sidebar cannot stand in for this: FastStore's cart model has no concept of an
 * assembly binding, so it would list the children as unrelated products and hide the fact
 * that they form a set. This shows the set as one thing and then hands over to Checkout,
 * which does understand the binding.
 *
 * A self-contained overlay rather than `@faststore/ui`'s `Modal`: that component reads a
 * `useUI()` context only a real FastStore app shell provides (its own root layout wires it
 * up), so it throws ("Missing UI context on React tree") anywhere else — including here,
 * standalone, and in Storybook.
 */
export function SeAssemblySetModal({
  isOpen,
  setName,
  sets,
  lines,
  formattedTotal,
  notice,
  checkoutHref,
  onKeepCustomizing,
}: SeAssemblySetModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalOverlay} role="presentation" onClick={onKeepCustomizing}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="se-assembly-set-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modal__header}>
          <h2 id="se-assembly-set-modal-title">Added to cart</h2>
          <button type="button" className={styles.modal__close} onClick={onKeepCustomizing} aria-label="Close">
            &times;
          </button>
        </div>

        <p className={styles.modal__set}>
          <Icon name="CheckCircle" width={20} height={20} />
          {sets > 1 ? `${sets} × ${setName}` : setName}
        </p>

        <ul className={styles.modal__lines}>
          {lines.map((line) => (
            <li key={line.name}>
              <span>{line.name}</span>
              <span>× {line.quantity}</span>
            </li>
          ))}
        </ul>

        {formattedTotal && (
          <p className={styles.modal__total}>
            <span>Cart total</span>
            <strong>{formattedTotal}</strong>
          </p>
        )}

        {notice && <p className={styles.modal__notice}>{notice}</p>}

        <div className={styles.modal__actions}>
          <button type="button" className={styles.modal__secondary} onClick={onKeepCustomizing}>
            Keep customizing
          </button>
          <a href={checkoutHref} className={styles.modal__primary}>
            Checkout
          </a>
        </div>
      </div>
    </div>
  )
}
