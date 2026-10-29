/** One SKU to save to a purchase list. */
export type AddToPurchaseListProduct = { skuId: string; quantity: number }

export type AddToPurchaseListVisibility = 'private' | 'organization'

/** A list the buyer can add items to: their own, or one their organization shares with them. */
export type AddToPurchaseListOption = {
  documentId: string
  name: string
  visibility: AddToPurchaseListVisibility
  ownerEmail: string
  isOwner: boolean
  items: AddToPurchaseListProduct[]
}

export type AddToPurchaseListError = 'UNAUTHENTICATED' | 'INVALID' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'FAILED'

/** The text a buyer sees for each error code the resolvers send back. */
export const ADD_TO_PURCHASE_LIST_ERROR_MESSAGES: Record<AddToPurchaseListError, string> = {
  UNAUTHENTICATED: 'Your session expired. Sign in again to save items to a purchase list.',
  INVALID: 'Please check the name and quantities and try again.',
  NOT_FOUND: 'That purchase list no longer exists.',
  FORBIDDEN: "You can't add items to that list.",
  CONFLICT: 'You already have a purchase list with that name.',
  FAILED: 'Something went wrong. Please try again.',
}

/**
 * What gets sent: whole positive quantities only, one entry per SKU (repeated SKUs summed) --
 * the resolvers answer INVALID to anything else, which would fail the whole request.
 */
export function purchaseListItemsFrom(products: AddToPurchaseListProduct[]): AddToPurchaseListProduct[] {
  const quantities = new Map<string, number>()
  for (const { skuId, quantity } of products) {
    const units = Math.floor(Number.isFinite(quantity) ? quantity : 0)
    if (!skuId || units <= 0) continue
    quantities.set(skuId, (quantities.get(skuId) ?? 0) + units)
  }
  return [...quantities].map(([skuId, quantity]) => ({ skuId, quantity }))
}
