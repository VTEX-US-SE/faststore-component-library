---
"@vtex-us-se/resolvers": minor
"@vtex-us-se/components": minor
"@vtex-us-se/ui": minor
"@vtex-us-se/cli": minor
---

Add the Buyer Portal kit's "Add to a purchase list" (left out of wave 2).

- **resolvers**: `purchaseLists` exports the picker's own list query and add-items / create
  mutations (`SeAddToPurchaseListLists`, `SeAddToPurchaseListAddItems`,
  `SeAddToPurchaseListCreate`), named apart from `SePurchaseLists`' so a store with both
  components never defines one operation twice. No schema change.
- **components**: `useAddToPurchaseList(products)`, `usePdpPurchaseListProducts(quantity)` and
  `purchaseListItemsFrom()`.
- **ui**: `SeAddToPurchaseList` PDP section (selected SKU → one of the buyer's lists, or a new
  one, in a drawer) and its reusable `SeAddToPurchaseListButton`. `SeCheckStockAndPricing` gains
  an "Add all to a purchase list" button (new `addToListLabel` / `purchaseListsUrl` props), so it
  now also needs `add-resolver purchaseLists`.
- **cli**: `add` copies a sibling component that a copied component imports by relative path
  (`../<Name>/…`) into `<source-dir>/../<Name>/`, without registering it as a section — how
  `SeCheckStockAndPricing` gets `SeAddToPurchaseList`'s picker with a single shared copy of its
  operations.
