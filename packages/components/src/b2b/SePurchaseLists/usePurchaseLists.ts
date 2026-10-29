import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gql } from '@faststore/core/api'
import { useBuyButton_unstable, useLazyQuery_unstable, useSession_unstable } from '@faststore/core/experimental'
import {
  SE_PURCHASE_LIST_ADD_ITEMS_MUTATION,
  SE_PURCHASE_LIST_CREATE_MUTATION,
  SE_PURCHASE_LIST_DELETE_MUTATION,
  SE_PURCHASE_LIST_PRODUCT_QUERY,
  SE_PURCHASE_LIST_RENAME_MUTATION,
  SE_PURCHASE_LIST_SEARCH_QUERY,
  SE_PURCHASE_LIST_SET_ITEM_QUANTITY_MUTATION,
  SE_PURCHASE_LIST_SET_VISIBILITY_MUTATION,
  SE_PURCHASE_LISTS_QUERY,
} from '@vtex-us-se/resolvers/b2b'
import {
  formatPurchaseListMoney,
  matchPurchaseListSkus,
  purchaseListCartItem,
  type PurchaseList,
  type PurchaseListError,
  type PurchaseListItem,
  type PurchaseListMoney,
  type PurchaseListProduct,
  type PurchaseListSku,
  type PurchaseListVisibility,
} from './purchaseListsUtils'

const PURCHASE_LISTS_QUERY = gql(SE_PURCHASE_LISTS_QUERY)
const PURCHASE_LIST_CREATE_MUTATION = gql(SE_PURCHASE_LIST_CREATE_MUTATION)
const PURCHASE_LIST_ADD_ITEMS_MUTATION = gql(SE_PURCHASE_LIST_ADD_ITEMS_MUTATION)
const PURCHASE_LIST_SET_ITEM_QUANTITY_MUTATION = gql(SE_PURCHASE_LIST_SET_ITEM_QUANTITY_MUTATION)
const PURCHASE_LIST_RENAME_MUTATION = gql(SE_PURCHASE_LIST_RENAME_MUTATION)
const PURCHASE_LIST_SET_VISIBILITY_MUTATION = gql(SE_PURCHASE_LIST_SET_VISIBILITY_MUTATION)
const PURCHASE_LIST_DELETE_MUTATION = gql(SE_PURCHASE_LIST_DELETE_MUTATION)
const PURCHASE_LIST_PRODUCT_QUERY = gql(SE_PURCHASE_LIST_PRODUCT_QUERY)
const PURCHASE_LIST_SEARCH_QUERY = gql(SE_PURCHASE_LIST_SEARCH_QUERY)

const URL_PARAM = 'list'
const QUANTITY_SAVE_DELAY = 600
const PRODUCT_CONCURRENCY = 6
const SEARCH_RESULTS = 10
const MIN_SEARCH_LENGTH = 3
const SEARCH_DEBOUNCE = 300

type Result = { ok: boolean; error?: PurchaseListError | null; list?: PurchaseList | null }
type Session = { person?: { id?: string } | null; locale?: string; currency?: { code?: string } }

export type PurchaseListActionResult = { ok: true } | { ok: false; error: PurchaseListError }

/** The latest value behind a stable ref (FastStore's lazy `execute` changes every render). */
function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

/** One lazy operation whose single root field holds a `SePurchaseListResult`. */
function useListMutation<V>(query: unknown, field: string) {
  const [execute] = useLazyQuery_unstable<Record<string, Result | null>, V>(query, {} as V)
  const ref = useLatest(execute)
  return useCallback(
    async (variables: V): Promise<Result> => {
      try {
        const response: Record<string, Result | null> | null | undefined = await ref.current(variables)
        return response?.[field] ?? { ok: false, error: 'FAILED' }
      } catch {
        return { ok: false, error: 'FAILED' }
      }
    },
    [ref, field],
  )
}

/**
 * The list id in the page URL (`?list=...`), so a list can be linked to directly. Not the kit's
 * `?id=`: too generic a name to own on a page other code also reads query parameters from.
 */
function urlListId(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(URL_PARAM)
}

function setUrlListId(id: string | null) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (id) url.searchParams.set(URL_PARAM, id)
  else url.searchParams.delete(URL_PARAM)
  window.history.replaceState(window.history.state, '', url)
}

/**
 * The buyer's purchase lists and every action on them. Each action applies the list the server
 * returns (so what's shown is what's stored); quantity edits are debounced per SKU and saved
 * on their own, with the optimistic value shown meanwhile.
 */
export function usePurchaseLists() {
  const session = useSession_unstable() as Session
  const isLoggedIn = Boolean(session?.person)
  const money: PurchaseListMoney = { locale: session?.locale ?? 'en-US', currency: session?.currency?.code ?? 'USD' }
  const [lists, setLists] = useState<PurchaseList[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [fetchLists] = useLazyQuery_unstable<{ sePurchaseLists?: PurchaseList[] | null }, Record<string, never>>(
    PURCHASE_LISTS_QUERY,
    {},
  )
  const fetchRef = useLatest(fetchLists)
  const createMutation = useListMutation<{ name: string; visibility: PurchaseListVisibility; items?: PurchaseListItem[] }>(
    PURCHASE_LIST_CREATE_MUTATION,
    'sePurchaseListCreate',
  )
  const addItemsMutation = useListMutation<{ documentId: string; items: PurchaseListItem[] }>(
    PURCHASE_LIST_ADD_ITEMS_MUTATION,
    'sePurchaseListAddItems',
  )
  const quantityMutation = useListMutation<{ documentId: string; skuId: string; quantity: number }>(
    PURCHASE_LIST_SET_ITEM_QUANTITY_MUTATION,
    'sePurchaseListSetItemQuantity',
  )
  const renameMutation = useListMutation<{ documentId: string; name: string }>(PURCHASE_LIST_RENAME_MUTATION, 'sePurchaseListRename')
  const visibilityMutation = useListMutation<{ documentId: string; visibility: PurchaseListVisibility }>(
    PURCHASE_LIST_SET_VISIBILITY_MUTATION,
    'sePurchaseListSetVisibility',
  )
  const deleteMutation = useListMutation<{ documentId: string }>(PURCHASE_LIST_DELETE_MUTATION, 'sePurchaseListDelete')

  const refresh = useCallback(async () => {
    try {
      const response: { sePurchaseLists?: PurchaseList[] | null } | null | undefined = await fetchRef.current({})
      setLists(response?.sePurchaseLists ?? [])
      setState('ready')
    } catch {
      setState('error')
    }
  }, [fetchRef])

  useEffect(() => {
    if (!isLoggedIn) return
    setSelectedId(urlListId())
    void refresh()
  }, [isLoggedIn, refresh])

  const select = useCallback((id: string | null) => {
    setSelectedId(id)
    setUrlListId(id)
  }, [])

  const applyResult = useCallback((result: Result): PurchaseListActionResult => {
    if (!result.ok) return { ok: false, error: result.error ?? 'FAILED' }
    const updated = result.list
    if (updated) {
      setLists((current) =>
        current.some((list) => list.documentId === updated.documentId)
          ? current.map((list) => (list.documentId === updated.documentId ? updated : list))
          : [...current, updated],
      )
    }
    return { ok: true }
  }, [])

  const create = useCallback(
    async (name: string, visibility: PurchaseListVisibility, items: PurchaseListItem[] = []) => {
      const result = await createMutation({ name, visibility, items })
      const outcome = applyResult(result)
      if (outcome.ok && result.list) select(result.list.documentId)
      return outcome
    },
    [createMutation, applyResult, select],
  )

  const addItems = useCallback(
    async (documentId: string, items: PurchaseListItem[]) => applyResult(await addItemsMutation({ documentId, items })),
    [addItemsMutation, applyResult],
  )

  const rename = useCallback(
    async (documentId: string, name: string) => applyResult(await renameMutation({ documentId, name })),
    [renameMutation, applyResult],
  )

  const setVisibility = useCallback(
    async (documentId: string, visibility: PurchaseListVisibility) =>
      applyResult(await visibilityMutation({ documentId, visibility })),
    [visibilityMutation, applyResult],
  )

  const remove = useCallback(
    async (documentId: string): Promise<PurchaseListActionResult> => {
      const result = await deleteMutation({ documentId })
      if (!result.ok) return { ok: false, error: result.error ?? 'FAILED' }
      setLists((current) => current.filter((list) => list.documentId !== documentId))
      select(null)
      return { ok: true }
    },
    [deleteMutation, select],
  )

  // Quantity edits: shown immediately, saved once the buyer stops clicking.
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const [saveError, setSaveError] = useState<PurchaseListError | null>(null)
  const setItemQuantity = useCallback(
    (documentId: string, skuId: string, quantity: number) => {
      const next = Math.max(0, Math.floor(Number.isFinite(quantity) ? quantity : 0))
      setLists((current) =>
        current.map((list) =>
          list.documentId !== documentId
            ? list
            : {
                ...list,
                items:
                  next === 0
                    ? list.items.filter((item) => item.skuId !== skuId)
                    : list.items.map((item) => (item.skuId === skuId ? { ...item, quantity: next } : item)),
              },
        ),
      )
      const key = `${documentId}:${skuId}`
      const pendingTimer = timers.current.get(key)
      if (pendingTimer) clearTimeout(pendingTimer)
      timers.current.set(
        key,
        setTimeout(
          async () => {
            timers.current.delete(key)
            const result = await quantityMutation({ documentId, skuId, quantity: next })
            if (!result.ok) {
              setSaveError(result.error ?? 'FAILED')
              void refresh()
            }
          },
          next === 0 ? 0 : QUANTITY_SAVE_DELAY,
        ),
      )
    },
    [quantityMutation, refresh],
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => clearTimeout(timer))
  }, [])

  return {
    isLoggedIn,
    money,
    lists,
    state,
    selected: lists.find((list) => list.documentId === selectedId) ?? null,
    select,
    create,
    addItems,
    rename,
    setVisibility,
    remove,
    setItemQuantity,
    saveError,
    clearSaveError: () => setSaveError(null),
  }
}

/** Runs `task` over `items` with at most `limit` in flight. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++
        results[index] = await task(items[index] as T)
      }
    }),
  )
  return results
}

export type PurchaseListLine = {
  item: PurchaseListItem
  product?: PurchaseListProduct
  sku?: PurchaseListSku
}

/**
 * Product data for every SKU on `list` (looked up once per SKU and kept for the session), the
 * list's lines with it, totals, and one add-to-cart for every line with a price.
 */
export function usePurchaseListLines(list: PurchaseList | null, money: PurchaseListMoney) {
  const [catalog, setCatalog] = useState<Record<string, { product: PurchaseListProduct; sku: PurchaseListSku } | null>>({})
  const catalogRef = useLatest(catalog)
  const [fetchProduct] = useLazyQuery_unstable<
    { product?: PurchaseListProduct | null },
    { locator: Array<{ key: string; value: string }> }
  >(PURCHASE_LIST_PRODUCT_QUERY, { locator: [] })
  const fetchRef = useLatest(fetchProduct)

  const skuIds = useMemo(() => (list?.items ?? []).map((item) => item.skuId), [list])
  const missingKey = skuIds.filter((id) => !(id in catalog)).join(',')

  useEffect(() => {
    const missing = missingKey ? missingKey.split(',') : []
    if (missing.length === 0) return
    let cancelled = false

    void mapWithConcurrency(missing, PRODUCT_CONCURRENCY, async (skuId) => {
      try {
        const response: { product?: PurchaseListProduct | null } | null | undefined = await fetchRef.current({
          locator: [{ key: 'id', value: skuId }],
        })
        const product = response?.product ?? undefined
        const sku = product?.seSkus?.find((candidate) => candidate.itemId === skuId)
        return [skuId, product && sku ? { product, sku } : null] as const
      } catch {
        return [skuId, null] as const
      }
    }).then((entries) => {
      if (!cancelled) setCatalog((current) => ({ ...current, ...Object.fromEntries(entries) }))
    })

    return () => {
      cancelled = true
    }
  }, [missingKey, fetchRef])

  /** Lets a SKU found by search show immediately, without waiting for its own lookup. */
  const remember = useCallback(
    (product: PurchaseListProduct, sku: PurchaseListSku) => {
      if (!catalogRef.current[sku.itemId]) setCatalog((current) => ({ ...current, [sku.itemId]: { product, sku } }))
    },
    [catalogRef],
  )

  const lines: PurchaseListLine[] = (list?.items ?? []).map((item) => {
    const entry = catalog[item.skuId]
    return { item, product: entry?.product, sku: entry?.sku }
  })

  const purchasable = lines.filter(
    (line): line is Required<PurchaseListLine> =>
      Boolean(line.product && line.sku && typeof line.sku.price === 'number' && line.sku.sellerId),
  )
  const cartItems = useMemo(
    () => purchasable.map((line) => purchaseListCartItem(line.product, line.sku, line.item.quantity)),
    [purchasable],
  )
  // `as never`: matches the store's generated CartItem shape, built field by field in purchaseListCartItem.
  const buyButton = useBuyButton_unstable(cartItems as never)
  const totalItems = purchasable.reduce((sum, line) => sum + line.item.quantity, 0)
  const totalValue = purchasable.reduce((sum, line) => sum + line.item.quantity * (line.sku.price ?? 0), 0)

  return {
    lines,
    loadingProducts: missingKey !== '',
    remember,
    totalItems,
    total: formatPurchaseListMoney(totalValue, money),
    addAllToCart: buyButton.onClick,
  }
}

/** Debounced reference-code search for adding SKUs to a list (three characters minimum). */
export function usePurchaseListSearch(term: string) {
  const [results, setResults] = useState<Array<{ product: PurchaseListProduct; sku: PurchaseListSku }>>([])
  const [searching, setSearching] = useState(false)
  const [execute] = useLazyQuery_unstable<
    { search?: { products?: { edges?: Array<{ node: PurchaseListProduct }> } } | null },
    { term: string; first: number }
  >(PURCHASE_LIST_SEARCH_QUERY, { term: '', first: SEARCH_RESULTS })
  const executeRef = useLatest(execute)

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
      executeRef
        .current({ term: trimmed, first: SEARCH_RESULTS })
        .then((response: { search?: { products?: { edges?: Array<{ node: PurchaseListProduct }> } } | null } | null | undefined) => {
          if (!cancelled) {
            setResults(matchPurchaseListSkus(response?.search?.products?.edges?.map((edge) => edge.node) ?? [], trimmed))
          }
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
  }, [term, executeRef])

  return { results, searching, minLength: MIN_SEARCH_LENGTH }
}
