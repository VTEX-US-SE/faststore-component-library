/**
 * Plain GraphQL strings, not wrapped in `gql(...)` -- see assemblySet.query.ts for why.
 * Consumers get them inlined as literal text by `se-components add` / `add-resolver`.
 */

/** The three cheap tiles in one round trip. */
export const SE_DASHBOARD_SUMMARY_QUERY = `
  query SeDashboardSummary($unitId: String!) {
    seOpenOrdersCount
    seOrdersPendingApprovalCount
    seBudgets(unitId: $unitId) {
      id
      balance {
        amount
        remaining
      }
    }
  }
`

/** Separate from the summary: the low-stock service can answer null for a while (still computing) and gets retried on its own. */
export const SE_LOW_STOCK_ITEMS_QUERY = `
  query SeLowStockItems {
    seLowStockItems {
      lowStockCount
      minimumStock
      stockBySku {
        total
        sku {
          id
          name
          imageUrl
          detailUrl
        }
      }
    }
  }
`
