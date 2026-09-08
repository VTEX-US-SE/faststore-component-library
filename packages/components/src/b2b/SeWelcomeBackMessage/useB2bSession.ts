import { useSession_unstable } from '@faststore/core/experimental'

export type B2bSessionInfo = {
  userName?: string
}

/**
 * Thin wrapper around FastStore's own (experimental) session hook, extracting just the B2B
 * slice. Returns `undefined` when there's no B2B session (e.g. a B2C-only shopper, or the
 * Buyer Portal plugin isn't enabled on the consuming project) — the caller decides what to
 * render in that case.
 */
export function useB2bSession(): B2bSessionInfo | undefined {
  const session = useSession_unstable()
  return session?.b2b ?? undefined
}
