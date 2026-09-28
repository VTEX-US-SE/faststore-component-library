import { isInStock } from '@vtex-us-se/components'
import type { AssemblyItem, QuantityChangeHandler } from '@vtex-us-se/components'
import { SeAssemblySetStepper } from './SeAssemblySetStepper'
import styles from './SeAssemblySet.module.scss'

export interface SeAssemblySetItemCardProps {
  item: AssemblyItem
  quantity: number
  groupRemaining: number
  onChange: QuantityChangeHandler
}

/** One child product of a group, with its own min/max-clamped stepper. */
export function SeAssemblySetItemCard({ item, quantity, groupRemaining, onChange }: SeAssemblySetItemCardProps) {
  const { product } = item

  if (!product) {
    return null
  }

  const image = product.image?.[0]
  const outOfStock = !isInStock(item)

  return (
    <li className={styles.itemCard}>
      {image && (
        <img className={styles.itemCard__image} src={image.url} alt={image.alternateName ?? product.name} loading="lazy" />
      )}
      <p className={styles.itemCard__name}>{product.name}</p>

      {outOfStock ? (
        <p className={styles.itemCard__outOfStock}>Out of Stock</p>
      ) : (
        <SeAssemblySetStepper
          value={quantity}
          announce
          canDecrease={quantity > item.minQuantity}
          canIncrease={quantity < item.maxQuantity && groupRemaining > 0}
          decreaseLabel={`Remove one ${product.name}`}
          increaseLabel={`Add one ${product.name}`}
          onDecrease={() => onChange(item.skuId, quantity - 1)}
          onIncrease={() => onChange(item.skuId, quantity + 1)}
        />
      )}
    </li>
  )
}
