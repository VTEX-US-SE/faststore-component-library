export type RecentOrder = {
  orderId: string
  creationDate: string
  status: string
  /** In cents. */
  totalValue: number
  isAllDelivered: boolean
}

export type MonthlySpend = {
  month: string
  /** In cents. */
  totalValue: number
  totalOrders: number
}

export type OrderBadge = 'Processing' | 'Shipped' | 'Delivered' | 'Canceled' | 'Unknown'

const STATUS_BADGES: Record<Exclude<OrderBadge, 'Unknown'>, string[]> = {
  Processing: [
    'order-created',
    'order-accepted',
    'payment-approved',
    'ready-for-handling',
    'handling',
    'on-order-completed',
    'on-order-completed-ffm',
    'payment-pending',
    'window-to-change-payment',
    'window-to-change-seller',
    'waiting-for-authorization',
    'waiting-for-fulfillment',
    'waiting-ffmt-authorization',
    'waiting-for-manual-authorization',
    'authorize-fulfillment',
    'window-to-cancel',
    'ready-for-invoicing',
    'invoice',
    'start-handling',
    'request-cancel',
    'cancellation-requested',
    'waiting-for-mkt-authorization',
    'waiting-seller-handling',
  ],
  Shipped: ['invoiced'],
  Delivered: ['delivered', 'handover'],
  Canceled: ['canceling', 'canceled'],
}

/** Groups OMS's ~30 workflow statuses into the four a buyer cares about. */
export function orderBadge(status: string, isAllDelivered: boolean): OrderBadge {
  if (isAllDelivered) return 'Delivered'

  for (const [badge, statuses] of Object.entries(STATUS_BADGES)) {
    if (statuses.includes(status)) return badge as OrderBadge
  }
  return 'Unknown'
}

export type MoneyFormat = { locale: string; currency: string }

/** `cents` as a currency string, e.g. 1234567 → "$12,345.67". */
export function formatCents(cents: number, { locale, currency }: MoneyFormat): string {
  return (cents / 100).toLocaleString(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
}

/** `cents` as a short axis label, e.g. 1234567 → "$12.3K". */
export function formatCentsShort(cents: number, { locale, currency }: MoneyFormat): string {
  const value = cents / 100
  const [divisor, suffix] =
    value >= 1e9 ? [1e9, 'B'] : value >= 1e6 ? [1e6, 'M'] : value >= 1e3 ? [1e3, 'K'] : [1, '']
  const shortened = value / divisor
  const digits = shortened % 1 === 0 ? 0 : 1

  return (
    shortened.toLocaleString(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }) + suffix
  )
}

export const SPEND_CHART = { width: 600, height: 300, margin: { top: 8, right: 8, bottom: 24, left: 56 } } as const

const GRID_LINES = 4
const BAR_RADIUS = 8

function roundedTopBarPath(x: number, y: number, width: number, height: number): string {
  if (height <= 0) return ''
  const r = Math.min(BAR_RADIUS, width / 2, height)
  return (
    `M ${x},${y + height} L ${x},${y + r} Q ${x},${y} ${x + r},${y} ` +
    `L ${x + width - r},${y} Q ${x + width},${y} ${x + width},${y + r} L ${x + width},${y + height} Z`
  )
}

export type SpendChart = {
  bars: Array<{ key: string; month: string; path: string; labelX: number }>
  gridLines: Array<{ key: number; y: number; label: string }>
}

/** SVG geometry for the monthly spend bar chart, in SPEND_CHART's viewBox coordinates. */
export function buildSpendChart(months: MonthlySpend[], money: MoneyFormat): SpendChart | null {
  if (months.length === 0) return null

  const { width, height, margin } = SPEND_CHART
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const maxValue = (Math.max(...months.map((entry) => entry.totalValue)) || 1) * 1.1
  const slotWidth = plotWidth / months.length
  const barWidth = slotWidth * 0.5

  const bars = months.map((entry, index) => {
    const barHeight = (entry.totalValue / maxValue) * plotHeight
    const x = margin.left + index * slotWidth + (slotWidth - barWidth) / 2
    return {
      key: `${entry.month}-${index}`,
      month: entry.month,
      path: roundedTopBarPath(x, margin.top + plotHeight - barHeight, barWidth, barHeight),
      labelX: x + barWidth / 2,
    }
  })

  const gridLines = Array.from({ length: GRID_LINES + 1 }, (_, i) => ({
    key: i,
    y: margin.top + plotHeight * (1 - i / GRID_LINES),
    label: formatCentsShort(maxValue * (i / GRID_LINES), money),
  }))

  return { bars, gridLines }
}

type CacheEntry<T> = { data: T; timestamp: number; userEmail: string }

/**
 * Per-shopper localStorage cache, so every page view doesn't hit OMS (orders) or the
 * spend-overview service. An entry for a different user, an expired entry, or anything
 * unparseable (storage disabled, an older format) is treated as a miss.
 */
export function readShopperCache<T>(key: string, userEmail: string, maxAgeMs: number): T | undefined {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return undefined
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (entry.userEmail !== userEmail || Date.now() - entry.timestamp > maxAgeMs) return undefined
    return entry.data
  } catch {
    return undefined
  }
}

export function writeShopperCache<T>(key: string, userEmail: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), userEmail }
    window.localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // Storage full or disabled: the widget still works, it just refetches next time.
  }
}
