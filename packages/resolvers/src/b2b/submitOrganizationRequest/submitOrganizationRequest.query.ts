/**
 * Plain GraphQL string, not wrapped in `gql(...)` — @faststore/core/api's `gql` only resolves
 * inside a real FastStore project (it re-exports from that project's own codegen output).
 * Consumers wrap this string with their own `gql(...)` — see the CLI-generated client wrapper.
 */
export const SUBMIT_ORGANIZATION_REQUEST_MUTATION = `
  mutation SubmitOrganizationRequest(
    $companyName: String!
    $contactName: String!
    $email: String!
    $phone: String
    $message: String
  ) {
    submitOrganizationRequest(
      companyName: $companyName
      contactName: $contactName
      email: $email
      phone: $phone
      message: $message
    ) {
      success
    }
  }
`
