import { useCallback, useState } from 'react'
import { gql } from '@faststore/core/api'
import { useLazyQuery_unstable } from '@faststore/core/experimental'
import { SE_SUBMIT_ORGANIZATION_REQUEST_MUTATION } from '@vtex-us-se/resolvers/b2b'

const SUBMIT_ORGANIZATION_REQUEST_MUTATION = gql(SE_SUBMIT_ORGANIZATION_REQUEST_MUTATION)

export type RequestToBuyField = 'companyName' | 'contactName' | 'email' | 'phone' | 'message'

export type RequestToBuyValues = Record<RequestToBuyField, string>

/**
 * `invalid`: a required field is empty (caught client-side, nothing sent).
 * `error`: the request was sent and rejected, or never reached the server.
 */
export type RequestToBuyStatus = 'idle' | 'submitting' | 'success' | 'invalid' | 'error'

interface SubmitOrganizationRequestData {
  seSubmitOrganizationRequest?: { success: boolean } | null
}

interface SubmitOrganizationRequestVariables {
  data: {
    companyName: string
    contactName: string
    email: string
    phone: string | null
    message: string | null
  }
}

const EMPTY_VALUES: RequestToBuyValues = { companyName: '', contactName: '', email: '', phone: '', message: '' }

const REQUIRED_FIELDS: RequestToBuyField[] = ['companyName', 'contactName', 'email']

/**
 * State and submit for the "request buyer access" form, sent through the resolvers package's
 * `seSubmitOrganizationRequest` mutation (stored as a Master Data document server-side).
 *
 * The kit's version tracked the result through a `useEffect` on the lazy query's `data`, so a
 * second submission with an identical result never re-triggered it; this reads the outcome
 * straight from the awaited call instead (FastStore's lazy `execute` resolves to the response).
 */
export function useRequestToBuyForm() {
  const [values, setValues] = useState<RequestToBuyValues>(EMPTY_VALUES)
  const [status, setStatus] = useState<RequestToBuyStatus>('idle')

  const [submitRequest] = useLazyQuery_unstable<SubmitOrganizationRequestData, SubmitOrganizationRequestVariables>(
    SUBMIT_ORGANIZATION_REQUEST_MUTATION,
    { data: { ...EMPTY_VALUES, phone: null, message: null } },
  )

  const setField = useCallback((field: RequestToBuyField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setStatus((current) => (current === 'invalid' ? 'idle' : current))
  }, [])

  const requiredFilled = REQUIRED_FIELDS.every((field) => values[field].trim() !== '')

  const submit = useCallback(async () => {
    if (!requiredFilled) {
      setStatus('invalid')
      return
    }

    setStatus('submitting')
    try {
      const result = await submitRequest({
        data: {
          companyName: values.companyName.trim(),
          contactName: values.contactName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || null,
          message: values.message.trim() || null,
        },
      })

      if (result?.seSubmitOrganizationRequest?.success) {
        setValues(EMPTY_VALUES)
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }, [requiredFilled, submitRequest, values])

  return {
    values,
    setField,
    submit,
    status,
    canSubmit: requiredFilled && status !== 'submitting',
  }
}
