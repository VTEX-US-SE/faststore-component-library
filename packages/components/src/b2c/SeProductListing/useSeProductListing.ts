// @se-components source-copy: core-runtime
// This logic must run against the store's own @faststore/core instance (its page context and
// native gallery), which only code inside the store's src/ gets. So the CLI copies this component
// into the store, and it is exported from the `@vtex-us-se/components/product-listing` subpath
// only, never from the package barrels, which would bundle a second @faststore/core for everyone.
import { ProductGallerySection, isPLP, usePage } from '@faststore/core'
import type { PLPContext, SearchPageContext } from '@faststore/core'

/**
 * Category title for the current page: `override` when set, else the last breadcrumb item of a
 * PLP, else its SEO title. Empty on search pages.
 */
export function useSeProductListingTitle(override?: string): string {
  const context = usePage<PLPContext | SearchPageContext>()

  if (override) return override
  if (!isPLP(context)) return ''

  const collection = context.data?.collection
  const crumbs = collection?.breadcrumbList?.itemListElement ?? []

  return crumbs[crumbs.length - 1]?.name ?? collection?.seo?.title ?? ''
}

/** The native gallery section (facets, sorting, load more, SEO links and analytics). */
export const SeProductListingGallery = ProductGallerySection
