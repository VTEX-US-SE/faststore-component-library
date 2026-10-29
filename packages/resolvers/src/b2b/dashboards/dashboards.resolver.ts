import { getAsShopper, vtexAuthToken, vtexPlatformHost, type ShopperRequestContext } from '../shared/shopperRequest'

export interface DashboardsConfig {
  storeId: string
  environment?: string
  /**
   * The account's low-stock endpoint. Not a standard VTEX API: the Buyer Portal kit reads it
   * from a custom IO app on the demo accounts, at `https://{storeId}.myvtex.com/_v/low-stock`
   * (the default). Accounts without that app get `seLowStockItems: null` and the tile shows a dash.
   */
  lowStockUrl?: string
}

export interface SeBudget {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
  status: string | null
  balance: { amount: number; balanceAdjustment: number | null; remaining: number }
}

export interface SeLowStockItems {
  lowStockCount: number
  minimumStock: number
  stockBySku: Array<{
    total: number
    sku: { id: string; name: string; imageUrl: string | null; detailUrl: string | null }
  }>
}

/** OMS statuses the kit counts as "open" (placed, pending payment/approval, approved, ready). */
const OPEN_STATUSES = [
  'payment-pending',
  'waiting-for-authorization',
  'payment-denied',
  'payment-approved',
  'ready-for-handling',
]

const PENDING_APPROVAL_STATUSES = ['waiting-for-authorization']

/** Buyer Portal unit ids are UUID-ish; anything else never reaches the URL path. */
const UNIT_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/

const LOG_PREFIX = '[@vtex-us-se/resolvers] dashboards:'

interface LowStockResponse {
  lowStockCount?: number
  minimumStock?: number
  stockBySku?: Array<{ total?: number; sku?: { id?: string; name?: string; imageUrl?: string; detailUrl?: string } }>
}

/**
 * Factory (config instead of importing the consuming project's discovery.config.js -- see
 * assemblySet.resolver.ts) returning a `Query` resolver map (`resolverShape: "map"`) for the
 * Buyer Portal home tiles, all called as the signed-in shopper.
 *
 * Ported from faststore-b2b-buyer-portal-kit's `getOpenOrders` / `getPendingOrders` /
 * `getBudgets` / `lowStockItems`. Same endpoints, but failures resolve to null instead of an
 * `{ error }` object in an `Int!`/list field (a GraphQL error that also failed every other tile
 * in the same response), and `unitId` is validated before it's put in a URL path.
 */
export function createDashboardsResolver(config: DashboardsConfig) {
  const host = vtexPlatformHost(config)
  const ordersCountUrl = (statuses: string[]) => `${host}/api/oms/user/orders?page=1&per_page=1&status=${statuses.join(',')}`
  const lowStockUrl = config.lowStockUrl ?? `https://${config.storeId}.myvtex.com/_v/low-stock`

  const countOrders = async (statuses: string[], ctx: ShopperRequestContext): Promise<number | null> => {
    const data = await getAsShopper<{ paging?: { total?: number } }>(ordersCountUrl(statuses), ctx, LOG_PREFIX)
    return data?.paging?.total ?? null
  }

  return {
    Query: {
      seOpenOrdersCount: (_root: unknown, _args: unknown, ctx: ShopperRequestContext) => countOrders(OPEN_STATUSES, ctx),

      seOrdersPendingApprovalCount: (_root: unknown, _args: unknown, ctx: ShopperRequestContext) =>
        countOrders(PENDING_APPROVAL_STATUSES, ctx),

      seBudgets: async (
        _root: unknown,
        { unitId }: { unitId: string },
        ctx: ShopperRequestContext,
      ): Promise<SeBudget[] | null> => {
        if (!UNIT_ID_PATTERN.test(unitId)) {
          console.warn(`${LOG_PREFIX} rejected unitId ${JSON.stringify(unitId)}`)
          return null
        }

        // The budgets API takes the VTEX ID token as a header, not as a cookie.
        const token = vtexAuthToken(ctx, config.storeId)
        if (!token) return null

        const data = await getAsShopper<{ items?: SeBudget[] }>(
          `https://${config.storeId}.myvtex.com/api/budgets/unit/${unitId}?pageSize=20&status=ACTIVE`,
          ctx,
          LOG_PREFIX,
          { VtexIdclientAutCookie: token },
        )
        return data?.items ?? null
      },

      seLowStockItems: async (_root: unknown, _args: unknown, ctx: ShopperRequestContext): Promise<SeLowStockItems | null> => {
        const data = await getAsShopper<LowStockResponse | null>(lowStockUrl, ctx, LOG_PREFIX)
        if (!data || data.lowStockCount == null || !Array.isArray(data.stockBySku)) return null

        return {
          lowStockCount: data.lowStockCount,
          minimumStock: data.minimumStock ?? 0,
          stockBySku: data.stockBySku
            .filter((item) => item.sku?.id && item.sku?.name)
            .map((item) => ({
              total: item.total ?? 0,
              sku: {
                id: item.sku?.id as string,
                name: item.sku?.name as string,
                imageUrl: item.sku?.imageUrl ?? null,
                detailUrl: item.sku?.detailUrl ?? null,
              },
            })),
        }
      },
    },
  }
}
