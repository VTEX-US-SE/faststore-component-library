import { vtexAuthCookieHeader, vtexPlatformHost, type ShopperRequestContext } from '../shared/shopperRequest'

export interface SkuAvailabilityConfig {
  storeId: string
  environment?: string
  /** Trade policy to simulate in (`sc`). VTEX's own default (1) when unset. */
  salesChannel?: string
  /**
   * Simulation endpoint. Defaults to VTEX Checkout's public cart simulation
   * (`/api/checkout/pub/orderForms/simulation`). The Buyer Portal kit called a custom IO app on
   * the demo accounts instead (`https://{storeId}.myvtex.com/_v/availability`), which answers in
   * the same shape -- pass that URL to keep using it.
   */
  availabilityUrl?: string
}

export interface SeSkuAvailabilityInput {
  id: string
  seller: string
}

export interface SeSkuAvailability {
  id: string
  availability: string | null
  availableQuantity: number | null
}

interface SimulationResponse {
  items?: Array<{ id?: string; availability?: string; requestIndex?: number }>
  purchaseConditions?: { itemPurchaseConditions?: Array<{ id?: string; stockBalance?: number }> }
}

/** One simulation request; a CSV import beyond this is split across several. */
const MAX_ITEMS_PER_SIMULATION = 50
const MAX_ITEMS = 500

const SKU_ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/
const COUNTRY_PATTERN = /^[A-Za-z]{2,3}$/

const LOG_PREFIX = '[@vtex-us-se/resolvers] skuAvailability:'

/**
 * Factory (config instead of importing the consuming project's discovery.config.js -- see
 * assemblySet.resolver.ts) returning the single `Query.seSkuAvailability` field resolver
 * (`resolverShape: "field"` in skuAvailability.meta.json).
 *
 * Ported from faststore-b2b-buyer-portal-kit's `availability` mutation. Simulates with a
 * quantity of one per SKU (enough to read stock) and forwards the shopper's session and VTEX ID
 * cookies, so a B2B trade policy or price table bound to the session applies.
 */
export function createSkuAvailabilityResolver(config: SkuAvailabilityConfig) {
  const url =
    config.availabilityUrl ??
    `${vtexPlatformHost(config)}/api/checkout/pub/orderForms/simulation` +
      (config.salesChannel ? `?sc=${encodeURIComponent(config.salesChannel)}` : '')

  const simulate = async (
    items: SeSkuAvailabilityInput[],
    country: string,
    postalCode: string | null | undefined,
    ctx: ShopperRequestContext,
  ): Promise<SeSkuAvailability[] | null> => {
    const cookie = vtexAuthCookieHeader(ctx, ['vtex_session', 'vtex_segment'])

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify({
          items: items.map(({ id, seller }) => ({ id, seller, quantity: 1 })),
          country,
          ...(postalCode ? { postalCode } : {}),
        }),
      })

      if (!response.ok) {
        console.error(`${LOG_PREFIX} simulation returned ${response.status}:`, await response.text().catch(() => ''))
        return null
      }

      const data = (await response.json()) as SimulationResponse
      const stock = new Map(
        (data.purchaseConditions?.itemPurchaseConditions ?? []).map((condition) => [condition.id, condition.stockBalance]),
      )
      const byRequest = new Map((data.items ?? []).map((item, index) => [item.requestIndex ?? index, item]))

      return items.map(({ id }, index) => {
        const item = byRequest.get(index)
        const balance = stock.get(id)
        return {
          id,
          availability: item?.availability ?? null,
          availableQuantity: typeof balance === 'number' ? balance : null,
        }
      })
    } catch (error) {
      console.error(`${LOG_PREFIX} simulation request failed:`, error)
      return null
    }
  }

  return async (
    _root: unknown,
    args: { items: SeSkuAvailabilityInput[]; country: string; postalCode?: string | null },
    ctx: ShopperRequestContext,
  ): Promise<SeSkuAvailability[] | null> => {
    const items = args.items
      .filter((item) => SKU_ID_PATTERN.test(item.id) && SKU_ID_PATTERN.test(item.seller))
      .slice(0, MAX_ITEMS)
    if (items.length === 0) return []
    if (!COUNTRY_PATTERN.test(args.country)) {
      console.warn(`${LOG_PREFIX} rejected country ${JSON.stringify(args.country)}`)
      return null
    }

    const batches: SeSkuAvailabilityInput[][] = []
    for (let start = 0; start < items.length; start += MAX_ITEMS_PER_SIMULATION) {
      batches.push(items.slice(start, start + MAX_ITEMS_PER_SIMULATION))
    }

    const results = await Promise.all(batches.map((batch) => simulate(batch, args.country, args.postalCode, ctx)))
    if (results.some((result) => result === null)) return null
    return results.flat() as SeSkuAvailability[]
  }
}
