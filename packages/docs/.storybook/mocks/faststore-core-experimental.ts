// Storybook-only mock for `@faststore/core/experimental`. The REAL module ships raw TypeScript
// source with no compiled artifact — importing it for real drags in most of @faststore/core's
// internal SDK (discovery.config, @generated, src/sdk/*), which only resolves inside a real
// FastStore project's own bundler config. Vite's dependency scanner chokes on that entire tree
// the moment any story imports the real module, taking down all of Storybook — not just the
// story that needs it. This mock is aliased in main.ts ONLY for Storybook; the published
// components/ui packages still import the real module at runtime in a real FastStore project.
import { useCallback, useState } from 'react'

export type B2bInfo = {
  userName?: string
  [key: string]: unknown
}

// Stories flip this to render the anonymous (logged-out) state of login-gated B2B components.
let mockSignedIn = true

export function setMockSignedIn(signedIn: boolean) {
  mockSignedIn = signedIn
}

export function useSession_unstable(): {
  b2b?: B2bInfo | null
  channel?: string
  locale?: string
  currency?: { code: string; symbol: string }
  person?: { id: string; email: string } | null
} {
  return {
    b2b: mockSignedIn ? { userName: 'Storybook User' } : null,
    channel: '{"salesChannel":"1"}',
    locale: 'en-US',
    currency: { code: 'USD', symbol: '$' },
    person: mockSignedIn ? { id: 'storybook-person', email: 'buyer@example.com' } : null,
  }
}

export function useFormattedPrice_unstable(price: number): string {
  return Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

export function useProductLink_unstable({ product }: { product: { slug: string }; index: number; selectedOffer: number }) {
  return { href: `/${product.slug}/p`, onClick: () => {}, 'data-testid': 'product-link' }
}

export function useNewsletter_unstable() {
  const [data, setData] = useState<unknown>(undefined)
  const subscribeUser = useCallback(async (variables: unknown) => {
    console.log('[Storybook mock] useNewsletter_unstable subscribeUser called with', variables)
    setData({ subscribeToNewsletter: { id: 'storybook-subscription' } })
  }, [])
  return { subscribeUser, data, error: undefined, loading: false }
}

export function useCart_unstable(): { id?: string } {
  return { id: 'storybook-order-form-id' }
}

/* eslint-disable @typescript-eslint/no-unused-vars -- signature must match the real hook's */
export function useLazyQuery_unstable<TData = unknown, TVariables = unknown>(query: unknown, variables: TVariables) {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const [data, setData] = useState<TData | undefined>(undefined)

  const submit = useCallback(async (submittedVariables: TVariables) => {
    console.log('[Storybook mock] useLazyQuery_unstable called with', submittedVariables)
    setData({
      seAddComposedSet: {
        orderFormId: 'storybook-order-form-id',
        value: 12550,
        messages: [],
      },
    } as TData)
  }, [])

  return [submit, { data }] as [(submittedVariables: TVariables) => Promise<void>, { data: TData | undefined }]
}

const IN_STOCK = 'https://schema.org/InStock'

const FIXTURE_ITEM = (skuId: string, name: string, price: number) => ({
  skuId,
  minQuantity: 0,
  maxQuantity: 2,
  initialQuantity: 0,
  product: {
    sku: skuId,
    name,
    image: [{ url: `https://placehold.co/200x200?text=${encodeURIComponent(name)}`, alternateName: name }],
    offers: { offers: [{ price, listPrice: price, availability: IN_STOCK, seller: { identifier: '1' } }] },
  },
})

// Hoisted to module scope so its identity is STABLE across renders — matches the real
// useQuery_unstable's SWR-backed behavior (the same cache key returns the same object
// reference until new data actually arrives). Building this object inline inside the hook
// body would return a fresh reference on every render, and any caller that keys a `useEffect`
// off that data's identity (e.g. to seed derived state) would then loop indefinitely.
const FIXTURE_QUERY_DATA = {
  product: {
    sku: 'storybook-parent-sku',
    slug: 'storybook-gift-set',
    name: 'Storybook Gift Set',
    image: [{ url: 'https://placehold.co/400x400?text=Gift+Set', alternateName: 'Gift set' }],
    offers: { offers: [{ price: 10 }] },
    assemblyOptions: [
      {
        id: 'gift-set-options',
        name: 'Choose your items',
        required: true,
        groups: [
          {
            name: 'Pick 2 to 4 items',
            minQuantity: 2,
            maxQuantity: 4,
            items: [
              FIXTURE_ITEM('storybook-item-1', 'Body Lotion', 8),
              FIXTURE_ITEM('storybook-item-2', 'Shampoo', 6),
              FIXTURE_ITEM('storybook-item-3', 'Conditioner', 6),
              FIXTURE_ITEM('storybook-item-4', 'Soap Bar', 4),
            ],
          },
        ],
      },
    ],
  },
}

// `query`/`variables` are unused (this mock ignores what's asked and always returns the same
// fixture), but kept in the signature since it must match the real hook's.
export function useQuery_unstable<TData = unknown, TVariables = unknown>(
  _query: unknown,
  _variables: TVariables,
  options?: { doNotRun?: boolean },
) {
  if (options?.doNotRun) {
    return { data: undefined, isLoading: false, isValidating: false, error: undefined }
  }

  return {
    data: FIXTURE_QUERY_DATA as TData,
    isLoading: false,
    isValidating: false,
    error: undefined,
  }
}
