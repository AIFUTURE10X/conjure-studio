import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson } from '@/lib/api/http'
import { userIdSchema } from '@/lib/validation/common'
import { getSessionUser } from '@/lib/auth'
import { pgPool } from '@/lib/db/pool'

/**
 * POST /api/account/claim { legacyUserId }
 *
 * Re-parents an anonymous device's rows (favorites, generation_history,
 * logo_history) onto the signed-in account. Each legacy id can be claimed
 * exactly once (account_claims PK); re-claiming your own id is idempotent.
 */

const bodySchema = z.object({ legacyUserId: userIdSchema })

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request.headers)
  if (!user) return apiError(401, 'unauthorized', 'Sign in to claim this device’s data')

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response
  const { legacyUserId } = parsed.data

  if (legacyUserId === user.id) {
    return NextResponse.json({ success: true, alreadyClaimed: true, moved: 0 })
  }

  const client = await pgPool.connect()
  try {
    await client.query('BEGIN')

    const existing = await client.query(
      'SELECT auth_user_id FROM account_claims WHERE legacy_user_id = $1 FOR UPDATE',
      [legacyUserId],
    )
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK')
      if (existing.rows[0].auth_user_id === user.id) {
        return NextResponse.json({ success: true, alreadyClaimed: true, moved: 0 })
      }
      return apiError(409, 'already_claimed', 'This device’s data was already claimed by another account')
    }

    await client.query(
      'INSERT INTO account_claims (legacy_user_id, auth_user_id) VALUES ($1, $2)',
      [legacyUserId, user.id],
    )

    // favorites has UNIQUE(user_id, image_url): drop legacy rows the account
    // already has before re-parenting the rest.
    await client.query(
      `DELETE FROM favorites f
       WHERE f.user_id = $1
         AND EXISTS (SELECT 1 FROM favorites g WHERE g.user_id = $2 AND g.image_url = f.image_url)`,
      [legacyUserId, user.id],
    )

    const favorites = await client.query('UPDATE favorites SET user_id = $2 WHERE user_id = $1', [legacyUserId, user.id])
    const history = await client.query('UPDATE generation_history SET user_id = $2 WHERE user_id = $1', [legacyUserId, user.id])
    const logos = await client.query('UPDATE logo_history SET user_id = $2 WHERE user_id = $1', [legacyUserId, user.id])

    await client.query('COMMIT')

    const moved = (favorites.rowCount ?? 0) + (history.rowCount ?? 0) + (logos.rowCount ?? 0)
    return NextResponse.json({
      success: true,
      alreadyClaimed: false,
      moved,
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
