import { useCallback, useMemo, useRef, useState } from 'react'
import { usePDP } from '@faststore/core'
import { gql } from '@faststore/core/api'
import { useLazyQuery_unstable, useSession_unstable } from '@faststore/core/experimental'
import {
  SE_ADD_TO_PURCHASE_LIST_ADD_ITEMS_MUTATION,
  SE_ADD_TO_PURCHASE_LIST_CREATE_MUTATION,
  SE_ADD_TO_PURCHASE_LIST_LISTS_QUERY,
} from '@vtex-us-se/resolvers/b2b'
import {
  purchaseListItemsFrom,
  type AddToPurchaseListError,
  type AddToPurchaseListOption,
  type AddToPurchaseListProduct,
  type AddToPurchaseListVisibility,
} from './addToPurchaseListUtils'

const ADD_TO_PURCHASE_LIST_LISTS_QUERY = gql(SE_ADD_TO_PURCHASE_LIST_LISTS_QUERY)
const ADD_TO_PURCHASE_LIST_ADD_ITEMS_MUTATION = gql(SE_ADD_TO_PURCHASE_LIST_ADD_ITEMS_MUTATION)
const ADD_TO_PURCHASE_LIST_CREATE_MUTATION = gql(SE_ADD_TO_PURCHASE_LIST_CREATE_MUTATION)

type Result = { ok: boolean; error?: AddToPurchaseListError | null; list?: AddToPurchaseListOption | null }
type Session = { person?: { id?: string } | null }

export type AddToPurchaseListOutcome =
  | { ok: true; list: AddToPurchaseListOption }
  | { ok: false; error: AddToPurchaseListError }

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
    async (variables: V): Promise<AddToPurchaseListOutcome> => {
      try {
        const response: Record<string, Result | null> | null | undefined = await ref.current(variables)
        const result = response?.[field]
        if (result?.ok && result.list) return { ok: true, list: result.list }
        return { ok: false, error: result?.error ?? 'FAILED' }
      } catch {
        return { ok: false, error: 'FAILED' }
      }
    },
    [ref, field],
  )
}

/**
 * Saves `products` to one of the buyer's purchase lists, or to a new one. The lists are only
 * fetched by `load` (when the picker opens), not on mount: the button sits on every PDP, and
 * most visits never open it.
 */
export function useAddToPurchaseList(products: AddToPurchaseListProduct[]) {
  const session = useSession_unstable() as Session
  const isLoggedIn = Boolean(session?.person)
  const items = useMemo(() => purchaseListItemsFrom(products), [products])
  const [lists, setLists] = useState<AddToPurchaseListOption[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  const [fetchLists] = useLazyQuery_unstable<{ sePurchaseLists?: AddToPurchaseListOption[] | null }, Record<string, never>>(
    ADD_TO_PURCHASE_LIST_LISTS_QUERY,
    {},
  )
  const fetchRef = useLatest(fetchLists)
  const addItemsMutation = useListMutation<{ documentId: string; items: AddToPurchaseListProduct[] }>(
    ADD_TO_PURCHASE_LIST_ADD_ITEMS_MUTATION,
    'sePurchaseListAddItems',
  )
  const createMutation = useListMutation<{
    name: string
    visibility: AddToPurchaseListVisibility
    items: AddToPurchaseListProduct[]
  }>(ADD_TO_PURCHASE_LIST_CREATE_MUTATION, 'sePurchaseListCreate')

  const load = useCallback(async () => {
    setState('loading')
    try {
      const response: { sePurchaseLists?: AddToPurchaseListOption[] | null } | null | undefined = await fetchRef.current({})
      setLists(response?.sePurchaseLists ?? [])
      setState('ready')
    } catch {
      setState('error')
    }
  }, [fetchRef])

  const remember = useCallback((outcome: AddToPurchaseListOutcome) => {
    if (!outcome.ok) return outcome
    const updated = outcome.list
    setLists((current) =>
      current.some((list) => list.documentId === updated.documentId)
        ? current.map((list) => (list.documentId === updated.documentId ? updated : list))
        : [...current, updated],
    )
    return outcome
  }, [])

  const addTo = useCallback(
    async (documentId: string): Promise<AddToPurchaseListOutcome> =>
      items.length === 0 ? { ok: false, error: 'INVALID' } : remember(await addItemsMutation({ documentId, items })),
    [items, addItemsMutation, remember],
  )

  const createWith = useCallback(
    async (name: string, visibility: AddToPurchaseListVisibility): Promise<AddToPurchaseListOutcome> =>
      items.length === 0 ? { ok: false, error: 'INVALID' } : remember(await createMutation({ name, visibility, items })),
    [items, createMutation, remember],
  )

  return { isLoggedIn, items, lists, state, load, addTo, createWith }
}

type PdpContext = { data?: { product?: { sku?: string | null } | null } | null } | null | undefined

/**
 * The PDP's current SKU (the variant the shopper has selected), as the one product to save. Empty
 * outside a PDP. Reads FastStore's page context, which only the store's own @faststore/core
 * provides -- fine here: this component is source-copied into the store anyway.
 */
export function usePdpPurchaseListProducts(quantity = 1): AddToPurchaseListProduct[] {
  const context = usePDP() as PdpContext
  const skuId = context?.data?.product?.sku ?? ''
  return useMemo(() => (skuId ? [{ skuId, quantity }] : []), [skuId, quantity])
}
