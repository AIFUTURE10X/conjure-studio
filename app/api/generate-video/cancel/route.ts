import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { apiError, parseJson } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { refundReservation } from '@/lib/credits'
import { cancelVideoJob, getVideoJobStatus } from '@/lib/video/fal-video-client'
import { numericIdSchema, userIdSchema } from '@/lib/validation/common'

export const runtime = "nodejs"

/**
 * POST /api/generate-video/cancel — cancel a pending video job.
 *
 * fal only guarantees cancellation while the job is IN_QUEUE; once a render
 * is IN_PROGRESS the GPU may finish anyway. Either way the row is marked
 * failed and the debit refunded (same job-scoped idempotency key as the
 * status route, so a racing poll can't double-refund). If fal reports the
 * job already COMPLETED, we refuse: the clip exists and will land shortly.
 */

const bodySchema = z.object({ jobId: numericIdSchema, userId: userIdSchema })

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
  credits_charged: number
}

export async function POST(request: NextRequest) {
  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    const rows = await sql`
      SELECT id, user_id, status, fal_endpoint, fal_request_id, credits_charged
      FROM public.video_history
      WHERE id = ${parsed.data.jobId} AND user_id = ${userId}
    `
    const row = rows[0] as VideoJobRow | undefined
    if (!row) return apiError(404, 'not_found', 'Video job not found')
    if (row.status !== 'pending') {
      return apiError(409, 'not_pending', `This job already ${row.status === 'completed' ? 'finished' : 'ended'}`)
    }

    try {
      await cancelVideoJob(row.fal_endpoint, row.fal_request_id)
    } catch (cancelError) {
      // Cancel is rejected once the job left the queue — find out which way.
      const queueStatus = await getVideoJobStatus(row.fal_endpoint, row.fal_request_id).catch(() => null)
      if (queueStatus === 'COMPLETED') {
        return apiError(409, 'too_late', 'Too late to cancel — the clip already finished and will appear shortly')
      }
      console.error(`[video] Cancel rejected for job ${row.id} (queue: ${queueStatus}):`, cancelError)
      // IN_PROGRESS (or unknown): the render may complete on fal's side, but
      // the user asked to stop — mark it canceled and refund; the poller
      // stops on the non-pending row.
    }

    await sql`
      UPDATE public.video_history
      SET status = 'failed', error = 'Canceled — credits refunded', completed_at = NOW()
      WHERE id = ${row.id} AND status = 'pending'
    `
    if (row.credits_charged > 0) {
      await refundReservation(
        row.user_id,
        row.credits_charged,
        `op:video_generation:job:${row.id}`,
        'video_generation:refund',
      ).catch((error) => console.error(`[video] Cancel refund failed for job ${row.id}:`, error))
    }

    console.log(`[video] Job ${row.id} canceled by user`)
    return NextResponse.json({ jobId: row.id, status: 'failed', canceled: true })
  } catch (error) {
    console.error('[video] Cancel route error:', error)
    return apiError(500, 'internal_error', 'Failed to cancel the video job')
  }
}
