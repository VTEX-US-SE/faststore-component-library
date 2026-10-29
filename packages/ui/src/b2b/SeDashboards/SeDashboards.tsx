import { useEffect, useId, useState, type ReactNode } from 'react'
import {
  formatPercent,
  lowStockProductHref,
  useDashboardsSession,
  useDashboardSummary,
  useLowStockItems,
} from '@vtex-us-se/components/b2b'
import styles from './SeDashboards.module.scss'

export type SeDashboardsProps = {
  openOrdersTitle?: string
  /** Where the open-orders tile links (the account's orders page, filtered to open statuses). */
  openOrdersUrl?: string
  lowStockTitle?: string
  /** Label before each SKU's remaining quantity in the low-stock drawer. */
  unitsLeftLabel?: string
  spendTitle?: string
  /** Shown after the remaining-budget percentage. */
  remainingLabel?: string
  /** Budgets page; `{unitId}` and `{customerId}` are replaced from the B2B session. */
  budgetsUrl?: string
  pendingApprovalTitle?: string
  pendingApprovalUrl?: string
}

const ICON_PATHS = {
  openOrders:
    'M14 2v4a2 2 0 0 0 2 2h4M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3m4 7v2.2l1.6 1M14 16a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z',
  lowStock:
    'M22 12h-6l-2 3h-4l-2-3H2m20 0v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6m20 0-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11L2 12',
  spend: 'M14 2v4a2 2 0 0 0 2 2h4M10 9H8m8 4H8m8 4H8m7-15H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-5-5Z',
  pendingApproval:
    'M12 9v4l2 2M5 3 2 6m20 0-3-3M6.38 18.7 4 21m13.64-2.33L20 21m0-8a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
}

function TileIcon({ path }: { path: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** A tile's big number: a pulse while loading, a dash when it couldn't be loaded. */
function TileValue({ loading, children }: { loading: boolean; children: ReactNode }) {
  if (loading) return <span className={styles.skeleton} aria-label="Loading" />
  return <span className={styles.value}>{children ?? '—'}</span>
}

type TileProps = { title: string; iconPath: string; href?: string; onClick?: () => void; children: ReactNode }

function Tile({ title, iconPath, href, onClick, children }: TileProps) {
  const content = (
    <>
      <span className={styles.heading}>
        <TileIcon path={iconPath} />
        <span className={styles.tileTitle}>{title}</span>
      </span>
      {children}
    </>
  )

  if (href) {
    return (
      <a className={styles.tile} href={href}>
        {content}
      </a>
    )
  }
  if (onClick) {
    return (
      <button type="button" className={styles.tile} onClick={onClick}>
        {content}
      </button>
    )
  }
  return <div className={styles.tile}>{content}</div>
}

/**
 * Buyer Portal home tiles for the signed-in buyer: open orders, low-stock alerts (opens a
 * drawer listing the SKUs), remaining budget, and orders pending approval. Renders nothing
 * outside a B2B session. On narrow screens the tiles become a horizontal scroll-snap row (the
 * kit's Swiper carousel imported global CSS from inside the component, which Next.js rejects).
 *
 * Needs GraphQL of its own, so it must be added with `se-components add SeDashboards` (source
 * copy, query text inlined) plus `se-components add-resolver dashboards`.
 */
export function SeDashboards({
  openOrdersTitle = 'Open Orders',
  openOrdersUrl = '/pvt/account/orders?status=order+placed&status=payment+pending&status=pending+approval&status=payment+denied&status=payment+approved&status=ready+for+delivery',
  lowStockTitle = 'Low Stock Alerts',
  unitsLeftLabel = 'Units left:',
  spendTitle = 'Spend Overview',
  remainingLabel = 'remaining',
  budgetsUrl = '/pvt/organization-account/budgets/{unitId}/{customerId}',
  pendingApprovalTitle = 'Orders Pending Approval',
  pendingApprovalUrl = '/pvt/account/orders?status=pending+approval',
}: SeDashboardsProps) {
  const { userEmail, unitId, customerId } = useDashboardsSession()
  const summary = useDashboardSummary(userEmail, unitId)
  const { items: lowStock, state: lowStockState } = useLowStockItems(userEmail)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerTitleId = useId()

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  if (!userEmail) return null

  const summaryLoading = summary === undefined
  const resolvedBudgetsUrl = budgetsUrl
    .replace('{unitId}', encodeURIComponent(unitId ?? ''))
    .replace('{customerId}', encodeURIComponent(customerId ?? ''))

  return (
    <section className={styles.dashboards} data-fs-se-dashboards>
      <div className={styles.tiles}>
        <Tile title={openOrdersTitle} iconPath={ICON_PATHS.openOrders} href={openOrdersUrl}>
          <TileValue loading={summaryLoading}>{summary?.openOrders}</TileValue>
        </Tile>

        <Tile
          title={lowStockTitle}
          iconPath={ICON_PATHS.lowStock}
          onClick={lowStock?.lowStockCount ? () => setDrawerOpen(true) : undefined}
        >
          <TileValue loading={lowStockState === 'loading'}>{lowStock?.lowStockCount}</TileValue>
        </Tile>

        <Tile title={spendTitle} iconPath={ICON_PATHS.spend} href={unitId ? resolvedBudgetsUrl : undefined}>
          <TileValue loading={summaryLoading}>
            {summary?.budgetRemainingPercent == null ? null : (
              <>
                {formatPercent(summary.budgetRemainingPercent)} <span className={styles.unit}>{remainingLabel}</span>
              </>
            )}
          </TileValue>
        </Tile>

        <Tile title={pendingApprovalTitle} iconPath={ICON_PATHS.pendingApproval} href={pendingApprovalUrl}>
          <TileValue loading={summaryLoading}>{summary?.pendingApproval}</TileValue>
        </Tile>
      </div>

      {drawerOpen && lowStock && (
        <div className={styles.overlay} onClick={() => setDrawerOpen(false)}>
          <div
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.drawerHeader}>
              <h2 id={drawerTitleId}>{lowStockTitle}</h2>
              <button type="button" className={styles.close} aria-label="Close" onClick={() => setDrawerOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M12 4 4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </header>
            <ul className={styles.lowStockList}>
              {lowStock.stockBySku.map((item) => {
                const href = lowStockProductHref(item)
                const body = (
                  <>
                    {item.sku.imageUrl ? <img src={item.sku.imageUrl} alt="" loading="lazy" /> : <span className={styles.noImage} />}
                    <span className={styles.itemData}>
                      <span className={styles.itemName}>{item.sku.name}</span>
                      <span className={styles.itemUnits}>
                        {unitsLeftLabel} {item.total}
                      </span>
                    </span>
                  </>
                )
                return (
                  <li key={item.sku.id}>
                    {href ? (
                      <a className={styles.item} href={href}>
                        {body}
                      </a>
                    ) : (
                      <div className={styles.item}>{body}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
