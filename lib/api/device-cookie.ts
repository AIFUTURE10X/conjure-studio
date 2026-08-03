import { userIdSchema } from '@/lib/validation/common'

/**
 * Durable anonymous-identity cookie, set httpOnly by POST /api/device.
 *
 * The localStorage id can vanish (storage eviction, a fresh browser context,
 * or a domain move — localStorage is per-origin), and every save made while
 * it is missing used to mint a brand-new id and orphan its own row. The
 * cookie rides along on every same-origin request, so server-side identity
 * resolution can prefer it and keep writes durable even when the client-side
 * id is transient.
 */
export const DEVICE_COOKIE = 'genie-device-id'

/** Read and validate the durable device id off a request's Cookie header. */
export function readDeviceCookieId(request: Request): string | null {
  const header = request.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    if (part.slice(0, eq).trim() !== DEVICE_COOKIE) continue
    let value = part.slice(eq + 1).trim()
    try {
      value = decodeURIComponent(value)
    } catch {
      // Not URI-encoded — use the raw value.
    }
    const parsed = userIdSchema.safeParse(value)
    return parsed.success ? parsed.data : null
  }
  return null
}
