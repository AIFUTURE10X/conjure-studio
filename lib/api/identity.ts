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
export async function resolveUserId(request: Request, clientUserId: string): Promise<string> {
  // Session lookup runs before each data route's try/catch, so a Better Auth
  // failure (misconfigured secret, missing auth tables, DB hiccup) must never
  // throw here — that would turn every data route into a 500 instead of just
  // serving the request anonymously. Fall back to the anonymous identity.
  try {
    const user = await getSessionUser(request.headers)
    if (user) return user.id
  } catch (error) {
    console.warn('[identity] session lookup failed; treating request as anonymous:', error)
  }
  const cookieId = readDeviceCookieId(request)
  return cookieId ?? clientUserId
}
