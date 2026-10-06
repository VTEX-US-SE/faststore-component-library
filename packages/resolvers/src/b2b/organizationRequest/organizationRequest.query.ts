/**
 * Plain GraphQL string, not wrapped in `gql(...)` -- see assemblySet.query.ts for why.
 * Consumers get it inlined as literal text by `se-components add` / `add-resolver`.
 */
export const SE_SUBMIT_ORGANIZATION_REQUEST_MUTATION = `
  mutation SeSubmitOrganizationRequest($data: SeOrganizationRequestInput!) {
    seSubmitOrganizationRequest(data: $data) {
      success
    }
  }
`
