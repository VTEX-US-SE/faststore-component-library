import { useEffect, useState } from 'react'
import { gql } from '@faststore/core/api'
import { useLazyQuery_unstable } from '@faststore/core/experimental'
import { SUBMIT_ORGANIZATION_REQUEST_MUTATION } from '@vtex-us-se/resolvers/b2b'

const ORGANIZATION_REQUEST_MUTATION = gql(SUBMIT_ORGANIZATION_REQUEST_MUTATION)

export interface RequestToBuyPayload {
  companyName: string
  contactName: string
  email: string
  phone?: string
  message?: string
}

interface SubmitOrganizationRequestMutationData {
  submitOrganizationRequest?: { success: boolean } | null
}

interface SubmitOrganizationRequestMutationVariables {
  companyName: string
  contactName: string
  email: string
  phone: string | null
  message: string | null
}

/**
 * Same field state, validation, submit orchestration and success/error/loading state machine as
 * the original RequestToBuy.tsx (kit-sourced), split out as a logic-only hook so `packages/ui`
 * only owns markup/CSS.
 */
export function useRequestToBuyForm() {
  const [companyName, setCompanyNameState] = useState('')
  const [contactName, setContactNameState] = useState('')
  const [email, setEmailState] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)
  const [validationError, setValidationError] = useState(false)
  const [loading, setLoading] = useState(false)

  const [submitRequest, { data: mutationData }] = useLazyQuery_unstable<
    SubmitOrganizationRequestMutationData,
    SubmitOrganizationRequestMutationVariables
  >(ORGANIZATION_REQUEST_MUTATION, {} as SubmitOrganizationRequestMutationVariables)

  useEffect(() => {
    if (!mutationData) return

    if (mutationData.submitOrganizationRequest?.success) {
      setSuccess(true)
      setCompanyNameState('')
      setContactNameState('')
      setEmailState('')
      setPhone('')
      setMessage('')
      setLoading(false)
    } else {
      setError(true)
      setLoading(false)
    }
  }, [mutationData])

  const clearValidationError = () => setValidationError(false)

  const setCompanyName = (value: string) => {
    setCompanyNameState(value)
    clearValidationError()
  }
  const setContactName = (value: string) => {
    setContactNameState(value)
    clearValidationError()
  }
  const setEmail = (value: string) => {
    setEmailState(value)
    clearValidationError()
  }

  const requiredFilled = companyName.trim() !== '' && contactName.trim() !== '' && email.trim() !== ''
  const canSubmit = requiredFilled && !loading

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault()
    setError(false)
    setValidationError(false)

    if (!requiredFilled) {
      setValidationError(true)
      return
    }

    const payload: RequestToBuyPayload = {
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      ...(phone.trim() && { phone: phone.trim() }),
      ...(message.trim() && { message: message.trim() }),
    }

    setLoading(true)
    try {
      await submitRequest({
        companyName: payload.companyName,
        contactName: payload.contactName,
        email: payload.email,
        phone: payload.phone || null,
        message: payload.message || null,
      })
    } catch (err) {
      console.error('Error submitting organization request:', err)
      setError(true)
      setLoading(false)
    }
  }

  return {
    companyName,
    setCompanyName,
    contactName,
    setContactName,
    email,
    setEmail,
    phone,
    setPhone,
    message,
    setMessage,
    success,
    error,
    validationError,
    loading,
    canSubmit,
    handleSubmit,
  }
}
