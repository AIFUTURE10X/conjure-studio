import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { apiError, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { numericIdSchema, userIdSchema } from '@/lib/validation/common'

export const runtime = "nodejs"

/** GET /api/video-history?userId=xxx — recent video jobs (newest first). */

const getQuerySchema = z.object({ userId: userIdSchema })
const deleteQuerySchema = z.object({ id: numericIdSchema, userId: userIdSchema })

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

export async function GET(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), getQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    const rows = await sql`
      SELECT id, status, prompt, model, video_url, error, start_image_url, created_at
      FROM public.video_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `

    const videos = rows.map((row) => ({
      jobId: row.id as number,
      status: row.status as string,
      prompt: row.prompt as string,
      model: row.model as string,
      videoUrl: (row.video_url as string | null) ?? null,
      error: (row.error as string | null) ?? null,
      startImageUrl: (row.start_image_url as string | null) ?? null,
      timestamp: new Date(row.created_at as string).getTime(),
    }))

    return NextResponse.json({ videos })
  } catch (error) {
    console.error('[video] History load failed:', error)
    return apiError(500, 'internal_error', 'Failed to load video history')
  }
}

// DELETE /api/video-history?id=X&userId=xxx
export async function DELETE(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), deleteQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    await sql`
      DELETE FROM public.video_history
      WHERE id = ${parsed.data.id} AND user_id = ${userId} AND status != 'pending'
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[video] History delete failed:', error)
    return apiError(500, 'internal_error', 'Failed to delete video')
  }
}
