import type { AssemblyGroup, AssemblyItem, SetSelection } from './types'

const IN_STOCK = 'https://schema.org/InStock'

/** Highest number of set copies the stepper allows. Each copy costs two Checkout requests. */
export const MAX_QTY = 10

/**
 * Expands the tokens allowed in CMS copy against one group, so the text follows the
 * composition instead of restating it. Unknown tokens are left untouched rather than
 * blanked, which makes a typo visible in the UI.
 */
export const expandTokens = (text: string, tokens: { min: number; max: number; selected: number }) =>
  text.replace(/\{(min|max|selected)\}/g, (_match, key: keyof typeof tokens) => String(tokens[key]))

/** The offer a child SKU is sold at -- first seller wins, as elsewhere. */
export const bestOffer = (item: AssemblyItem) => item.product?.offers?.offers?.[0]

/** Whether a child SKU can currently be added to a set. */
export const isInStock = (item: AssemblyItem) => bestOffer(item)?.availability === IN_STOCK

/**
 * Opening quantities for a set: each item's declared `initialQuantity`, except
 * out-of-stock ones, which start at 0.
 *
 * This is the single place stock is enforced on selection. An out-of-stock item hides its
 * stepper, so a shopper could never clear a nonzero seed -- yet it would still count toward
 * the group gate, the progress bar and the displayed price, while `setSelection` dropped it
 * from the composition sent to Checkout. Zeroing here keeps all four in agreement by
 * construction.
 */
export const initialQuantities = (groups: AssemblyGroup[]) =>
  Object.fromEntries(
    groups.flatMap((group) =>
      group.items.map((item): [string, number] => [item.skuId, isInStock(item) ? item.initialQuantity : 0]),
    ),
  )

/** Total picked across one group -- this is what the min/max gate measures. */
export const groupTotal = (group: AssemblyGroup, quantities: Record<string, number>) =>
  group.items.reduce((sum, item) => sum + (quantities[item.skuId] ?? 0), 0)

/** Whether a group's own min/max gate is met, which is what opens the CTA. */
export const isGroupSatisfied = (group: AssemblyGroup, quantities: Record<string, number>) => {
  const total = groupTotal(group, quantities)

  return total >= group.minQuantity && total <= group.maxQuantity
}

/**
 * The chosen children in the shape the Checkout composition endpoint wants. Out-of-stock
 * items are dropped: a composition seeded from `initialQuantity` could otherwise carry one,
 * and Checkout would reject the whole call.
 */
export const setSelection = (groups: AssemblyGroup[], quantities: Record<string, number>): SetSelection[] =>
  groups
    .flatMap((group) => group.items)
    .flatMap((item) => {
      const offer = bestOffer(item)
      const quantity = quantities[item.skuId] ?? 0

      if (!offer || quantity === 0 || !isInStock(item)) {
        return []
      }

      return [{ skuId: item.skuId, quantity, seller: offer.seller.identifier }]
    })
