import { useAssemblySet } from '@vtex-us-se/components'
import { SeAssemblySetGroup } from './SeAssemblySetGroup'
import { SeAssemblySetModal } from './SeAssemblySetModal'
import { SeAssemblySetSkeleton } from './SeAssemblySetSkeleton'
import { SeAssemblySetStepper } from './SeAssemblySetStepper'
import styles from './SeAssemblySet.module.scss'

export interface SeAssemblySetProps {
  /** Parent SKU carrying the VTEX assembly option (catalog attachment). */
  skuId: string
  headline?: string
  hint?: string
  completeHint?: string
  ctaLabel?: string
  /** Initial number of set copies. Defaults to 1. */
  initialSets?: number
  /** Where the confirmation modal's "Checkout" action sends the shopper. Defaults to `/checkout`. */
  checkoutUrl?: string
  className?: string
}

/**
 * Customisable set builder ("Build your own..."). Reads the VTEX assembly option declared
 * on the parent SKU, renders one card per eligible child, and enforces each group's own
 * min/max as the add-to-cart gate. The composition is catalog data, so adding or removing a
 * product from the set is an Admin change -- nothing here is hardcoded per set.
 */
export function SeAssemblySet({
  skuId,
  headline,
  hint,
  completeHint,
  ctaLabel = 'Add to cart',
  initialSets = 1,
  checkoutUrl = '/checkout',
  className,
}: SeAssemblySetProps) {
  const {
    isLoading,
    product,
    groups,
    quantities,
    onChangeQuantity,
    sets,
    increaseSets,
    decreaseSets,
    total,
    canAddToCart,
    adding,
    error,
    added,
    dismissAdded,
    checkoutHref,
    handleAddToSet,
    formatAmount,
  } = useAssemblySet({ skuId, initialSets, checkoutUrl })

  if (isLoading) {
    return <SeAssemblySetSkeleton />
  }

  if (groups.length === 0) {
    return null
  }

  const productImage = product?.image?.[0]

  return (
    <section className={[styles.assemblySet, className].filter(Boolean).join(' ')}>
      <div className={styles.assemblySet__inner}>
        <aside className={styles.assemblySet__aside}>
          {productImage && (
            <img className={styles.assemblySet__asideImage} src={productImage.url} alt={productImage.alternateName ?? product?.name ?? ''} />
          )}
          <h1 className={styles.assemblySet__title}>{product?.name}</h1>
          <p className={styles.assemblySet__subtitle}>Customize your {product?.name}</p>
        </aside>

        <div className={styles.assemblySet__panel}>
          {groups.map((group) => (
            <SeAssemblySetGroup
              key={group.name}
              group={group}
              quantities={quantities}
              headline={headline}
              hint={hint}
              completeHint={completeHint}
              onChange={onChangeQuantity}
            />
          ))}

          <div className={styles.assemblySet__summary}>
            <h2 className={styles.assemblySet__summaryTitle}>Customization Details</h2>

            <div className={styles.assemblySet__row}>
              <span>Total</span>
              <strong className={styles.assemblySet__price}>{formatAmount(total)}</strong>
            </div>

            <div className={styles.assemblySet__row}>
              <span>Quantity of Customized Sets</span>
              <SeAssemblySetStepper
                value={sets}
                canDecrease={sets > 1}
                decreaseLabel="Fewer sets"
                increaseLabel="More sets"
                onDecrease={decreaseSets}
                onIncrease={increaseSets}
              />
            </div>
          </div>

          <div className={styles.assemblySet__actions}>
            <button type="button" className={styles.assemblySet__cta} disabled={!canAddToCart || adding} onClick={handleAddToSet}>
              {adding ? 'Adding…' : ctaLabel}
            </button>

            {error && <p className={styles.assemblySet__error}>Something went wrong. Please try again.</p>}
          </div>
        </div>
      </div>

      <SeAssemblySetModal
        isOpen={added !== null}
        setName={product?.name}
        sets={sets}
        lines={groups
          .flatMap((group) => group.items)
          .filter((item) => (quantities[item.skuId] ?? 0) > 0)
          .map((item) => ({ name: item.product?.name ?? item.skuId, quantity: quantities[item.skuId] ?? 0 }))}
        formattedTotal={added ? formatAmount(added.total) : undefined}
        notice={added?.notice}
        checkoutHref={checkoutHref}
        onKeepCustomizing={dismissAdded}
      />
    </section>
  )
}
