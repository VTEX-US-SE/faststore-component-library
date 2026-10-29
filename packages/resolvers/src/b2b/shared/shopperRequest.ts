/**
 * Helpers for resolvers that call VTEX *as the signed-in shopper* (OMS user orders, Buyer
 * Portal budgets, ...), i.e. on behalf of the browser that sent the GraphQL request rather than
 * with an app key/token.
 */

/** The slice of FastStore's GraphQL context these resolvers read. */
export interface ShopperRequestContext {
  headers?: Record<string, string | string[] | undefined>
}

export interface VtexHostConfig {
  storeId: string
  environment?: string
}

export function vtexPlatformHost({ storeId, environment }: VtexHostConfig): string {
  return `https://${storeId}.${environment ?? 'vtexcommercestable'}.com.br`
}

function cookieHeader(ctx: ShopperRequestContext): string {
  const raw = ctx.headers?.cookie
  return Array.isArray(raw) ? raw.join('; ') : (raw ?? '')
}

/**
 * Only the shopper's VTEX ID cookies (`VtexIdclientAutCookie` and its account-scoped
 * `VtexIdclientAutCookie_<account>` variants), re-serialized as a `Cookie` header. The kit
 * forwarded the browser's whole cookie header; nothing else in it is needed to authenticate
 * against VTEX, so nothing else leaves the storefront.
 */
export function vtexAuthCookieHeader(ctx: ShopperRequestContext): string {
  return cookieHeader(ctx)
    .split(';')
    .map((pair) => pair.trim())
    .filter((pair) => pair.startsWith('VtexIdclientAutCookie'))
    .join('; ')
}

/** The shopper's VTEX ID token for `storeId`, for APIs that take it as a header instead of a cookie. */
export function vtexAuthToken(ctx: ShopperRequestContext, storeId: string): string | undefined {
  for (const pair of cookieHeader(ctx).split(';')) {
    const [name, ...value] = pair.trim().split('=')
    if (name === `VtexIdclientAutCookie_${storeId}`) return value.join('=')
  }
  return undefined
}

/**
 * GETs `url` as the shopper and returns its JSON body, or `undefined` (after logging why) when
 * there's no VTEX ID cookie, the request fails, or VTEX answers with an error status. Callers
 * map `undefined` to their field's empty value instead of throwing, so one failing widget
 * doesn't fail every other field in the same GraphQL response.
 */
export async function getAsShopper<T>(
  url: string,
  ctx: ShopperRequestContext,
  logPrefix: string,
  headers: Record<string, string> = {},
): Promise<T | undefined> {
  const cookie = vtexAuthCookieHeader(ctx)
  if (!cookie && !headers.VtexIdclientAutCookie) {
    // Signed-out shopper: expected (the components only query inside a B2B session), not an error.
    return undefined
  }

  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json', ...(cookie ? { cookie } : {}), ...headers },
    })

    if (!response.ok) {
      console.error(`${logPrefix} ${url} returned ${response.status}:`, await response.text().catch(() => ''))
      return undefined
    }

    return (await response.json()) as T
  } catch (error) {
    console.error(`${logPrefix} request to ${url} failed:`, error)
    return undefined
  }
}
