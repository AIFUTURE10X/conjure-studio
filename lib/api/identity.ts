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
  const user = await getSessionUser(request.headers)
  return user ? user.id : clientUserId
}
