import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gql } from '@faststore/core/api'
import { useBuyButton_unstable, useLazyQuery_unstable, useSession_unstable } from '@faststore/core/experimental'
import { SE_SKU_AVAILABILITY_QUERY, SE_SKU_SEARCH_QUERY } from '@vtex-us-se/resolvers/b2b'
import {
  findSkuByRefId,
  formatStockMoney,
  matchSkus,
  stockStatus,
  toCartItem,
  type StockMoneyFormat,
  type StockProduct,
  type StockRow,
  type StockSku,
} from './checkStockAndPricingUtils'
import { parseStockCsv, type StockCsvError } from './stockCsv'

const SKU_SEARCH_QUERY = gql(SE_SKU_SEARCH_QUERY)
const SKU_AVAILABILITY_QUERY = gql(SE_SKU_AVAILABILITY_QUERY)

const SEARCH_RESULTS = 10
const MIN_SEARCH_LENGTH = 3
const SEARCH_DEBOUNCE = 300
const IMPORT_CONCURRENCY = 4

type SearchResponse = { search?: { products?: { edges?: Array<{ node: StockProduct }> } } | null }
type AvailabilityResponse = {
  seSkuAvailability?: Array<{ id: string; availability?: string | null; availableQuantity?: number | null }> | null
}
type AvailabilityVariables = { items: Array<{ id: string; seller: string }>; country: string; postalCode?: string | null }

type Session = {
  person?: { id?: string } | null
  country?: string
  postalCode?: string | null
  locale?: string
  currency?: { code?: string }
}

export type StockImportReport = {
  found: Array<{ line: number; refId: string; quantity: number; product: StockProduct; sku: StockSku }>
  errors: StockCsvError[]
}

/** The latest value behind a stable ref (FastStore's lazy `execute` changes every render). */
function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

/** Runs `task` over `items` with at most `limit` in flight. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await task(items[index] as T)
    }
  })
  await Promise.all(workers)
  return results
}

/**
 * The "check stock and pricing" worksheet: SKUs added by reference-code search or CSV import,
 * each with its session price and live stock (cart simulation), quantities, totals, and one
 * add-to-cart for all of it.
 *
 * Replaces the kit's queue of chained effects (one search and one simulation per row, in
 * series) with plain async calls: an import searches a few reference codes at a time and
 * simulates every new SKU in one request.
 */
export function useCheckStockAndPricing({ lowStockThreshold = 50 }: { lowStockThreshold?: number } = {}) {
  const session = useSession_unstable() as Session
  const money: StockMoneyFormat = { locale: session?.locale ?? 'en-US', currency: session?.currency?.code ?? 'USD' }
  const [rows, setRows] = useState<StockRow[]>([])

  const [searchExecute] = useLazyQuery_unstable<SearchResponse, { term: string; first: number }>(SKU_SEARCH_QUERY, {
    term: '',
    first: SEARCH_RESULTS,
  })
  const [availabilityExecute] = useLazyQuery_unstable<AvailabilityResponse, AvailabilityVariables>(
    SKU_AVAILABILITY_QUERY,
    { items: [], country: '' },
  )
  const rowsRef = useLatest(rows)
  const searchRef = useLatest(searchExecute)
  const availabilityRef = useLatest(availabilityExecute)
  const sessionRef = useLatest(session)

  const searchProducts = useCallback(
    async (term: string): Promise<StockProduct[]> => {
      const result: SearchResponse | null | undefined = await searchRef.current({ term, first: SEARCH_RESULTS })
      return result?.search?.products?.edges?.map((edge) => edge.node) ?? []
    },
    [searchRef],
  )

  /** Simulates every given SKU in one request and stores the result on its row. */
  const checkAvailability = useCallback(
    async (skus: StockSku[]) => {
      const items = skus.filter((sku) => sku.sellerId).map((sku) => ({ id: sku.itemId, seller: sku.sellerId as string }))
      const ids = new Set(skus.map((sku) => sku.itemId))
      // Rows are added before their stock is known; once it is, cap the quantity to it (an
      // out-of-stock SKU drops to 0 instead of silently counting toward the total).
      const settle = (byId: Map<string, StockRow['availability']>) =>
        setRows((current) =>
          current.map((row) => {
            if (!ids.has(row.sku.itemId)) return row
            const availability = byId.get(row.sku.itemId) ?? null
            const max = availability?.quantity ?? (availability?.status === 'Out of Stock' ? 0 : row.quantity)
            return { ...row, availability, quantity: Math.min(row.quantity, max) }
          }),
        )

      const { country, postalCode } = sessionRef.current
      if (items.length === 0 || !country) {
        settle(new Map())
        return
      }

      try {
        const result: AvailabilityResponse | null | undefined = await availabilityRef.current({ items, country, postalCode })
        settle(
          new Map(
            (result?.seSkuAvailability ?? []).map((entry) => [entry.id, stockStatus(entry, lowStockThreshold)] as const),
          ),
        )
      } catch {
        settle(new Map())
      }
    },
    [availabilityRef, sessionRef, lowStockThreshold],
  )

  /** Adds SKUs (or raises the quantity of ones already listed), then checks stock for the new ones. */
  const addSkus = useCallback(
    (entries: Array<{ product: StockProduct; sku: StockSku; quantity: number }>) => {
      // Decided from the rows as last rendered, not inside the updater below: React may run an
      // updater later (during the next render), so it can't be relied on to report what it added.
      const listed = new Set(rowsRef.current.map((row) => row.sku.itemId))
      const added = new Map<string, StockSku>()
      for (const entry of entries) if (!listed.has(entry.sku.itemId)) added.set(entry.sku.itemId, entry.sku)

      setRows((current) => {
        const next = [...current]
        for (const entry of entries) {
          const existing = next.findIndex((row) => row.sku.itemId === entry.sku.itemId)
          if (existing === -1) {
            next.push({ product: entry.product, sku: entry.sku, quantity: entry.quantity })
          } else {
            const row = next[existing] as StockRow
            next[existing] = { ...row, quantity: row.quantity + entry.quantity }
          }
        }
        return next
      })
      if (added.size > 0) void checkAvailability([...added.values()])
    },
    [checkAvailability, rowsRef],
  )

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    setRows((current) =>
      current.map((row) => {
        if (row.sku.itemId !== itemId) return row
        const max = row.availability?.quantity ?? Number.POSITIVE_INFINITY
        const clamped = Math.max(0, Math.min(Number.isFinite(quantity) ? Math.floor(quantity) : 0, max))
        return { ...row, quantity: clamped }
      }),
    )
  }, [])

  const remove = useCallback((itemId: string) => {
    setRows((current) => current.filter((row) => row.sku.itemId !== itemId))
  }, [])

  const clear = useCallback(() => setRows([]), [])

  /** Resolves every CSV row to a SKU by exact reference code; nothing is added until `confirmImport`. */
  const importCsv = useCallback(
    async (text: string): Promise<StockImportReport> => {
      const { rows: csvRows, errors } = parseStockCsv(text)
      const lookups = await mapWithConcurrency(csvRows, IMPORT_CONCURRENCY, async (row) => {
        try {
          return { row, match: findSkuByRefId(await searchProducts(row.refId), row.refId) }
        } catch {
          return { row, match: undefined }
        }
      })

      const report: StockImportReport = { found: [], errors: [...errors] }
      for (const { row, match } of lookups) {
        if (match) report.found.push({ ...row, ...match })
        else report.errors.push({ line: row.line, refId: row.refId, message: 'SKU not found' })
      }
      report.errors.sort((a, b) => a.line - b.line)
      return report
    },
    [searchProducts],
  )

  const confirmImport = useCallback(
    (report: StockImportReport) => addSkus(report.found.map(({ product, sku, quantity }) => ({ product, sku, quantity }))),
    [addSkus],
  )

  const purchasable = rows.filter((row) => row.quantity > 0 && typeof row.sku.price === 'number' && row.sku.sellerId)
  const cartItems = useMemo(() => purchasable.map(toCartItem), [purchasable])
  // `as never`: matches the store's generated CartItem shape, built field by field in toCartItem.
  const buyButton = useBuyButton_unstable(cartItems as never)
  const totalItems = purchasable.reduce((sum, row) => sum + row.quantity, 0)
  const totalValue = purchasable.reduce((sum, row) => sum + row.quantity * (row.sku.price ?? 0), 0)

  return {
    isLoggedIn: Boolean(session?.person),
    money,
    rows,
    searchProducts,
    addSkus,
    setQuantity,
    remove,
    clear,
    importCsv,
    confirmImport,
    totalItems,
    total: formatStockMoney(totalValue, money),
    addAllToCart: (event: { preventDefault(): void }) => {
      buyButton.onClick(event)
      setRows([])
    },
  }
}

/** Debounced reference-code search for the worksheet's search box (three characters minimum). */
export function useStockSkuSearch(searchProducts: (term: string) => Promise<StockProduct[]>, term: string) {
  const [results, setResults] = useState<Array<{ product: StockProduct; sku: StockSku }>>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const trimmed = term.trim()
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setResults([])
      setSearching(false)
      return
    }

    let cancelled = false
    setSearching(true)
    const timer = setTimeout(() => {
      searchProducts(trimmed)
        .then((products) => {
          if (!cancelled) setResults(matchSkus(products, trimmed))
        })
        .catch(() => {
          if (!cancelled) setResults([])
        })
        .finally(() => {
          if (!cancelled) setSearching(false)
        })
    }, SEARCH_DEBOUNCE)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term, searchProducts])

  return { results, searching, minLength: MIN_SEARCH_LENGTH }
}
