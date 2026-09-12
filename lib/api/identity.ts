import { getSessionUser } from '@/lib/auth'
import { readDeviceCookieId } from '@/lib/api/device-cookie'

/**
 * Server-derived identity for the data routes.
 *
 * Signed-in requests always act as the session user — the client-supplied
 * userId is ignored, so one account can never read or write another's rows.
 * Anonymous requests prefer the durable genie-device-id cookie over the
 * client-supplied localStorage id: the cookie survives storage eviction and
 * fresh browser contexts, so reads and writes stay keyed to one identity
 * instead of orphaning rows under per-session (or per-request) minted ids.
 * The raw client id remains the last resort so the app still works before
 * the first /api/device handshake or with cookies blocked.
 */
// One session lookup per request: the usage wrapper (lib/costs/route.ts) and
// the route handler both resolve the caller from the same Request object, so
// the second call must not cost a second auth-table query.
const sessionLookups = new WeakMap<Request, Promise<{ id: string } | null>>()

function lookupSessionUser(request: Request): Promise<{ id: string } | null> {
  let pending = sessionLookups.get(request)
  if (!pending) {
    pending = getSessionUser(request.headers)
      .then((user) => (user ? { id: user.id } : null))
      .catch((error) => {
        // A Better Auth failure (misconfigured secret, missing auth tables, DB
        // hiccup) must never throw here — that would turn every data route
        // into a 500 instead of serving the request anonymously.
        console.warn('[identity] session lookup failed; treating request as anonymous:', error)
        return null
      })
    sessionLookups.set(request, pending)
  }
  return pending
}

export async function resolveUserId(request: Request, clientUserId: string): Promise<string> {
  const user = await lookupSessionUser(request)
  if (user) return user.id
  const cookieId = readDeviceCookieId(request)
  return cookieId ?? clientUserId
}
