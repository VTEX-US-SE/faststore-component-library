import { getAsShopper, vtexPlatformHost, type ShopperRequestContext } from '../shared/shopperRequest'

export interface PurchaseListsConfig {
  storeId: string
  environment?: string
  /** Master Data v2 entity the lists live in (the Buyer Portal kit's `PL`). */
  dataEntity?: string
  /**
   * VTEX app key/token with read/write access to `dataEntity`. Default to the
   * `FS_DISCOVERY_APP_KEY` / `FS_DISCOVERY_APP_TOKEN` env vars, read per request (see
   * organizationRequest.resolver.ts).
   */
  appKey?: string
  appToken?: string
}

export type SePurchaseListVisibility = 'private' | 'organization'

export interface SePurchaseListItem {
  skuId: string
  quantity: number
}

export interface SePurchaseList {
  documentId: string
  name: string
  visibility: SePurchaseListVisibility
  items: SePurchaseListItem[]
  ownerEmail: string
  isOwner: boolean
}

export type SePurchaseListError = 'UNAUTHENTICATED' | 'INVALID' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'FAILED'

export interface SePurchaseListResult {
  ok: boolean
  error: SePurchaseListError | null
  list: SePurchaseList | null
}

/** A Master Data `PL` document, as the kit stored it (`items` is a JSON string). */
interface PurchaseListDocument {
  id: string
  name?: string
  visibility?: string
  items?: string | null
  ownerEmail?: string
  organizationEmail?: string
}

interface Buyer {
  email: string
  organizationEmail: string
}

const MAX_NAME_LENGTH = 100
const MAX_ITEMS = 500
const MAX_QUANTITY = 100000
const MAX_LISTS = 100
const DOCUMENT_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/
const SKU_ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/
const EMAIL_PATTERN = /^[^\s@"]+@[^\s@"]+\.[^\s@"]+$/
const VISIBILITIES: SePurchaseListVisibility[] = ['private', 'organization']
const FIELDS = 'id,name,visibility,items,ownerEmail,organizationEmail'

const LOG_PREFIX = '[@vtex-us-se/resolvers] purchaseLists:'

const failure = (error: SePurchaseListError): SePurchaseListResult => ({ ok: false, error, list: null })

/** A list name safe to store and to quote inside a Master Data `_where` (no quotes, no control chars). */
function cleanName(name: string): string | undefined {
  const trimmed = name.trim()
  // eslint-disable-next-line no-control-regex
  if (!trimmed || trimmed.length > MAX_NAME_LENGTH || /["\\\u0000-\u001f]/.test(trimmed)) return undefined
  return trimmed
}

function cleanItems(items: SePurchaseListItem[] | null | undefined): SePurchaseListItem[] | undefined {
  const list = items ?? []
  if (list.length > MAX_ITEMS) return undefined
  const valid = list.every(
    (item) => SKU_ID_PATTERN.test(item.skuId) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= MAX_QUANTITY,
  )
  return valid ? list : undefined
}

function parseItems(raw: string | null | undefined): SePurchaseListItem[] {
  try {
    const parsed = JSON.parse(raw ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is SePurchaseListItem => typeof item?.skuId === 'string' && Number.isFinite(item?.quantity))
      .map((item) => ({ skuId: item.skuId, quantity: Math.max(1, Math.floor(item.quantity)) }))
  } catch {
    return []
  }
}

/**
 * Factory (config instead of importing the consuming project's discovery.config.js -- see
 * assemblySet.resolver.ts) returning the `Query`/`Mutation` resolver map for purchase lists
 * (`resolverShape: "map"`), stored in Master Data the same way the Buyer Portal kit did, so
 * lists created by the kit keep working.
 *
 * Unlike the kit: the buyer is identified server-side from their VTEX session on every call,
 * and every mutation checks the document first -- the kit's item mutations accepted any
 * `documentId` and edited it with the app token, whoever owned the list. Owners can do
 * anything; buyers of the same organization can edit the items of lists shared with it. Values
 * are validated before they reach a `_where` clause, and search results aren't capped at Master
 * Data's default page of 15.
 */
export function createPurchaseListsResolver(config: PurchaseListsConfig) {
  const host = vtexPlatformHost(config)
  const entity = encodeURIComponent(config.dataEntity ?? 'PL')

  const appHeaders = (): Record<string, string> | undefined => {
    const appKey = config.appKey ?? process.env.FS_DISCOVERY_APP_KEY
    const appToken = config.appToken ?? process.env.FS_DISCOVERY_APP_TOKEN
    if (!appKey || !appToken) {
      console.error(
        `${LOG_PREFIX} no VTEX app key/token configured. Set FS_DISCOVERY_APP_KEY and FS_DISCOVERY_APP_TOKEN ` +
          '(WebOps Settings in production, vtex.env locally -- never commit real values).',
      )
      return undefined
    }
    return {
      'content-type': 'application/json',
      accept: 'application/json',
      'X-VTEX-API-AppKey': appKey,
      'X-VTEX-API-AppToken': appToken,
    }
  }

  /** The buyer behind this request, from their own VTEX session (never from client input). */
  const currentBuyer = async (ctx: ShopperRequestContext): Promise<Buyer | undefined> => {
    const session = await getAsShopper<{
      namespaces?: {
        authentication?: { storeUserEmail?: { value?: string } }
        profile?: { email?: { value?: string } }
      }
    }>(`${host}/api/sessions?items=profile.email,authentication.storeUserEmail`, ctx, LOG_PREFIX, {}, ['vtex_session'])

    const email = session?.namespaces?.authentication?.storeUserEmail?.value
    const organizationEmail = session?.namespaces?.profile?.email?.value
    if (!email || !EMAIL_PATTERN.test(email)) return undefined
    return { email, organizationEmail: organizationEmail && EMAIL_PATTERN.test(organizationEmail) ? organizationEmail : email }
  }

  const md = async (
    path: string,
    init: { method?: string; body?: unknown; range?: string } = {},
  ): Promise<{ ok: boolean; status: number; data: unknown }> => {
    const headers = appHeaders()
    if (!headers) return { ok: false, status: 0, data: undefined }
    try {
      const response = await fetch(`${host}/api/dataentities/${entity}${path}`, {
        method: init.method ?? 'GET',
        headers: { ...headers, ...(init.range ? { 'REST-Range': init.range } : {}) },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      })
      if (!response.ok) {
        if (response.status !== 404) {
          console.error(`${LOG_PREFIX} Master Data ${init.method ?? 'GET'} ${path} returned ${response.status}`)
        }
        return { ok: false, status: response.status, data: undefined }
      }
      const text = await response.text()
      return { ok: true, status: response.status, data: text ? JSON.parse(text) : undefined }
    } catch (error) {
      console.error(`${LOG_PREFIX} Master Data request failed:`, error)
      return { ok: false, status: 0, data: undefined }
    }
  }

  const search = async (where: string): Promise<PurchaseListDocument[]> => {
    const result = await md(`/search?_where=${encodeURIComponent(where)}&_fields=${FIELDS}`, {
      range: `resources=0-${MAX_LISTS - 1}`,
    })
    return Array.isArray(result.data) ? (result.data as PurchaseListDocument[]) : []
  }

  const toList = (document: PurchaseListDocument, buyer: Buyer): SePurchaseList => ({
    documentId: document.id,
    name: document.name ?? '',
    visibility: document.visibility === 'organization' ? 'organization' : 'private',
    items: parseItems(document.items),
    ownerEmail: document.ownerEmail ?? '',
    isOwner: document.ownerEmail === buyer.email,
  })

  const canView = (document: PurchaseListDocument, buyer: Buyer) =>
    document.ownerEmail === buyer.email ||
    (document.visibility === 'organization' && document.organizationEmail === buyer.organizationEmail)

  /** Loads `documentId` and checks the buyer may touch it (`ownerOnly` for rename/share/delete). */
  const authorize = async (
    ctx: ShopperRequestContext,
    documentId: string,
    ownerOnly: boolean,
  ): Promise<{ buyer: Buyer; document: PurchaseListDocument } | SePurchaseListResult> => {
    if (!DOCUMENT_ID_PATTERN.test(documentId)) return failure('INVALID')
    const buyer = await currentBuyer(ctx)
    if (!buyer) return failure('UNAUTHENTICATED')

    const result = await md(`/documents/${documentId}?_fields=${FIELDS}`)
    if (!result.ok) return failure(result.status === 404 ? 'NOT_FOUND' : 'FAILED')
    const document = result.data as PurchaseListDocument
    // Someone else's private list is reported as missing, not forbidden: its existence isn't theirs to learn.
    if (!canView(document, buyer)) return failure('NOT_FOUND')
    if (ownerOnly && document.ownerEmail !== buyer.email) return failure('FORBIDDEN')
    return { buyer, document }
  }

  const nameTaken = async (buyer: Buyer, name: string, exceptId?: string) =>
    (await search(`ownerEmail="${buyer.email}" AND name="${name}"`)).some((document) => document.id !== exceptId)

  /** PATCHes `changes` onto an authorized document and returns the updated list. */
  const update = async (
    buyer: Buyer,
    document: PurchaseListDocument,
    changes: Partial<PurchaseListDocument>,
  ): Promise<SePurchaseListResult> => {
    const result = await md(`/documents/${document.id}`, {
      method: 'PATCH',
      body: { ...changes, lastModifiedBy: buyer.email },
    })
    if (!result.ok) return failure('FAILED')
    return { ok: true, error: null, list: toList({ ...document, ...changes }, buyer) }
  }

  return {
    Query: {
      sePurchaseLists: async (_root: unknown, _args: unknown, ctx: ShopperRequestContext): Promise<SePurchaseList[]> => {
        const buyer = await currentBuyer(ctx)
        if (!buyer) return []

        const [owned, shared] = await Promise.all([
          search(`ownerEmail="${buyer.email}"`),
          search(`organizationEmail="${buyer.organizationEmail}" AND visibility="organization"`),
        ])
        const seen = new Set<string>()
        return [...owned, ...shared]
          .filter((document) => !seen.has(document.id) && seen.add(document.id) && canView(document, buyer))
          .map((document) => toList(document, buyer))
      },
    },

    Mutation: {
      sePurchaseListCreate: async (
        _root: unknown,
        args: { name: string; visibility: SePurchaseListVisibility; items?: SePurchaseListItem[] | null },
        ctx: ShopperRequestContext,
      ): Promise<SePurchaseListResult> => {
        const name = cleanName(args.name)
        const items = cleanItems(args.items)
        if (!name || !items || !VISIBILITIES.includes(args.visibility)) return failure('INVALID')
        const buyer = await currentBuyer(ctx)
        if (!buyer) return failure('UNAUTHENTICATED')
        if (await nameTaken(buyer, name)) return failure('CONFLICT')

        const document = {
          name,
          visibility: args.visibility,
          items: JSON.stringify(items),
          ownerEmail: buyer.email,
          organizationEmail: buyer.organizationEmail,
          lastModifiedBy: buyer.email,
        }
        const result = await md('/documents', { method: 'POST', body: document })
        const id = (result.data as { DocumentId?: string; Id?: string } | undefined)?.DocumentId
        if (!result.ok || !id) return failure('FAILED')
        return { ok: true, error: null, list: toList({ id, ...document }, buyer) }
      },

      sePurchaseListAddItems: async (
        _root: unknown,
        args: { documentId: string; items: SePurchaseListItem[] },
        ctx: ShopperRequestContext,
      ): Promise<SePurchaseListResult> => {
        const added = cleanItems(args.items)
        if (!added || added.length === 0) return failure('INVALID')
        const auth = await authorize(ctx, args.documentId, false)
        if ('ok' in auth) return auth

        const items = parseItems(auth.document.items)
        for (const { skuId, quantity } of added) {
          const existing = items.find((item) => item.skuId === skuId)
          if (existing) existing.quantity = Math.min(existing.quantity + quantity, MAX_QUANTITY)
          else items.push({ skuId, quantity })
        }
        if (items.length > MAX_ITEMS) return failure('INVALID')
        return update(auth.buyer, auth.document, { items: JSON.stringify(items) })
      },

      sePurchaseListSetItemQuantity: async (
        _root: unknown,
        args: { documentId: string; skuId: string; quantity: number },
        ctx: ShopperRequestContext,
      ): Promise<SePurchaseListResult> => {
        if (!SKU_ID_PATTERN.test(args.skuId) || !Number.isInteger(args.quantity) || args.quantity < 0 || args.quantity > MAX_QUANTITY) {
          return failure('INVALID')
        }
        const auth = await authorize(ctx, args.documentId, false)
        if ('ok' in auth) return auth

        const items = parseItems(auth.document.items)
        if (!items.some((item) => item.skuId === args.skuId)) return failure('NOT_FOUND')
        const next =
          args.quantity === 0
            ? items.filter((item) => item.skuId !== args.skuId)
            : items.map((item) => (item.skuId === args.skuId ? { ...item, quantity: args.quantity } : item))
        return update(auth.buyer, auth.document, { items: JSON.stringify(next) })
      },

      sePurchaseListRename: async (
        _root: unknown,
        args: { documentId: string; name: string },
        ctx: ShopperRequestContext,
      ): Promise<SePurchaseListResult> => {
        const name = cleanName(args.name)
        if (!name) return failure('INVALID')
        const auth = await authorize(ctx, args.documentId, true)
        if ('ok' in auth) return auth
        if (await nameTaken(auth.buyer, name, auth.document.id)) return failure('CONFLICT')
        return update(auth.buyer, auth.document, { name })
      },

      sePurchaseListSetVisibility: async (
        _root: unknown,
        args: { documentId: string; visibility: SePurchaseListVisibility },
        ctx: ShopperRequestContext,
      ): Promise<SePurchaseListResult> => {
        if (!VISIBILITIES.includes(args.visibility)) return failure('INVALID')
        const auth = await authorize(ctx, args.documentId, true)
        if ('ok' in auth) return auth
        return update(auth.buyer, auth.document, { visibility: args.visibility })
      },

      sePurchaseListDelete: async (
        _root: unknown,
        args: { documentId: string },
        ctx: ShopperRequestContext,
      ): Promise<SePurchaseListResult> => {
        const auth = await authorize(ctx, args.documentId, true)
        if ('ok' in auth) return auth
        const result = await md(`/documents/${auth.document.id}`, { method: 'DELETE' })
        return result.ok ? { ok: true, error: null, list: null } : failure('FAILED')
      },
    },
  }
}
