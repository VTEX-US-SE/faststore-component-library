import { useEffect, useRef, useState } from 'react'
import { gql } from '@faststore/core/api'
import { useLazyQuery_unstable, useSession_unstable } from '@faststore/core/experimental'
import { SE_RECENT_ORDERS_QUERY, SE_SPEND_OVERVIEW_QUERY } from '@vtex-us-se/resolvers/b2b'
import {
  readShopperCache,
  writeShopperCache,
  type MoneyFormat,
  type MonthlySpend,
  type RecentOrder,
} from './recentOrdersSpendOverviewUtils'

const RECENT_ORDERS_QUERY = gql(SE_RECENT_ORDERS_QUERY)
const SPEND_OVERVIEW_QUERY = gql(SE_SPEND_OVERVIEW_QUERY)

const ORDERS_CACHE_KEY = 'seRecentOrdersCache'
const ORDERS_CACHE_MAX_AGE = 3 * 60 * 60 * 1000
const SPEND_CACHE_KEY = 'seSpendOverviewCache'
const SPEND_CACHE_MAX_AGE = 24 * 60 * 60 * 1000

/** The spend-overview service answers `monthlyOrderValues: null` while it's still computing. */
const SPEND_MAX_RETRIES = 5
const SPEND_RETRY_DELAY = 1500

type RecentOrdersResponse = { seRecentOrders?: RecentOrder[] | null }
type SpendOverviewResponse = { seSpendOverview?: { monthlyOrderValues?: MonthlySpend[] | null } | null }

type SessionWithB2b = {
  b2b?: { userEmail?: string } | null
  locale?: string
  currency?: { code?: string }
}

/** The signed-in B2B shopper's email, plus the locale/currency to format their amounts in. */
export function useB2bShopper(): { userEmail?: string; money: MoneyFormat } {
  const session = useSession_unstable() as SessionWithB2b
  return {
    userEmail: session?.b2b?.userEmail ?? undefined,
    money: { locale: session?.locale ?? 'en-US', currency: session?.currency?.code ?? 'USD' },
  }
}

export type LoadState = 'loading' | 'ready' | 'error'

/**
 * The latest `execute` from a `useLazyQuery_unstable`, behind a stable ref. FastStore's real
 * hook builds a new `execute` on every render, so putting it in an effect's dependencies
 * refetches (and re-sets state) on every render, forever. Storybook's mock happens to return a
 * stable function, so a story never shows that loop -- don't "simplify" this back.
 */
function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

/** The shopper's latest orders, cached per shopper for three hours. Idle until `userEmail` is known. */
export function useRecentOrders(userEmail: string | undefined, limit = 5) {
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [fetchOrders] = useLazyQuery_unstable<RecentOrdersResponse, { limit: number }>(
    RECENT_ORDERS_QUERY,
    { limit },
  )
  const fetchOrdersRef = useLatest(fetchOrders)

  useEffect(() => {
    if (!userEmail) return
    let cancelled = false

    const cached = readShopperCache<RecentOrder[]>(ORDERS_CACHE_KEY, userEmail, ORDERS_CACHE_MAX_AGE)
    if (cached) {
      setOrders(cached)
      setState('ready')
      return
    }

    fetchOrdersRef.current({ limit })
      .then((result: RecentOrdersResponse | null | undefined) => {
        if (cancelled) return
        const list = result?.seRecentOrders ?? []
        writeShopperCache(ORDERS_CACHE_KEY, userEmail, list)
        setOrders(list)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [userEmail, limit, fetchOrdersRef])

  return { orders, state }
}

/**
 * Monthly spend for the shopper, cached per shopper for a day. Retries a few times while the
 * service is still computing (null months) instead of rendering an empty chart.
 */
export function useSpendOverview(userEmail: string | undefined) {
  const [months, setMonths] = useState<MonthlySpend[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const retries = useRef(0)
  const [fetchSpend] = useLazyQuery_unstable<SpendOverviewResponse, Record<string, never>>(SPEND_OVERVIEW_QUERY, {})
  const fetchSpendRef = useLatest(fetchSpend)

  useEffect(() => {
    if (!userEmail) return
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const cached = readShopperCache<MonthlySpend[]>(SPEND_CACHE_KEY, userEmail, SPEND_CACHE_MAX_AGE)
    if (cached) {
      setMonths(cached)
      setState('ready')
      return
    }

    const load = () => {
      fetchSpendRef.current({})
        .then((result: SpendOverviewResponse | null | undefined) => {
          if (cancelled) return
          const overview = result?.seSpendOverview
          // No overview at all: the service isn't installed on this account, or failed. Don't retry.
          if (!overview) {
            setState('error')
            return
          }
          if (!overview.monthlyOrderValues) {
            if (retries.current >= SPEND_MAX_RETRIES) {
              setState('error')
              return
            }
            retries.current += 1
            retryTimer = setTimeout(load, SPEND_RETRY_DELAY)
            return
          }
          retries.current = 0
          writeShopperCache(SPEND_CACHE_KEY, userEmail, overview.monthlyOrderValues)
          setMonths(overview.monthlyOrderValues)
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
  }, [userEmail, fetchSpendRef])

  return { months, state }
}
