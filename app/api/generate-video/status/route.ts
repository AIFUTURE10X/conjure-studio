import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { put } from "@vercel/blob"
import { z } from "zod"
import { apiError, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { refundReservation } from '@/lib/credits'
import { getVideoJobStatus, getVideoJobResult } from '@/lib/video/fal-video-client'
import { numericIdSchema, userIdSchema } from '@/lib/validation/common'

export const runtime = "nodejs"
export const maxDuration = 300

/**
 * GET /api/generate-video/status?jobId=X&userId=Y — poll an async video job.
 *
 * DB-first so repeat polls after completion are cheap and idempotent. On
 * fal COMPLETED: download the video, persist to Vercel Blob, mark the row
 * completed. On failure: mark failed and refund the submit-time debit
 * (idempotency key is job-scoped, so concurrent polls can't double-refund).
 */

const querySchema = z.object({ jobId: numericIdSchema, userId: userIdSchema })

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

interface VideoJobRow {
  id: number
  user_id: string
  status: 'pending' | 'completed' | 'failed'
  fal_endpoint: string
  fal_request_id: string
  video_url: string | null
  credits_charged: number
  error: string | null
}

function jobResponse(row: VideoJobRow) {
  return NextResponse.json({
    jobId: row.id,
    status: row.status,
    videoUrl: row.video_url,
    error: row.error,
  })
}

async function refundFailedJob(sql: ReturnType<typeof getSQL>, row: VideoJobRow, message: string) {
  await sql`
    UPDATE public.video_history
    SET status = 'failed', error = ${message.slice(0, 500)}, completed_at = NOW()
    WHERE id = ${row.id} AND status = 'pending'
  `
  if (row.credits_charged > 0) {
    await refundReservation(
      row.user_id,
      row.credits_charged,
      `op:video_generation:job:${row.id}`,
      'video_generation:refund',
    ).catch((error) => console.error(`[video] Refund failed for job ${row.id}:`, error))
  }
}

export async function GET(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), querySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    const rows = await sql`
      SELECT id, user_id, status, fal_endpoint, fal_request_id, video_url, credits_charged, error
      FROM public.video_history
      WHERE id = ${parsed.data.jobId} AND user_id = ${userId}
    `
    const row = rows[0] as VideoJobRow | undefined
    if (!row) return apiError(404, 'not_found', 'Video job not found')
    if (row.status !== 'pending') return jobResponse(row)

    let queueStatus: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED'
    try {
      queueStatus = await getVideoJobStatus(row.fal_endpoint, row.fal_request_id)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Video generation failed'
      console.error(`[video] Status check failed for job ${row.id}:`, error)
      await refundFailedJob(sql, row, message)
      return jobResponse({ ...row, status: 'failed', error: message })
    }

    if (queueStatus !== 'COMPLETED') {
      return NextResponse.json({ jobId: row.id, status: 'pending', queueStatus })
    }

    try {
      const { videoUrl: falVideoUrl, contentType } = await getVideoJobResult(row.fal_endpoint, row.fal_request_id)

      // Persist to Vercel Blob; fall back to the fal-hosted URL when Blob is
      // unavailable (e.g. local dev without BLOB_READ_WRITE_TOKEN) — same
      // graceful degradation as the image history route.
      let videoUrl = falVideoUrl
      try {
        const videoResponse = await fetch(falVideoUrl)
        if (!videoResponse.ok) throw new Error(`Failed to fetch video from fal: ${videoResponse.status}`)
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
        const upload = await put(`videos/${userId}-job${row.id}.mp4`, videoBuffer, {
          access: 'public',
          contentType,
          allowOverwrite: true,
        })
        videoUrl = upload.url
      } catch (error) {
        console.error(`[video] Blob upload failed for job ${row.id}, storing fal URL directly:`, error)
      }

      await sql`
        UPDATE public.video_history
        SET status = 'completed', video_url = ${videoUrl}, completed_at = NOW()
        WHERE id = ${row.id} AND status = 'pending'
      `
      console.log(`[video] Job ${row.id} completed:`, videoUrl)
      return jobResponse({ ...row, status: 'completed', video_url: videoUrl })
    } catch (error) {
      // Result fetch throws for failed generations (safety blocks, provider
      // errors) — treat as a failed job and refund.
      const message = error instanceof Error ? error.message : 'Video generation failed'
      console.error(`[video] Result handling failed for job ${row.id}:`, error)
      await refundFailedJob(sql, row, message)
      return jobResponse({ ...row, status: 'failed', error: message })
    }
  } catch (error) {
    console.error('[video] Status route error:', error)
    return apiError(500, 'internal_error', 'Failed to check video status')
  }
}
