import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson } from '@/lib/api/http'
import { pgPool } from '@/lib/db/pool'
import { isSaasEnforcementOn } from '@/lib/api/guard'
import { userIdSchema } from '@/lib/validation/common'

const bodySchema = z.object({
  targetUserId: userIdSchema,
  legacyUserIds: z.array(userIdSchema).min(1).max(20),
})

export async function POST(request: NextRequest) {
  if (isSaasEnforcementOn()) {
    return apiError(403, 'saas_mode_enabled', 'Anonymous device claiming is disabled when accounts are enabled')
  }

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response

  const { targetUserId } = parsed.data
  const legacyUserIds = Array.from(new Set(parsed.data.legacyUserIds))
    .filter((legacyUserId) => legacyUserId !== targetUserId)

  if (legacyUserIds.length === 0) {
    return NextResponse.json({ success: true, moved: 0 })
  }

  const client = await pgPool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      `DELETE FROM favorites f
       WHERE f.user_id = ANY($1::text[])
         AND EXISTS (SELECT 1 FROM favorites g WHERE g.user_id = $2 AND g.image_url = f.image_url)`,
      [legacyUserIds, targetUserId],
    )

    const favorites = await client.query('UPDATE favorites SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, targetUserId])
    const history = await client.query('UPDATE generation_history SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, targetUserId])
    const logos = await client.query('UPDATE logo_history SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, targetUserId])

    await client.query('COMMIT')

    const moved = (favorites.rowCount ?? 0) + (history.rowCount ?? 0) + (logos.rowCount ?? 0)
    return NextResponse.json({
      success: true,
      moved,
      details: {
        favorites: favorites.rowCount ?? 0,
        history: history.rowCount ?? 0,
        logos: logos.rowCount ?? 0,
      },
    })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[device/claim] failed:', error)
    return apiError(500, 'internal_error', 'Failed to restore this device’s data')
  } finally {
    client.release()
  }
}
