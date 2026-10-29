import { useCallback, useEffect, useRef, useState } from 'react'
import { gql } from '@faststore/core/api'
import { sessionStore_unstable, useLazyQuery_unstable, useSession_unstable } from '@faststore/core/experimental'
import { SE_SHOPPER_ADDRESSES_QUERY } from '@vtex-us-se/resolvers/b2b'

const SHOPPER_ADDRESSES_QUERY = gql(SE_SHOPPER_ADDRESSES_QUERY)

const CACHE_KEY = 'seShopperAddressesCache'
const CACHE_MAX_AGE = 30 * 60 * 1000

export type ShopperAddress = {
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

export type ShopperAddresses = { defaultAddressId: string | null; addresses: ShopperAddress[] }

type ShopperAddressesResponse = { seShopperAddresses?: ShopperAddresses | null }

type Session = Record<string, unknown> & {
  postalCode?: string | null
  isValidating?: boolean
  b2b?: { userEmail?: string; unitId?: string; customerId?: string } | null
}

/** "Neighborhood, City, ST 12345" — whichever parts the address has. */
export function formatShopperAddress(address: ShopperAddress): string {
  const place = [address.neighborhood, address.city].filter(Boolean).join(', ')
  const region = [address.state, address.postalCode].filter(Boolean).join(' ')
  return [place, region].filter(Boolean).join(', ')
}

type CacheEntry = { data: ShopperAddresses; timestamp: number; userEmail: string }

function readCache(userEmail: string): ShopperAddresses | undefined {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return undefined
    const entry = JSON.parse(raw) as CacheEntry
    if (entry.userEmail !== userEmail || Date.now() - entry.timestamp > CACHE_MAX_AGE) return undefined
    return entry.data
  } catch {
    return undefined
  }
}

function writeCache(userEmail: string, data: ShopperAddresses): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now(), userEmail } as CacheEntry))
  } catch {
    // Storage full or disabled: the selector still works, it just refetches next time.
  }
}

/**
 * Points FastStore's session (and so regionalization: prices, availability, shipping) at
 * `address`. Mirrors the kit's `submitAddress`, minus the session's transient `isValidating`.
 */
function applyAddressToSession(session: Session, address: ShopperAddress): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- dropped on purpose, see above
  const { isValidating, ...current } = session
  sessionStore_unstable.set({
    ...current,
    country: address.country ?? current.country,
    addressType: address.addressType ?? current.addressType,
    city: address.city ?? current.city,
    postalCode: address.postalCode ?? current.postalCode,
  } as Parameters<typeof sessionStore_unstable.set>[0])
}

/**
 * The B2B shopper's saved addresses and which one the session ships to, plus `select` to switch.
 *
 * Replaces the kit's `RegionalizationB2B` + `AddressSelector` pair: on first load, a session
 * with no postal code yet is pointed at the shopper's default shipping address (what the kit's
 * navbar used to do on every page).
 */
export function useAddressSelector() {
  const session = useSession_unstable() as Session
  const userEmail = session?.b2b?.userEmail
  const [data, setData] = useState<ShopperAddresses | undefined>()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [fetchAddresses] = useLazyQuery_unstable<ShopperAddressesResponse, Record<string, never>>(SHOPPER_ADDRESSES_QUERY, {})
  // FastStore's real lazy `execute` (and the session object) change identity every render; read
  // them through refs instead of listing them as effect dependencies (see useRecentOrdersSpendOverview.ts).
  const fetchRef = useRef(fetchAddresses)
  fetchRef.current = fetchAddresses
  const sessionRef = useRef(session)
  sessionRef.current = session

  useEffect(() => {
    if (!userEmail) return
    let cancelled = false

    const applyData = (next: ShopperAddresses) => {
      setData(next)
      const current = sessionRef.current
      if (!current.postalCode && next.defaultAddressId) {
        const fallback = next.addresses.find((address) => address.id === next.defaultAddressId)
        if (fallback) applyAddressToSession(current, fallback)
      }
    }

    const cached = readCache(userEmail)
    if (cached) {
      applyData(cached)
      return
    }

    fetchRef
      .current({})
      .then((result: ShopperAddressesResponse | null | undefined) => {
        if (cancelled || !result?.seShopperAddresses) return
        writeCache(userEmail, result.seShopperAddresses)
        applyData(result.seShopperAddresses)
      })
      .catch(() => {
        // Nothing to show; the component renders only its "add address" link.
      })

    return () => {
      cancelled = true
    }
  }, [userEmail])

  const addresses = data?.addresses ?? []
  const current =
    addresses.find((address) => address.id === selectedId) ??
    addresses.find((address) => address.postalCode && address.postalCode === session?.postalCode)

  const select = useCallback(
    (addressId: string) => {
      const address = addresses.find((candidate) => candidate.id === addressId)
      if (!address || address.id === current?.id) return
      setSelectedId(address.id)
      applyAddressToSession(sessionRef.current, address)
    },
    [addresses, current?.id],
  )

  return {
    isB2b: Boolean(userEmail),
    unitId: session?.b2b?.unitId,
    customerId: session?.b2b?.customerId,
    loaded: data !== undefined,
    addresses,
    current,
    select,
  }
}
