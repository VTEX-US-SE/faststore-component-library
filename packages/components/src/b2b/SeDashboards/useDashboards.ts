import { useEffect, useRef, useState } from 'react'
import { gql } from '@faststore/core/api'
import { useLazyQuery_unstable, useSession_unstable } from '@faststore/core/experimental'
import { SE_DASHBOARD_SUMMARY_QUERY, SE_LOW_STOCK_ITEMS_QUERY } from '@vtex-us-se/resolvers/b2b'

const DASHBOARD_SUMMARY_QUERY = gql(SE_DASHBOARD_SUMMARY_QUERY)
const LOW_STOCK_ITEMS_QUERY = gql(SE_LOW_STOCK_ITEMS_QUERY)

const CACHE_MAX_AGE = 3 * 60 * 60 * 1000
const SUMMARY_CACHE_KEY = 'seDashboardSummaryCache'
const LOW_STOCK_CACHE_KEY = 'seLowStockCache'

/** The low-stock service answers null while it's still computing. */
const LOW_STOCK_MAX_RETRIES = 5
const LOW_STOCK_RETRY_DELAY = 1500

export type DashboardBudget = { id: string; balance: { amount: number; remaining: number } }

export type DashboardSummary = {
  openOrders: number | null
  pendingApproval: number | null
  /** Percentage of the unit's active budgets still unspent, 0–100; null when unknown. */
  budgetRemainingPercent: number | null
}

export type LowStockItem = {
  total: number
  sku: { id: string; name: string; imageUrl: string | null; detailUrl: string | null }
}

export type LowStockItems = { lowStockCount: number; minimumStock: number; stockBySku: LowStockItem[] }

export type DashboardLoadState = 'loading' | 'ready' | 'error'

type SummaryResponse = {
  seOpenOrdersCount?: number | null
  seOrdersPendingApprovalCount?: number | null
  seBudgets?: DashboardBudget[] | null
}

type LowStockResponse = { seLowStockItems?: LowStockItems | null }

type SessionWithB2b = {
  b2b?: { userEmail?: string; unitId?: string; customerId?: string } | null
}

/** The B2B session fields the dashboard tiles need; all undefined outside a B2B session. */
export function useDashboardsSession() {
  const b2b = (useSession_unstable() as SessionWithB2b)?.b2b
  return { userEmail: b2b?.userEmail, unitId: b2b?.unitId, customerId: b2b?.customerId }
}

/** Sum of every active budget's remaining balance over their total, as a 0–100 percentage. */
export function budgetRemainingPercent(budgets: DashboardBudget[] | null | undefined): number | null {
  if (!budgets) return null
  const totals = budgets.reduce(
    (acc, { balance }) => ({ amount: acc.amount + balance.amount, remaining: acc.remaining + balance.remaining }),
    { amount: 0, remaining: 0 },
  )
  if (totals.amount <= 0) return 0
  return Math.max(0, Math.min(100, (totals.remaining / totals.amount) * 100))
}

/** "37%" or "37.25%". */
export function formatPercent(value: number): string {
  return `${value % 1 === 0 ? value : value.toFixed(2)}%`
}

/**
 * Low-stock SKUs point at the IO app's `detailUrl` (`/{slug}/p`); FastStore PDPs are
 * `/{slug}-{skuId}/p`.
 */
export function lowStockProductHref({ sku }: LowStockItem): string | undefined {
  return sku.detailUrl ? sku.detailUrl.replace(/\/p$/, `-${sku.id}/p`) : undefined
}

type CacheEntry<T> = { data: T; timestamp: number; userEmail: string }

function readCache<T>(key: string, userEmail: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return undefined
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (entry.userEmail !== userEmail || Date.now() - entry.timestamp > CACHE_MAX_AGE) return undefined
    return entry.data
  } catch {
    return undefined
  }
}

function writeCache<T>(key: string, userEmail: string, data: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now(), userEmail } as CacheEntry<T>))
  } catch {
    // Storage full or disabled: the tiles still work, they just refetch next time.
  }
}

/**
 * The latest `execute` behind a stable ref: FastStore's real `useLazyQuery_unstable` returns a
 * new one every render, so it can't be an effect dependency (see useRecentOrdersSpendOverview.ts).
 */
function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

/** Open / pending-approval order counts and budget usage, cached per shopper for three hours. */
export function useDashboardSummary(userEmail: string | undefined, unitId: string | undefined) {
  const [summary, setSummary] = useState<DashboardSummary | undefined>()
  const [fetchSummary] = useLazyQuery_unstable<SummaryResponse, { unitId: string }>(DASHBOARD_SUMMARY_QUERY, {
    unitId: unitId ?? '',
  })
  const fetchSummaryRef = useLatest(fetchSummary)

  useEffect(() => {
    if (!userEmail || !unitId) return
    let cancelled = false

    const cached = readCache<DashboardSummary>(SUMMARY_CACHE_KEY, userEmail)
    if (cached) {
      setSummary(cached)
      return
    }

    fetchSummaryRef
      .current({ unitId })
      .then((result: SummaryResponse | null | undefined) => {
        if (cancelled) return
        const next: DashboardSummary = {
          openOrders: result?.seOpenOrdersCount ?? null,
          pendingApproval: result?.seOrdersPendingApprovalCount ?? null,
          budgetRemainingPercent: budgetRemainingPercent(result?.seBudgets),
        }
        // Don't pin a total failure in the cache for three hours.
        if (next.openOrders !== null || next.pendingApproval !== null || next.budgetRemainingPercent !== null) {
          writeCache(SUMMARY_CACHE_KEY, userEmail, next)
        }
        setSummary(next)
      })
      .catch(() => {
        if (!cancelled) setSummary({ openOrders: null, pendingApproval: null, budgetRemainingPercent: null })
      })

    return () => {
      cancelled = true
    }
  }, [userEmail, unitId, fetchSummaryRef])

  return summary
}

/** SKUs under the minimum-stock threshold, cached per shopper; retried while the service is still computing. */
export function useLowStockItems(userEmail: string | undefined) {
  const [items, setItems] = useState<LowStockItems | undefined>()
  const [state, setState] = useState<DashboardLoadState>('loading')
  const retries = useRef(0)
  const [fetchLowStock] = useLazyQuery_unstable<LowStockResponse, Record<string, never>>(
    LOW_STOCK_ITEMS_QUERY,
    {},
  )
  const fetchLowStockRef = useLatest(fetchLowStock)

  useEffect(() => {
    if (!userEmail) return
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const cached = readCache<LowStockItems>(LOW_STOCK_CACHE_KEY, userEmail)
    if (cached) {
      setItems(cached)
      setState('ready')
      return
    }

    const load = () => {
      fetchLowStockRef
        .current({})
        .then((result: LowStockResponse | null | undefined) => {
          if (cancelled) return
          const lowStock = result?.seLowStockItems
          if (!lowStock) {
            if (retries.current >= LOW_STOCK_MAX_RETRIES) {
              setState('error')
              return
            }
            retries.current += 1
            retryTimer = setTimeout(load, LOW_STOCK_RETRY_DELAY)
            return
          }
          retries.current = 0
          writeCache(LOW_STOCK_CACHE_KEY, userEmail, lowStock)
          setItems(lowStock)
          setState('ready')
        })
        .catch(() => {
          if (!cancelled) setState('error')
        })
    }

    load()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [userEmail, fetchLowStockRef])

  return { items, state }
}
