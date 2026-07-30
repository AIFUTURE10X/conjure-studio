import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEVICE_COOKIE } from '@/lib/api/device-cookie'
import { parseJson } from '@/lib/api/http'
import { userIdSchema } from '@/lib/validation/common'

// Browsers cap script-set cookie lifetimes far lower than server-set ones;
// 400 days is Chrome's hard ceiling. The handshake refreshes the cookie on
// every visit, so it only expires after 400 days of not opening the app.
const DEVICE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400

const bodySchema = z.object({ userId: userIdSchema })

/**
 * Device-identity handshake.
 *
 * Every anonymous row in Neon (favorites, generation/logo/video history,
 * presets, prompts, collections) is keyed by a random id that used to live
 * ONLY in localStorage — one storage eviction and all of it was orphaned
 * under an id no browser remembered. This endpoint mirrors the id into a
 * long-lived httpOnly cookie and treats the cookie as authoritative: when
 * localStorage is wiped, the client calls here with its freshly minted id,
 * gets the durable id back, and adopts it (see restoreDurableIdentity in
 * lib/user-id.ts).
 */
export async function POST(request: NextRequest) {
  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response

  const cookieId = userIdSchema.safeParse(request.cookies.get(DEVICE_COOKIE)?.value)
  const deviceId = cookieId.success ? cookieId.data : parsed.data.userId

  const response = NextResponse.json({ deviceId, restored: deviceId !== parsed.data.userId })
  response.cookies.set(DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
  })
  return response
}
