import { Skeleton } from '@faststore/ui'
import styles from './SeAssemblySet.module.scss'

export interface SeAssemblySetSkeletonProps {
  items?: number
}

/**
 * Placeholder for the set builder. The real group count is not known until the query
 * resolves, so one group is always drawn.
 */
export function SeAssemblySetSkeleton({ items = 4 }: SeAssemblySetSkeletonProps) {
  return (
    <section className={styles.assemblySet}>
      <div className={styles.assemblySet__inner}>
        <div className={styles.assemblySet__aside}>
          <Skeleton size={{ width: '100%', height: '14rem' }} />
          <Skeleton size={{ width: '70%', height: '2rem' }} />
          <Skeleton size={{ width: '50%', height: '1rem' }} />
        </div>

        <div className={styles.assemblySet__panel}>
          <div className={styles.setGroup}>
            <Skeleton size={{ width: '60%', height: '1.75rem' }} />
            <Skeleton size={{ width: '100%', height: '0.375rem' }} border="pill" />
            <Skeleton size={{ width: '45%', height: '0.875rem' }} />

            <ul className={styles.setGroup__grid}>
              {Array.from({ length: items }, (_, index) => (
                <li key={index} className={styles.itemCard}>
                  <Skeleton size={{ width: '100%', height: '4.6875rem' }} />
                  <Skeleton size={{ width: '100%', height: '0.875rem' }} />
                  <Skeleton size={{ width: '55%', height: '0.875rem' }} />
                  <Skeleton size={{ width: '6.1875rem', height: '3.125rem' }} />
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.assemblySet__summary}>
            <Skeleton size={{ width: '14rem', height: '1.5rem' }} />
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className={styles.assemblySet__row}>
                <Skeleton size={{ width: '9rem', height: '1rem' }} />
                <Skeleton size={{ width: '4rem', height: '1rem' }} />
              </div>
            ))}
          </div>

          <Skeleton size={{ width: '100%', height: '3rem' }} />
        </div>
      </div>
    </section>
  )
}
