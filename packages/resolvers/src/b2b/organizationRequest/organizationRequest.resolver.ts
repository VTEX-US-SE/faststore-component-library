export interface OrganizationRequestConfig {
  storeId: string
  environment?: string
  /**
   * VTEX app key/token with write access to `dataEntity`. Default to the
   * `FS_DISCOVERY_APP_KEY` / `FS_DISCOVERY_APP_TOKEN` env vars (read per request, so a value
   * set after the server boots still applies) -- prefer that over passing literals, so the
   * credentials never end up committed in the resolver file.
   */
  appKey?: string
  appToken?: string
  /** Master Data v2 entity the requests are stored in. */
  dataEntity?: string
  /** Master Data v2 schema name the document is validated against. */
  schema?: string
}

export interface SeOrganizationRequestInput {
  companyName: string
  contactName: string
  email: string
  phone?: string | null
  message?: string | null
}

export interface SeOrganizationRequestResult {
  success: boolean
}

/** Per-field caps. The mutation is public, so nothing unbounded reaches Master Data. */
const MAX_LENGTH = {
  companyName: 200,
  contactName: 200,
  email: 254,
  phone: 50,
  message: 2000,
} as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const LOG_PREFIX = '[@vtex-us-se/resolvers] seSubmitOrganizationRequest:'

type Document = Record<string, string>

/** Trimmed, length-checked document, or the reason it was rejected. */
function toDocument(input: SeOrganizationRequestInput): Document | string {
  const document: Document = {}

  for (const field of ['companyName', 'contactName', 'email', 'phone', 'message'] as const) {
    const value = (input[field] ?? '').trim()
    if (!value) continue
    if (value.length > MAX_LENGTH[field]) return `${field} is longer than ${MAX_LENGTH[field]} characters`
    document[field] = value
  }

  for (const field of ['companyName', 'contactName', 'email'] as const) {
    if (!document[field]) return `${field} is required`
  }

  if (!EMAIL_PATTERN.test(document.email as string)) return 'email is not a valid address'

  return document
}

/**
 * Factory (config instead of importing the consuming project's discovery.config.js -- see
 * assemblySet.resolver.ts) returning the single `Mutation.seSubmitOrganizationRequest` field
 * resolver (`resolverShape: "field"` in organizationRequest.meta.json).
 *
 * Ported from faststore-b2b-buyer-portal-kit's `submitOrganizationRequest`, which wrote
 * whatever the browser sent straight to Master Data with an app token. This keeps that
 * behavior but validates first, and never echoes Master Data's error text to the client.
 */
export function createOrganizationRequestResolver(config: OrganizationRequestConfig) {
  const environment = config.environment ?? 'vtexcommercestable'
  const dataEntity = config.dataEntity ?? 'OrganizationRequest'
  const schema = config.schema ?? 'v1'
  const url =
    `https://${config.storeId}.${environment}.com.br/api/dataentities/${encodeURIComponent(dataEntity)}` +
    `/documents?_schema=${encodeURIComponent(schema)}`

  return async (
    _root: unknown,
    { data }: { data: SeOrganizationRequestInput },
  ): Promise<SeOrganizationRequestResult> => {
    const appKey = config.appKey ?? process.env.FS_DISCOVERY_APP_KEY
    const appToken = config.appToken ?? process.env.FS_DISCOVERY_APP_TOKEN

    if (!appKey || !appToken) {
      console.error(
        `${LOG_PREFIX} no VTEX app key/token configured. Set FS_DISCOVERY_APP_KEY and FS_DISCOVERY_APP_TOKEN ` +
          '(WebOps Settings in production, vtex.env locally -- never commit real values). Every request is ' +
          'being rejected until then.',
      )
      return { success: false }
    }

    const document = toDocument(data)
    if (typeof document === 'string') {
      console.warn(`${LOG_PREFIX} rejected input: ${document}`)
      return { success: false }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          'X-VTEX-API-AppKey': appKey,
          'X-VTEX-API-AppToken': appToken,
        },
        body: JSON.stringify(document),
      })

      if (!response.ok) {
        console.error(`${LOG_PREFIX} Master Data returned ${response.status}:`, await response.text().catch(() => ''))
        return { success: false }
      }

      return { success: true }
    } catch (error) {
      console.error(`${LOG_PREFIX} request to Master Data failed:`, error)
      return { success: false }
    }
  }
}
