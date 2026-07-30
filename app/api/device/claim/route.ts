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

    // favorites — UNIQUE(user_id, image_url): drop legacy rows the target
    // already has, then collapse duplicates within the legacy set (keep the
    // newest; tie-break on id) so re-keying can't violate the constraint.
    await client.query(
      `DELETE FROM favorites f
       WHERE f.user_id = ANY($1::text[])
         AND EXISTS (SELECT 1 FROM favorites g WHERE g.user_id = $2 AND g.image_url = f.image_url)`,
      [legacyUserIds, targetUserId],
    )
    await client.query(
      `DELETE FROM favorites f
       WHERE f.user_id = ANY($1::text[])
         AND EXISTS (
           SELECT 1 FROM favorites keep
           WHERE keep.user_id = ANY($1::text[]) AND keep.id <> f.id
             AND keep.image_url = f.image_url
             AND (keep.created_at > f.created_at OR (keep.created_at = f.created_at AND keep.id > f.id))
         )`,
      [legacyUserIds],
    )

    const favorites = await client.query('UPDATE favorites SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, targetUserId])
    const history = await client.query('UPDATE generation_history SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, targetUserId])
    const logos = await client.query('UPDATE logo_history SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, targetUserId])
    const videos = await client.query('UPDATE video_history SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, targetUserId])

    // user_presets — PRIMARY KEY (user_id, id): drop legacy copies of preset
    // ids the target already has, then collapse duplicate ids within the
    // legacy set (keep the newest).
    await client.query(
      `DELETE FROM user_presets f
       WHERE f.user_id = ANY($1::text[])
         AND (
           EXISTS (SELECT 1 FROM user_presets g WHERE g.user_id = $2 AND g.id = f.id)
           OR EXISTS (
             SELECT 1 FROM user_presets keep
             WHERE keep.user_id = ANY($1::text[]) AND keep.user_id <> f.user_id
               AND keep.id = f.id
               AND (keep.created_at > f.created_at OR (keep.created_at = f.created_at AND keep.user_id > f.user_id))
           )
         )`,
      [legacyUserIds, targetUserId],
    )
    const presets = await client.query('UPDATE user_presets SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, targetUserId])

    // saved_prompts — UNIQUE(user_id, kind, md5(prompt)): same two-step
    // dedupe before re-keying (keep the most recently used).
    await client.query(
      `DELETE FROM saved_prompts f
       WHERE f.user_id = ANY($1::text[])
         AND EXISTS (
           SELECT 1 FROM saved_prompts g
           WHERE g.user_id = $2 AND g.kind = f.kind AND md5(g.prompt) = md5(f.prompt)
         )`,
      [legacyUserIds, targetUserId],
    )
    await client.query(
      `DELETE FROM saved_prompts f
       WHERE f.user_id = ANY($1::text[])
         AND EXISTS (
           SELECT 1 FROM saved_prompts keep
           WHERE keep.user_id = ANY($1::text[]) AND keep.id <> f.id
             AND keep.kind = f.kind AND md5(keep.prompt) = md5(f.prompt)
             AND (keep.last_used_at > f.last_used_at OR (keep.last_used_at = f.last_used_at AND keep.id > f.id))
         )`,
      [legacyUserIds],
    )
    const prompts = await client.query('UPDATE saved_prompts SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, targetUserId])

    // collections — UNIQUE(user_id, name): rename incoming collections whose
    // name is already taken (by the target or another legacy row) instead of
    // silently merging their contents; the serial id keeps the new name
    // unique. collection_items rows carry their own user_id and are re-keyed
    // explicitly below.
    await client.query(
      `UPDATE collections c SET name = c.name || ' #' || c.id
       WHERE c.user_id = ANY($1::text[])
         AND EXISTS (
           SELECT 1 FROM collections o
           WHERE o.id <> c.id AND o.name = c.name
             AND (o.user_id = $2 OR o.user_id = ANY($1::text[]))
         )`,
      [legacyUserIds, targetUserId],
    )
    const collections = await client.query('UPDATE collections SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, targetUserId])
    await client.query('UPDATE collection_items SET user_id = $2 WHERE user_id = ANY($1::text[])', [legacyUserIds, targetUserId])

    await client.query('COMMIT')

    const moved =
      (favorites.rowCount ?? 0) +
      (history.rowCount ?? 0) +
      (logos.rowCount ?? 0) +
      (videos.rowCount ?? 0) +
      (presets.rowCount ?? 0) +
      (prompts.rowCount ?? 0) +
      (collections.rowCount ?? 0)
    return NextResponse.json({
      success: true,
      moved,
      details: {
        favorites: favorites.rowCount ?? 0,
        history: history.rowCount ?? 0,
        logos: logos.rowCount ?? 0,
        videos: videos.rowCount ?? 0,
        presets: presets.rowCount ?? 0,
        prompts: prompts.rowCount ?? 0,
        collections: collections.rowCount ?? 0,
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
