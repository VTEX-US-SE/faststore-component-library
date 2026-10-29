// Storybook-only mock for `@faststore/core/experimental`. The REAL module ships raw TypeScript
// source with no compiled artifact — importing it for real drags in most of @faststore/core's
// internal SDK (discovery.config, @generated, src/sdk/*), which only resolves inside a real
// FastStore project's own bundler config. Vite's dependency scanner chokes on that entire tree
// the moment any story imports the real module, taking down all of Storybook — not just the
// story that needs it. This mock is aliased in main.ts ONLY for Storybook; the published
// components/ui packages still import the real module at runtime in a real FastStore project.
import { useCallback, useState, useSyncExternalStore } from 'react'

export type B2bInfo = {
  userName?: string
  userEmail?: string
  [key: string]: unknown
}

// Stories flip this to render the anonymous (logged-out) state of login-gated B2B components.
let mockSignedIn = true

export function setMockSignedIn(signedIn: boolean) {
  mockSignedIn = signedIn
}

// Fields `sessionStore_unstable.set` changed (e.g. the address selector's postal code), merged
// into every `useSession_unstable` result; components re-render on change like the real store.
let sessionOverrides: Record<string, unknown> = {}
const sessionListeners = new Set<() => void>()

export const sessionStore_unstable = {
  set(session: Record<string, unknown>) {
    console.log('[Storybook mock] sessionStore_unstable.set called with', session)
    const { country, addressType, city, postalCode } = session
    sessionOverrides = { country, addressType, city, postalCode }
    sessionListeners.forEach((listener) => listener())
  },
  read() {
    return sessionOverrides
  },
}

function subscribeSession(listener: () => void) {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}

export function useSession_unstable(): {
  b2b?: B2bInfo | null
  channel?: string
  locale?: string
  currency?: { code: string; symbol: string }
  person?: { id: string; email: string } | null
  postalCode?: string | null
  [key: string]: unknown
} {
  const overrides = useSyncExternalStore(subscribeSession, () => sessionOverrides)
  return {
    ...overrides,
    b2b: mockSignedIn
      ? {
          userName: 'Storybook User',
          userEmail: 'buyer@example.com',
          unitId: 'storybook-unit-id',
          customerId: 'storybook-customer-id',
        }
      : null,
    channel: '{"salesChannel":"1"}',
    country: 'USA',
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

export function useBuyButton_unstable(items: unknown) {
  return {
    onClick: (event: { preventDefault(): void }) => {
      event.preventDefault()
      console.log('[Storybook mock] useBuyButton_unstable onClick with', items)
    },
  }
}

export function useCart_unstable(): { id?: string } {
  return { id: 'storybook-order-form-id' }
}

const FIXTURE_RECENT_ORDERS = [
  ['1475130512345-01', '2026-10-27T14:03:00Z', 'ready-for-handling', 1284550, false],
  ['1474920500431-01', '2026-10-21T09:41:00Z', 'invoiced', 492000, false],
  ['1474700498112-01', '2026-10-14T16:20:00Z', 'invoiced', 2310075, true],
  ['1474410487705-01', '2026-10-02T11:05:00Z', 'canceled', 87500, false],
  ['1474100476230-01', '2026-09-24T08:30:00Z', 'something-new', 150000, false],
].map(([orderId, creationDate, status, totalValue, isAllDelivered]) => ({
  orderId,
  creationDate,
  status,
  totalValue,
  isAllDelivered,
}))

// SeCheckStockAndPricing: Ref IDs GLV-100…GLV-103 and BOOT-200…BOOT-201. GLV-102 is out of stock,
// GLV-101 and BOOT-201 are low; anything else has 120 units.
const FIXTURE_STOCK: Record<string, number> = { glv101: 18, glv102: 0, boot201: 7 }

const stockProduct = (id: string, name: string, prefix: string, sizes: string[], price: number) => ({
  slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id}`,
  brand: { name: 'Storybook' },
  isVariantOf: { name, productGroupID: id },
  additionalProperty: [{ propertyID: 'size', name: 'Size' }],
  seSkus: sizes.map((size, index) => ({
    itemId: `${prefix.toLowerCase()}${100 * (prefix === 'GLV' ? 1 : 2) + index}`,
    name: `${name} — ${size}`,
    ean: null,
    referenceCode: `${prefix}-${100 * (prefix === 'GLV' ? 1 : 2) + index}`,
    unitMultiplier: 1,
    imageUrl: null,
    imageAlt: null,
    variations: [{ name: 'Size', values: [size] }],
    sellerId: '1',
    price: price + index,
    listPrice: price + index,
    availableQuantity: 100,
  })),
})

const FIXTURE_STOCK_PRODUCTS = [
  stockProduct('1', 'Nitrile Gloves', 'GLV', ['S', 'M', 'L', 'XL'], 12.5),
  stockProduct('2', 'Steel Toe Boots', 'BOOT', ['9', '10'], 89),
]

const FIXTURE_SHOPPER_ADDRESSES = {
  defaultAddressId: 'address-hq',
  addresses: [
    ['address-hq', 'commercial', 'Downtown', 'Chicago', 'IL', '60601'],
    ['address-wh', 'commercial', 'Elk Grove Village', 'Chicago', 'IL', '60007'],
    ['address-tx', 'commercial', 'Northwest', 'Austin', 'TX', '78759'],
    ['address-home', 'residential', 'Lincoln Park', 'Chicago', 'IL', '60614'],
  ].map(([id, addressType, neighborhood, city, state, postalCode]) => ({
    id,
    addressType,
    isActive: true,
    country: 'USA',
    state,
    city,
    neighborhood,
    street: null,
    postalCode,
  })),
}

const FIXTURE_LOW_STOCK = {
  lowStockCount: 3,
  minimumStock: 10,
  stockBySku: [
    ['101', 'Nitrile Gloves, Box of 100', 4],
    ['205', 'Safety Glasses, Clear', 2],
    ['318', 'Hi-Vis Vest, Size L', 6],
  ].map(([id, name, total]) => ({
    total,
    sku: {
      id,
      name,
      imageUrl: `https://placehold.co/110x110?text=${encodeURIComponent(String(name).split(',')[0])}`,
      detailUrl: `/${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}/p`,
    },
  })),
}

const FIXTURE_MONTHLY_SPEND = [
  ['May', 1820000, 9],
  ['Jun', 2465000, 12],
  ['Jul', 1390000, 7],
  ['Aug', 3105000, 15],
  ['Sep', 2780000, 11],
  ['Oct', 4174125, 18],
].map(([month, totalValue, totalOrders]) => ({ month, totalValue, totalOrders }))

/**
 * Answers by operation (the mocked `gql` hands back the raw query text) and, like the real hook,
 * resolves `execute` to the response. `seSubmitOrganizationRequest` fails when the company name
 * is "fail", so stories can exercise the error path.
 */
function mockLazyResponse(query: unknown, variables: unknown): unknown {
  const text = String(query)

  if (text.includes('seSkuAvailability')) {
    const items = (variables as { items?: Array<{ id: string }> })?.items ?? []
    return {
      seSkuAvailability: items.map(({ id }) => {
        const quantity = FIXTURE_STOCK[id] ?? 120
        return { id, availability: quantity > 0 ? 'available' : 'withoutStock', availableQuantity: quantity }
      }),
    }
  }
  if (text.includes('query SeSkuSearch')) {
    const term = String((variables as { term?: string })?.term ?? '').toLowerCase()
    const matches = FIXTURE_STOCK_PRODUCTS.filter((product) =>
      product.seSkus.some((sku) => sku.referenceCode.toLowerCase().includes(term)),
    )
    return { search: { products: { edges: matches.map((node) => ({ node })) } } }
  }
  if (text.includes('seShopperAddresses')) return { seShopperAddresses: FIXTURE_SHOPPER_ADDRESSES }
  if (text.includes('seOpenOrdersCount')) {
    return {
      seOpenOrdersCount: 7,
      seOrdersPendingApprovalCount: 2,
      seBudgets: [
        { id: 'budget-1', balance: { amount: 50000, remaining: 18625 } },
        { id: 'budget-2', balance: { amount: 25000, remaining: 12500 } },
      ],
    }
  }
  if (text.includes('seLowStockItems')) return { seLowStockItems: FIXTURE_LOW_STOCK }
  if (text.includes('seRecentOrders')) return { seRecentOrders: FIXTURE_RECENT_ORDERS }
  if (text.includes('seSpendOverview')) return { seSpendOverview: { monthlyOrderValues: FIXTURE_MONTHLY_SPEND } }

  if (text.includes('seSubmitOrganizationRequest')) {
    const companyName = (variables as { data?: { companyName?: string } })?.data?.companyName
    return { seSubmitOrganizationRequest: { success: companyName?.toLowerCase() !== 'fail' } }
  }

  return {
    seAddComposedSet: {
      orderFormId: 'storybook-order-form-id',
      value: 12550,
      messages: [],
    },
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars -- signature must match the real hook's */
export function useLazyQuery_unstable<TData = unknown, TVariables = unknown>(query: unknown, variables: TVariables) {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const [data, setData] = useState<TData | undefined>(undefined)

  const submit = useCallback(
    async (submittedVariables: TVariables) => {
      console.log('[Storybook mock] useLazyQuery_unstable called with', submittedVariables)
      await new Promise((resolve) => setTimeout(resolve, 400))
      const response = mockLazyResponse(query, submittedVariables) as TData
      setData(response)
      return response
    },
    [query],
  )

  return [submit, { data }] as [(submittedVariables: TVariables) => Promise<TData>, { data: TData | undefined }]
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
