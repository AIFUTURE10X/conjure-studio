import type { NextRequest } from 'next/server'
import { resolveUserId } from '@/lib/api/identity'
import { withUsageContext } from './record'

export { setUsageContextUser } from './record'

/**
 * Wrap a route handler so every provider call inside it is attributed to the
 * route (feature) and the caller (issue #50). The user comes from the session
 * or device cookie; routes that resolve a better id from their body call
 * setUsageContextUser() once after parsing it.
 */
export function withUsage<Req extends Request = NextRequest>(
  feature: string,
  handler: (request: Req) => Promise<Response>,
): (request: Req) => Promise<Response> {
  return async (request: Req) => {
    let userId: string | undefined
    try {
      userId = (await resolveUserId(request, '')) || undefined
    } catch {
      userId = undefined
    }
    return withUsageContext(feature, userId, () => handler(request))
  }
}
