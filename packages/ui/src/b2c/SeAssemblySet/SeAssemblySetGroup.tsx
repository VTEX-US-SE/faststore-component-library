import { expandTokens, groupTotal } from '@vtex-us-se/components'
import type { AssemblyGroup, QuantityChangeHandler } from '@vtex-us-se/components'
import { SeAssemblySetItemCard } from './SeAssemblySetItemCard'
import styles from './SeAssemblySet.module.scss'

export interface SeAssemblySetGroupProps {
  group: AssemblyGroup
  quantities: Record<string, number>
  headline?: string
  hint?: string
  completeHint?: string
  onChange: QuantityChangeHandler
}

/**
 * One independent min/max gate from the catalog composition: headline, progress bar and
 * the grid of eligible children.
 */
export function SeAssemblySetGroup({ group, quantities, headline, hint, completeHint, onChange }: SeAssemblySetGroupProps) {
  const total = groupTotal(group, quantities)
  const remaining = group.maxQuantity - total
  const complete = group.maxQuantity > 0 && total >= group.maxQuantity
  const hintText = (complete && completeHint) || hint
  const tokens = { min: group.minQuantity, max: group.maxQuantity, selected: total }

  return (
    <div className={styles.setGroup}>
      <div>
        <h2 className={styles.setGroup__headline}>{expandTokens(headline || group.name, tokens)}</h2>

        <div className={styles.setGroup__progressBox}>
          <div
            className={styles.setGroup__progress}
            role="progressbar"
            aria-valuenow={total}
            aria-valuemin={0}
            aria-valuemax={group.maxQuantity}
            aria-label={`${total} of ${group.maxQuantity} selected`}
          >
            <span
              className={styles.setGroup__progressFill}
              data-complete={complete}
              style={{ width: `${Math.min((total / group.maxQuantity) * 100, 100)}%` }}
            />
          </div>

          {hintText && (
            <p className={styles.setGroup__hint} data-complete={complete}>
              {expandTokens(hintText, tokens)}
            </p>
          )}
        </div>
      </div>

      <ul className={styles.setGroup__grid}>
        {group.items.map((item) => (
          <SeAssemblySetItemCard
            key={item.skuId}
            item={item}
            quantity={quantities[item.skuId] ?? 0}
            groupRemaining={remaining}
            onChange={onChange}
          />
        ))}
      </ul>
    </div>
  )
}
