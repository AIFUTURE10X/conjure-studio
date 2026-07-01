import { getSessionUser } from '@/lib/auth'

/**
 * Server-derived identity for the data routes.
 *
 * Signed-in requests always act as the session user — the client-supplied
 * userId is ignored, so one account can never read or write another's rows.
 * Anonymous requests keep the legacy localStorage id so the app works
 * unchanged before sign-in (and while SAAS_ENFORCEMENT is off).
 */
export async function resolveUserId(request: Request, clientUserId: string): Promise<string> {
  // Session lookup runs before each data route's try/catch, so a Better Auth
  // failure (misconfigured secret, missing auth tables, DB hiccup) must never
  // throw here — that would turn every data route into a 500 instead of just
  // serving the request anonymously. Fall back to the (validated) client id.
  try {
    const user = await getSessionUser(request.headers)
    return user ? user.id : clientUserId
  } catch (error) {
    console.warn('[identity] session lookup failed; treating request as anonymous:', error)
    return clientUserId
  }
}
