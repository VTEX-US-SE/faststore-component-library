import { getAsShopper, vtexPlatformHost, type ShopperRequestContext } from '../shared/shopperRequest'

export interface RecentOrdersSpendOverviewConfig {
  storeId: string
  environment?: string
  /**
   * The account's spend-overview endpoint. Not a standard VTEX API: the Buyer Portal kit reads
   * it from a custom IO app on the demo accounts, at `https://{storeId}.myvtex.com/_v/spend-overview`
   * (the default). Accounts without that app get no chart -- `seSpendOverview` resolves to null
   * and the component hides the panel.
   */
  spendOverviewUrl?: string
}

export interface SeRecentOrder {
  orderId: string
  creationDate: string
  status: string
  totalValue: number
  isAllDelivered: boolean
}

export interface SeMonthlySpend {
  month: string
  totalValue: number
  totalOrders: number
}

export interface SeSpendOverview {
  monthlyOrderValues: SeMonthlySpend[] | null
}

interface OmsOrderListItem {
  orderId: string
  creationDate: string
  status: string
  totalValue: number
  isAllDelivered?: boolean
}

const DEFAULT_LIMIT = 5
const MAX_LIMIT = 15

const LOG_PREFIX = '[@vtex-us-se/resolvers] recentOrdersSpendOverview:'

/**
 * Factory (config instead of importing the consuming project's discovery.config.js -- see
 * assemblySet.resolver.ts) returning a `Query` resolver map (`resolverShape: "map"`) with
 * `seRecentOrders` and `seSpendOverview`, both called as the signed-in shopper.
 *
 * Ported from faststore-b2b-buyer-portal-kit's `getRecentOrders` / `getSpendOverview`, which
 * hardcoded `vtexcommercestable`, forwarded the browser's whole cookie header, and returned an
 * `{ error }` object where GraphQL expected a list.
 */
export function createRecentOrdersSpendOverviewResolver(config: RecentOrdersSpendOverviewConfig) {
  const ordersUrl = `${vtexPlatformHost(config)}/api/oms/user/orders?page=1`
  const spendOverviewUrl = config.spendOverviewUrl ?? `https://${config.storeId}.myvtex.com/_v/spend-overview`

  return {
    Query: {
      seRecentOrders: async (
        _root: unknown,
        { limit }: { limit?: number | null },
        ctx: ShopperRequestContext,
      ): Promise<SeRecentOrder[]> => {
        const data = await getAsShopper<{ list?: OmsOrderListItem[] }>(ordersUrl, ctx, LOG_PREFIX)
        const count = Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)

        return (data?.list ?? []).slice(0, count).map((order) => ({
          orderId: order.orderId,
          creationDate: order.creationDate,
          status: order.status,
          totalValue: order.totalValue,
          isAllDelivered: order.isAllDelivered ?? false,
        }))
      },

      seSpendOverview: async (
        _root: unknown,
        _args: unknown,
        ctx: ShopperRequestContext,
      ): Promise<SeSpendOverview | null> => {
        const data = await getAsShopper<{ monthlyOrderValues?: SeMonthlySpend[] | null }>(
          spendOverviewUrl,
          ctx,
          LOG_PREFIX,
        )
        if (!data) return null

        return { monthlyOrderValues: data.monthlyOrderValues ?? null }
      },
    },
  }
}
