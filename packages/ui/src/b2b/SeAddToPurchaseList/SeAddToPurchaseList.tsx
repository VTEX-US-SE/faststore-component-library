import { usePdpPurchaseListProducts, type AddToPurchaseListProduct } from '@vtex-us-se/components/b2b'
import { SeAddToPurchaseListButton, type SeAddToPurchaseListLabels } from './SeAddToPurchaseListButton'
import styles from './SeAddToPurchaseList.module.scss'

export type SeAddToPurchaseListProps = SeAddToPurchaseListLabels & {
  /** Units of the PDP's current SKU to save. */
  quantity?: number
  /** Saves these instead of the PDP's current SKU (for use outside a PDP, from code). */
  products?: AddToPurchaseListProduct[]
}

/**
 * B2B PDP section: an "Add to a purchase list" button for the product's currently selected SKU.
 * See SeAddToPurchaseListButton for the picker itself.
 *
 * Needs GraphQL of its own, so it must be added with `se-components add SeAddToPurchaseList` plus
 * `se-components add-resolver purchaseLists`. Reads FastStore's PDP context, so it only works as
 * a section of the PDP (or with `products` passed in).
 */
export function SeAddToPurchaseList({ quantity = 1, products, ...labels }: SeAddToPurchaseListProps) {
  const pdpProducts = usePdpPurchaseListProducts(quantity)
  return (
    <section className={styles.section} data-fs-se-add-to-purchase-list-section>
      <SeAddToPurchaseListButton products={products ?? pdpProducts} {...labels} />
    </section>
  )
}
