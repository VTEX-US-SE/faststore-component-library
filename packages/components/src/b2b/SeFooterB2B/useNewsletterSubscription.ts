import { useCallback, useState } from 'react'
import { useNewsletter_unstable } from '@faststore/core/experimental'

export type NewsletterSubscription = {
  email: string
  setEmail: (email: string) => void
  subscribe: () => Promise<void>
  subscribed: boolean
  failed: boolean
  loading: boolean
}

/**
 * Email state + submit for FastStore's native `subscribeToNewsletter` mutation (no custom
 * GraphQL, so this stays a plain npm import). The kit's original wrapped a non-awaited call in
 * try/catch and ignored the hook's own `error`, so a failed subscription never showed its error
 * message — both failure paths are surfaced here.
 */
export function useNewsletterSubscription(): NewsletterSubscription {
  const { subscribeUser, data, error, loading } = useNewsletter_unstable()
  const [email, setEmail] = useState('')
  const [rejected, setRejected] = useState(false)

  const subscribe = useCallback(async () => {
    setRejected(false)
    try {
      await subscribeUser({ data: { email, name: '' } })
    } catch {
      setRejected(true)
    }
  }, [subscribeUser, email])

  return {
    email,
    setEmail,
    subscribe,
    subscribed: Boolean(data),
    failed: rejected || Boolean(error),
    loading,
  }
}
