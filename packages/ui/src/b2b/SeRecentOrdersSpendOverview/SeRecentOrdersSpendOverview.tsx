import { useMemo } from 'react'
import {
  buildSpendChart,
  formatCents,
  orderBadge,
  SPEND_CHART,
  useB2bShopper,
  useRecentOrders,
  useSpendOverview,
} from '@vtex-us-se/components/b2b'
import styles from './SeRecentOrdersSpendOverview.module.scss'

export type SeRecentOrdersSpendOverviewProps = {
  recentOrdersTitle?: string
  viewAllLabel?: string
  /** Where "View all" points. Each order links to `${ordersUrl}/${orderId}`. */
  ordersUrl?: string
  /** How many orders to list (1–15). */
  ordersLimit?: number
  emptyOrdersMessage?: string
  spendOverviewTitle?: string
}

function RecentOrdersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8m0 0V3m0 5h5m4-1v5l4 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function OrderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2.75 5.83 10 10m0 0 7.25-4.17M10 10v8.33m7.5-11.66a1.67 1.67 0 0 0-.83-1.44l-5.84-3.34a1.67 1.67 0 0 0-1.66 0L3.33 5.23a1.67 1.67 0 0 0-.83 1.44v6.66a1.67 1.67 0 0 0 .83 1.44l5.84 3.34a1.67 1.67 0 0 0 1.66 0l5.84-3.34a1.67 1.67 0 0 0 .83-1.44V6.67Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SpendOverviewIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3v16a2 2 0 0 0 2 2h16M19 9l-5 5-4-4-3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Buyer Portal home widget: the signed-in buyer's latest orders next to a month-by-month spend
 * chart. Renders nothing outside a B2B session. The chart panel is hidden when the account has
 * no spend-overview service (see the resolvers package's `recentOrdersSpendOverview`).
 *
 * Needs GraphQL of its own, so it must be added with `se-components add
 * SeRecentOrdersSpendOverview` (source copy, query text inlined) plus `se-components
 * add-resolver recentOrdersSpendOverview` — a plain npm import can't be seen by the project's
 * GraphQL codegen.
 */
export function SeRecentOrdersSpendOverview({
  recentOrdersTitle = 'Recent Orders',
  viewAllLabel = 'View All',
  ordersUrl = '/pvt/account/orders',
  ordersLimit = 5,
  emptyOrdersMessage = 'No orders yet.',
  spendOverviewTitle = 'Spend Overview (MTD)',
}: SeRecentOrdersSpendOverviewProps) {
  const { userEmail, money } = useB2bShopper()
  const { orders, state: ordersState } = useRecentOrders(userEmail, ordersLimit)
  const { months, state: spendState } = useSpendOverview(userEmail)
  const { locale, currency } = money
  const chart = useMemo(() => buildSpendChart(months, { locale, currency }), [months, locale, currency])

  if (!userEmail) return null

  return (
    <section className={styles.recentOrdersSpendOverview} data-fs-se-recent-orders-spend-overview>
      <section className={`${styles.panel} ${styles.recentOrders}`} aria-busy={ordersState === 'loading'}>
        <div className={styles.heading}>
          <div className={styles.title}>
            <RecentOrdersIcon />
            <h3>{recentOrdersTitle}</h3>
          </div>
          <a className={styles.viewAll} href={ordersUrl}>
            {viewAllLabel}
          </a>
        </div>

        {ordersState === 'ready' && orders.length === 0 && <p className={styles.empty}>{emptyOrdersMessage}</p>}

        <ul className={styles.ordersList}>
          {orders.map(({ orderId, creationDate, status, totalValue, isAllDelivered }) => {
            const badge = orderBadge(status, isAllDelivered)
            return (
              <li className={styles.order} key={orderId}>
                <div className={styles.orderDetails}>
                  <OrderIcon />
                  <div>
                    <a href={`${ordersUrl}/${orderId}`}>{orderId}</a>
                    <span>{creationDate.slice(0, 10)}</span>
                  </div>
                </div>
                <div className={styles.status}>
                  <span data-status={badge}>{badge}</span>
                </div>
                <div className={styles.value}>{formatCents(totalValue, money)}</div>
              </li>
            )
          })}
        </ul>
      </section>

      {spendState !== 'error' && (
        <section className={`${styles.panel} ${styles.spendOverview}`} aria-busy={spendState === 'loading'}>
          <div className={styles.heading}>
            <div className={styles.title}>
              <SpendOverviewIcon />
              <h3>{spendOverviewTitle}</h3>
            </div>
          </div>

          {chart && (
            <svg
              className={styles.chart}
              viewBox={`0 0 ${SPEND_CHART.width} ${SPEND_CHART.height}`}
              width="100%"
              height={SPEND_CHART.height}
              preserveAspectRatio="none"
              role="img"
              aria-label={spendOverviewTitle}
            >
              {chart.gridLines.map((line) => (
                <g key={line.key}>
                  <line
                    className={styles.gridLine}
                    x1={SPEND_CHART.margin.left}
                    x2={SPEND_CHART.width - SPEND_CHART.margin.right}
                    y1={line.y}
                    y2={line.y}
                  />
                  <text
                    className={styles.axisLabel}
                    x={SPEND_CHART.margin.left - 8}
                    y={line.y}
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {line.label}
                  </text>
                </g>
              ))}
              {chart.bars.map((bar) => (
                <g key={bar.key}>
                  <path className={styles.bar} d={bar.path} />
                  <text
                    className={styles.axisLabel}
                    x={bar.labelX}
                    y={SPEND_CHART.height - SPEND_CHART.margin.bottom + 16}
                    textAnchor="middle"
                  >
                    {bar.month}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </section>
      )}
    </section>
  )
}
