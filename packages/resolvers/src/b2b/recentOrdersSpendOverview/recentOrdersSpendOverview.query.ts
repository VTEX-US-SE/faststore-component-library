/**
 * Plain GraphQL strings, not wrapped in `gql(...)` -- see assemblySet.query.ts for why.
 * Consumers get them inlined as literal text by `se-components add` / `add-resolver`.
 */
export const SE_RECENT_ORDERS_QUERY = `
  query SeRecentOrders($limit: Int) {
    seRecentOrders(limit: $limit) {
      orderId
      creationDate
      status
      totalValue
      isAllDelivered
    }
  }
`

export const SE_SPEND_OVERVIEW_QUERY = `
  query SeSpendOverview {
    seSpendOverview {
      monthlyOrderValues {
        month
        totalValue
        totalOrders
      }
    }
  }
`
