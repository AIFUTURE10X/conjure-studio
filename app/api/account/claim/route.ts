import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson } from '@/lib/api/http'
import { userIdSchema } from '@/lib/validation/common'
import { getSessionUser } from '@/lib/auth'
import { pgPool } from '@/lib/db/pool'

/**
 * POST /api/account/claim { legacyUserId } or { legacyUserIds }
 *
 * Re-parents anonymous device rows (favorites, generation_history,
 * logo_history) onto the signed-in account. Each legacy id can be claimed
 * exactly once (account_claims PK); re-claiming your own ids is idempotent.
 */

const bodySchema = z.object({
  legacyUserId: userIdSchema.optional(),
  legacyUserIds: z.array(userIdSchema).min(1).max(20).optional(),
}).refine((body) => Boolean(body.legacyUserId || body.legacyUserIds?.length), {
  message: 'legacyUserId or legacyUserIds required',
})

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request.headers)
  if (!user) return apiError(401, 'unauthorized', 'Sign in to claim this device’s data')

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response
  const legacyUserIds = Array.from(new Set([
    ...(parsed.data.legacyUserId ? [parsed.data.legacyUserId] : []),
    ...(parsed.data.legacyUserIds || []),
  ])).filter((legacyUserId) => legacyUserId !== user.id)

  if (legacyUserIds.length === 0) {
    return NextResponse.json({ success: true, alreadyClaimed: true, moved: 0 })
  }

  const client = await pgPool.connect()
  try {
    await client.query('BEGIN')

    const existing = await client.query(
      'SELECT legacy_user_id, auth_user_id FROM account_claims WHERE legacy_user_id = ANY($1::text[]) FOR UPDATE',
      [legacyUserIds],
    )
    const conflicts = existing.rows.filter((row) => row.auth_user_id !== user.id)
    if (conflicts.length > 0) {
      await client.query('ROLLBACK')
      return apiError(409, 'already_claimed', 'Some of this device’s data was already claimed by another account')
    }

    const alreadyClaimedIds = new Set(existing.rows.map((row) => row.legacy_user_id))
    const claimableIds = legacyUserIds.filter((legacyUserId) => !alreadyClaimedIds.has(legacyUserId))

    if (claimableIds.length > 0) {
      await client.query(
        'INSERT INTO account_claims (legacy_user_id, auth_user_id) SELECT unnest($1::text[]), $2',
        [claimableIds, user.id],
      )
    }

    // favorites has UNIQUE(user_id, image_url): drop legacy rows the account
    // already has before re-parenting the rest.
    await client.query(
      `DELETE FROM favorites f
       WHERE f.user_id = ANY($1::text[])
         AND EXISTS (SELECT 1 FROM favorites g WHERE g.user_id = $2 AND g.image_url = f.image_url)`,
      [legacyUserIds, user.id],
    )

    const favorites = await client.query('UPDATE favorites SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, user.id])
    const history = await client.query('UPDATE generation_history SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, user.id])
    const logos = await client.query('UPDATE logo_history SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, user.id])

    await client.query('COMMIT')

    const moved = (favorites.rowCount ?? 0) + (history.rowCount ?? 0) + (logos.rowCount ?? 0)
    return NextResponse.json({
      success: true,
      alreadyClaimed: moved === 0 && claimableIds.length === 0,
      moved,
      claimedIds: claimableIds.length,
      details: {
        favorites: favorites.rowCount ?? 0,
        history: history.rowCount ?? 0,
        logos: logos.rowCount ?? 0,
      },
    })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[account/claim] failed:', error)
    return apiError(500, 'internal_error', 'Failed to claim device data')
  } finally {
    client.release()
  }
}
