import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { apiError, parseJson, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { ensureCreationMetadataSchema } from '@/lib/db/creation-metadata-schema'
import { userIdSchema } from '@/lib/validation/common'
import {
  buildPromptSearchPattern,
  pageFetchLimit,
  resolveVideoDeleteOutcome,
  splitPage,
  videoHistoryDeleteParamsSchema,
  videoHistoryListParamsSchema,
} from '@/lib/video/history-query'

export const runtime = "nodejs"

/**
 * GET /api/video-history?userId=xxx — video jobs, newest first.
 *
 * Optional `limit` / `offset` / `search` / `favoritesOnly` page and filter the
 * list. Filtering is deliberately server-side: narrowing an already-fetched page
 * on the client would hide favorites that sit beyond it.
 */

const getQuerySchema = videoHistoryListParamsSchema.extend({ userId: userIdSchema })
const deleteQuerySchema = videoHistoryDeleteParamsSchema.extend({ userId: userIdSchema })
const patchBodySchema = z.object({
  userId: userIdSchema,
  jobId: z.number().int().positive(),
  isFavorited: z.boolean(),
})

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

export async function GET(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), getQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)
  const { limit, offset, search, category, tag, favoritesOnly } = parsed.data
  const searchPattern = search ? buildPromptSearchPattern(search) : null

  try {
    const sql = getSQL()
    await ensureCreationMetadataSchema(sql)
    // Both filters are expressed as no-op comparisons rather than composed SQL
    // fragments, so this stays a single tagged template the driver parameterizes.
    // One extra row is fetched to derive `hasMore` without a second COUNT.
    const rows = await sql`
      SELECT video.id, video.status, video.prompt, video.model, video.video_url,
             video.error, video.start_image_url, video.created_at,
             video.duration_seconds, video.resolution, video.aspect_ratio,
             video.has_audio, video.is_favorited,
             metadata.title, metadata.category, metadata.tags
      FROM public.video_history AS video
      LEFT JOIN public.creation_media_metadata AS metadata
        ON metadata.user_id = video.user_id
       AND metadata.media_type = 'video'
       AND metadata.media_url = video.video_url
      WHERE video.user_id = ${userId}
        AND (${favoritesOnly}::boolean = false OR video.is_favorited = true)
        AND (
          ${searchPattern}::text IS NULL
          OR video.prompt ILIKE ${searchPattern} ESCAPE '\\'
          OR metadata.title ILIKE ${searchPattern} ESCAPE '\\'
          OR metadata.category ILIKE ${searchPattern} ESCAPE '\\'
          OR array_to_string(metadata.tags, ' ') ILIKE ${searchPattern} ESCAPE '\\'
        )
        AND (${category ?? null}::text IS NULL OR LOWER(metadata.category) = LOWER(${category ?? null}))
        AND (
          ${tag ?? null}::text IS NULL
          OR EXISTS (
            SELECT 1 FROM unnest(COALESCE(metadata.tags, ARRAY[]::text[])) AS saved_tag
            WHERE LOWER(saved_tag) = LOWER(${tag ?? null})
          )
        )
      ORDER BY video.created_at DESC
      LIMIT ${pageFetchLimit(limit)} OFFSET ${offset}
    `

    const { page, hasMore } = splitPage(rows, limit)

    const videos = page.map((row) => ({
      jobId: row.id as number,
      status: row.status as string,
      prompt: row.prompt as string,
      model: row.model as string,
      videoUrl: (row.video_url as string | null) ?? null,
      error: (row.error as string | null) ?? null,
      startImageUrl: (row.start_image_url as string | null) ?? null,
      timestamp: new Date(row.created_at as string).getTime(),
      durationSeconds: (row.duration_seconds as number | null) ?? null,
      resolution: (row.resolution as string | null) ?? null,
      aspectRatio: (row.aspect_ratio as string | null) ?? null,
      hasAudio: Boolean(row.has_audio),
      isFavorited: Boolean(row.is_favorited),
      title: (row.title as string | null) ?? null,
      category: (row.category as string | null) ?? null,
      tags: Array.isArray(row.tags) ? row.tags as string[] : [],
    }))

    return NextResponse.json({ videos, hasMore })
  } catch (error) {
    console.error('[video] History load failed:', error)
    return apiError(500, 'internal_error', 'Failed to load video history')
  }
}

// PATCH /api/video-history — toggle favorite on a clip
export async function PATCH(request: NextRequest) {
  const parsed = await parseJson(request, patchBodySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    await sql`
      UPDATE public.video_history SET is_favorited = ${parsed.data.isFavorited}
      WHERE id = ${parsed.data.jobId} AND user_id = ${userId}
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[video] Favorite toggle failed:', error)
    return apiError(500, 'internal_error', 'Failed to update favorite')
  }
}

// DELETE /api/video-history?id=X&userId=xxx
export async function DELETE(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), deleteQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    // RETURNING makes the outcome observable: the WHERE clause deliberately
    // refuses another user's row and any still-pending job (which is still
    // polling and still holds a credit reservation). Without this the handler
    // reported success for a delete it never performed, and the client would
    // drop a row the database still holds.
    const deleted = await sql`
      DELETE FROM public.video_history
      WHERE id = ${parsed.data.id} AND user_id = ${userId} AND status != 'pending'
      RETURNING id
    `
    const outcome = resolveVideoDeleteOutcome(deleted.length)
    if (!outcome.ok) {
      return apiError(outcome.status, outcome.code, 'That clip could not be deleted — it may still be generating, or it is already gone.')
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[video] History delete failed:', error)
    return apiError(500, 'internal_error', 'Failed to delete video')
  }
}
