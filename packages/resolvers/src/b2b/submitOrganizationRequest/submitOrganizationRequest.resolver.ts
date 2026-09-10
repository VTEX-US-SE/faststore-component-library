export interface VtexApiConfig {
  storeId: string
  environment?: string
}

export interface SubmitOrganizationRequestBody {
  companyName: string
  contactName: string
  email: string
  phone?: string
  message?: string
}

export interface SubmitOrganizationRequestResult {
  success: boolean
}

/**
 * Factory instead of a plain resolver: the original (kit-sourced) implementation reads
 * storeId/environment via a relative import to the consuming project's own discovery.config.js,
 * which can't resolve once this code is published as a standalone package.
 */
export function createSubmitOrganizationRequestResolver(config: VtexApiConfig) {
  const environment = config.environment ?? 'vtexcommercestable'
  const url = `https://${config.storeId}.${environment}.com.br/api/dataentities/OrganizationRequest/documents?_schema=v1`

  return async function submitOrganizationRequest(
    _root: unknown,
    body: SubmitOrganizationRequestBody,
  ): Promise<SubmitOrganizationRequestResult> {
    const appKey = process.env.FS_DISCOVERY_APP_KEY
    const appToken = process.env.FS_DISCOVERY_APP_TOKEN

    if (!appKey || !appToken) {
      console.error(
        'FS_DISCOVERY_APP_KEY and FS_DISCOVERY_APP_TOKEN must be set for submitOrganizationRequest. ' +
          'Set them in WebOps Settings (production) or vtex.env (local — never commit real values).',
      )
      return { success: false }
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-VTEX-API-AppKey': appKey,
          'X-VTEX-API-AppToken': appToken,
        },
        body: JSON.stringify({
          companyName: body.companyName,
          contactName: body.contactName,
          email: body.email,
          ...(body.phone ? { phone: body.phone } : {}),
          ...(body.message ? { message: body.message } : {}),
        }),
      })

      if (!res.ok) {
        console.error('OrganizationRequest API error', res.status, await res.text())
        return { success: false }
      }

      return { success: true }
    } catch (err) {
      console.error('OrganizationRequest fetch error', err)
      return { success: false }
    }
  }
}
