import { useCallback, useEffect, useMemo, useState } from 'react'
import { gql } from '@faststore/core/api'
import { useCart_unstable, useLazyQuery_unstable, useQuery_unstable, useSession_unstable } from '@faststore/core/experimental'
import { ASSEMBLY_SET_QUERY, SE_ADD_COMPOSED_SET_MUTATION } from '@vtex-us-se/resolvers/b2c'
import { bestOffer, groupTotal, initialQuantities, isGroupSatisfied, MAX_QTY, setSelection } from './assemblySetUtils'
import type { AddedSet, AssemblyGroup, AssemblyProduct } from './types'

const SET_QUERY = gql(ASSEMBLY_SET_QUERY)
const ADD_COMPOSED_SET_MUTATION = gql(SE_ADD_COMPOSED_SET_MUTATION)

interface AssemblySetQueryData {
  product?: AssemblyProduct & {
    slug?: string
    assemblyOptions?: Array<{ groups: AssemblyGroup[] }>
  }
}

interface AssemblySetQueryVariables {
  locator: Array<{ key: string; value: string }>
}

interface AddComposedSetMutationData {
  seAddComposedSet?: { orderFormId: string; value: number; messages: string[] } | null
}

interface AddComposedSetMutationVariables {
  data: {
    orderFormId?: string
    parentSku: string
    sets: number
    items: Array<{ skuId: string; quantity: number; seller: string }>
  }
}

export interface UseAssemblySetOptions {
  skuId: string
  initialSets?: number
  /** Where the "CHECKOUT" action in the confirmation modal sends the shopper. */
  checkoutUrl?: string
}

/**
 * Orchestrates a customisable set builder: reads the parent SKU's assembly option (via the
 * `assemblyOptions` field the resolvers package's `createAssemblySetResolver` adds to
 * `StoreProduct`), tracks the shopper's selection against each group's own min/max gate, and
 * composes the set into the cart atomically via the `seAddComposedSet` mutation.
 */
export function useAssemblySet({ skuId, initialSets = 1, checkoutUrl = '/checkout' }: UseAssemblySetOptions) {
  const { channel, locale } = useSession_unstable()
  const { id: orderFormId } = useCart_unstable()

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [sets, setSets] = useState(initialSets)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(false)
  const [added, setAdded] = useState<AddedSet | null>(null)

  const variables = useMemo<AssemblySetQueryVariables>(
    () => ({
      locator: [
        { key: 'id', value: skuId },
        { key: 'channel', value: channel ?? '' },
        { key: 'locale', value: locale ?? '' },
      ],
    }),
    [skuId, channel, locale],
  )

  const { data, isLoading } = useQuery_unstable<AssemblySetQueryData, AssemblySetQueryVariables>(SET_QUERY, variables, {
    doNotRun: !skuId,
  })
  const product = data?.product

  const groups = useMemo(() => (product?.assemblyOptions ?? []).flatMap((option) => option.groups), [product])

  useEffect(() => {
    setQuantities(initialQuantities(groups))
  }, [groups])

  const onChangeQuantity = useCallback(
    (skuIdToChange: string, next: number) => {
      const group = groups.find((candidate) => candidate.items.some((item) => item.skuId === skuIdToChange))
      const item = group?.items.find((candidate) => candidate.skuId === skuIdToChange)

      if (!group || !item) return

      const clamped = Math.min(Math.max(next, item.minQuantity), item.maxQuantity)
      const others = groupTotal(group, quantities) - (quantities[skuIdToChange] ?? 0)
      const allowed = Math.min(clamped, group.maxQuantity - others)

      setQuantities((current) => ({ ...current, [skuIdToChange]: Math.max(allowed, 0) }))
    },
    [groups, quantities],
  )

  const selectedTotal = useMemo(
    () =>
      groups
        .flatMap((group) => group.items)
        .reduce((total, item) => {
          const quantity = quantities[item.skuId] ?? 0
          const offer = bestOffer(item)

          return offer ? total + offer.price * quantity : total
        }, 0),
    [groups, quantities],
  )

  // The parent SKU carries its own price and Checkout charges it on top of the children, so it
  // belongs in every set total -- without it this understates the cart by the parent price per set.
  const parentPrice = product?.offers?.offers?.[0]?.price ?? 0
  const total = (selectedTotal + parentPrice) * sets

  const canAddToCart = groups.length > 0 && groups.every((group) => isGroupSatisfied(group, quantities))
  const selection = useMemo(() => setSelection(groups, quantities), [groups, quantities])

  const increaseSets = useCallback(() => setSets((value) => Math.min(value + 1, MAX_QTY)), [])
  const decreaseSets = useCallback(() => setSets((value) => Math.max(value - 1, 1)), [])

  const [submitAddSet, { data: mutationData }] = useLazyQuery_unstable<
    AddComposedSetMutationData,
    AddComposedSetMutationVariables
  >(ADD_COMPOSED_SET_MUTATION, {} as AddComposedSetMutationVariables)

  useEffect(() => {
    if (!mutationData) return

    const result = mutationData.seAddComposedSet

    if (result) {
      setAdded({
        orderFormId: result.orderFormId,
        // Checkout reports orderForm totals in cents.
        total: result.value / 100,
        notice: result.messages?.[0],
      })
      setAdding(false)
    } else {
      setError(true)
      setAdding(false)
    }
  }, [mutationData])

  const handleAddToSet = useCallback(async () => {
    if (!canAddToCart || adding) return

    setError(false)
    setAdding(true)

    try {
      await submitAddSet({
        data: {
          ...(orderFormId ? { orderFormId } : {}),
          parentSku: product?.sku ?? skuId,
          sets,
          items: selection,
        },
      })
    } catch (err) {
      console.error('Error composing set:', err)
      setError(true)
      setAdding(false)
    }
  }, [canAddToCart, adding, submitAddSet, orderFormId, product?.sku, skuId, sets, selection])

  const dismissAdded = useCallback(() => setAdded(null), [])

  const formatAmount = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale || undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    return (value: number) => formatter.format(value)
  }, [locale])

  const checkoutHref = added ? `${checkoutUrl}${checkoutUrl.includes('?') ? '&' : '?'}orderFormId=${added.orderFormId}` : checkoutUrl

  return {
    isLoading,
    product,
    groups,
    quantities,
    onChangeQuantity,
    sets,
    increaseSets,
    decreaseSets,
    total,
    canAddToCart,
    adding,
    error,
    added,
    dismissAdded,
    checkoutHref,
    handleAddToSet,
    formatAmount,
  }
}
