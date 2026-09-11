import type { NextRequest } from 'next/server'
import { readDeviceCookieId } from '@/lib/api/device-cookie'
import { withUsageContext } from './record'

export { setUsageContextUser } from './record'

/**
 * Wrap a route handler so every provider call inside it is attributed to the
 * route (feature) and the caller (issue #50). Attribution here is the durable
 * device cookie only — no session lookup, so the wrapper adds no database
 * round trip and no auth dependency to routes that never had one. Routes that
 * resolve the session or a client-supplied id call setUsageContextUser()
 * once after parsing, which upgrades the rows written afterwards.
 */
export function withUsage<Req extends Request = NextRequest>(
  feature: string,
  handler: (request: Req) => Promise<Response>,
): (request: Req) => Promise<Response> {
  return async (request: Req) => {
    let userId: string | undefined
    try {
      userId = readDeviceCookieId(request) ?? undefined
    } catch {
      userId = undefined
    }
    return withUsageContext(feature, userId, () => handler(request))
  }
}
