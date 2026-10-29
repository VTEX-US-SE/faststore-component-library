import { getAsShopper, vtexAuthToken, type ShopperRequestContext } from '../shared/shopperRequest'

export interface ShopperAddressesConfig {
  storeId: string
}

export interface SeShopperAddress {
  id: string
  addressType: string | null
  isActive: boolean | null
  country: string | null
  state: string | null
  city: string | null
  neighborhood: string | null
  street: string | null
  postalCode: string | null
}

export interface SeShopperAddresses {
  defaultAddressId: string | null
  addresses: SeShopperAddress[]
}

type SessionValue<T> = { value?: T | string }

interface SessionResponse {
  namespaces?: {
    shopper?: {
      scopes?: SessionValue<{ 'vtex.master-data'?: { AD?: Array<{ ids?: string[] }> } }>
      defaults?: SessionValue<{ address?: { shipping?: string } }>
    }
  }
}

/** Master Data document ids are UUID-ish; anything else never reaches the URL path. */
const DOCUMENT_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/

/** A Buyer Portal unit rarely has more; caps the fan-out of one request. */
const MAX_ADDRESSES = 50

const AD_FIELDS = 'id,addressType,isActive,country,state,city,neighborhood,street,postalCode'

const LOG_PREFIX = '[@vtex-us-se/resolvers] shopperAddresses:'

/** Session namespace values arrive either already parsed or as a JSON string. */
function sessionValue<T>(entry: SessionValue<T> | undefined): T | undefined {
  const value = entry?.value
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value) as T
  } catch {
    return undefined
  }
}

/**
 * Factory (config instead of importing the consuming project's discovery.config.js -- see
 * assemblySet.resolver.ts) returning the single `Query.seShopperAddresses` field resolver
 * (`resolverShape: "field"` in shopperAddresses.meta.json).
 *
 * Replaces the Buyer Portal kit's address flow, where `RegionalizationB2B` (hidden inside its
 * navbar) fetched the whole session from the browser, then one `getAddress` round trip per
 * address id, and `AddressSelector` only worked if that navbar had already filled localStorage.
 * Here one query reads the session server-side and fetches every address in parallel.
 */
export function createShopperAddressesResolver(config: ShopperAddressesConfig) {
  const host = `https://${config.storeId}.myvtex.com`

  return async (_root: unknown, _args: unknown, ctx: ShopperRequestContext): Promise<SeShopperAddresses | null> => {
    const session = await getAsShopper<SessionResponse>(
      `${host}/api/sessions?items=shopper.scopes,shopper.defaults`,
      ctx,
      LOG_PREFIX,
      {},
      ['vtex_session'],
    )
    if (!session) return null

    const shopper = session.namespaces?.shopper
    const ids = (sessionValue(shopper?.scopes)?.['vtex.master-data']?.AD?.[0]?.ids ?? [])
      .filter((id) => DOCUMENT_ID_PATTERN.test(id))
      .slice(0, MAX_ADDRESSES)
    const defaultAddressId = sessionValue(shopper?.defaults)?.address?.shipping ?? null

    const token = vtexAuthToken(ctx, config.storeId)
    const headers: Record<string, string> = token ? { VtexIdclientAutCookie: token } : {}

    const documents = await Promise.all(
      ids.map((id) =>
        getAsShopper<Partial<SeShopperAddress>>(
          `${host}/api/dataentities/AD/documents/${id}?_fields=${AD_FIELDS}`,
          ctx,
          LOG_PREFIX,
          headers,
        ),
      ),
    )

    const addresses = documents
      .map((document, index) =>
        document
          ? {
              id: document.id ?? (ids[index] as string),
              addressType: document.addressType ?? null,
              isActive: document.isActive ?? null,
              country: document.country ?? null,
              state: document.state ?? null,
              city: document.city ?? null,
              neighborhood: document.neighborhood ?? null,
              street: document.street ?? null,
              postalCode: document.postalCode ?? null,
            }
          : undefined,
      )
      .filter((address): address is SeShopperAddress => address !== undefined)

    return { defaultAddressId, addresses }
  }
}
