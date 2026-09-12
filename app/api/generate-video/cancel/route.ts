import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { apiError, parseJson } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { refundReservation } from '@/lib/credits'
import { cancelVideoJob, getVideoJobStatus } from '@/lib/video/fal-video-client'
import { numericIdSchema, userIdSchema } from '@/lib/validation/common'
import { withUsage, setUsageContextUser } from '@/lib/costs/route'
import { finalizeProviderUsage } from '@/lib/costs/record'
import { falIdentityForVideoRow, falUnitsForVideoRow } from '@/lib/costs/video-units'

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
  duration_seconds: number | null
  resolution: string | null
  has_audio: boolean
}

async function handlePostWithUsage(request: NextRequest) {
  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)
  setUsageContextUser(userId)

  try {
    const sql = getSQL()
    const rows = await sql`
      SELECT id, user_id, status, fal_endpoint, fal_request_id, credits_charged, duration_seconds, resolution, has_audio
      FROM public.video_history
      WHERE id = ${parsed.data.jobId} AND user_id = ${userId}
    `
    const row = rows[0] as VideoJobRow | undefined
    if (!row) return apiError(404, 'not_found', 'Video job not found')
    if (row.status !== 'pending') {
      return apiError(409, 'not_pending', `This job already ${row.status === 'completed' ? 'finished' : 'ended'}`)
    }

    // Only a cancel fal ACCEPTED is guaranteed unbilled. A rejected cancel may
    // still render — even one fal reports as queued, if the cancel call itself
    // failed — so the ledger keeps the estimate at confidence 'unknown' rather
    // than booking it as free.
    let mayStillBill = false
    try {
      await cancelVideoJob(row.fal_endpoint, row.fal_request_id)
    } catch (cancelError) {
      // Cancel is rejected once the job left the queue — find out which way.
      const queueStatus = await getVideoJobStatus(row.fal_endpoint, row.fal_request_id).catch(() => null)
      if (queueStatus === 'COMPLETED') {
        return apiError(409, 'too_late', 'Too late to cancel — the clip already finished and will appear shortly')
      }
      mayStillBill = true
      console.error(`[video] Cancel rejected for job ${row.id} (queue: ${queueStatus}):`, cancelError)
      // IN_PROGRESS (or unknown): the render may complete on fal's side, but
      // the user asked to stop — mark it canceled and refund; the poller
      // stops on the non-pending row.
    }

    const closed = await sql`
      UPDATE public.video_history
      SET status = 'failed', error = 'Canceled — credits refunded', completed_at = NOW()
      WHERE id = ${row.id} AND status = 'pending'
      RETURNING id
    `
    // The poller stops on a non-pending row, so the ledger row must be closed
    // here — but only by the request that actually closed the job, so a cancel
    // racing a completion poll does not warn about an already-final row.
    // A concurrent poll can close the job between the status probe above and
    // this UPDATE. Only the request that actually closed it may finalize the
    // ledger row and refund: the completion path closes the row as `completed`
    // without refunding, so refunding here regardless would hand back credits
    // for a delivered video.
    if (closed.length === 0) {
      const [current] = await sql`
        SELECT status, video_url FROM public.video_history WHERE id = ${row.id}
      `
      console.warn(`[video] Cancel for job ${row.id} lost the race; job already ${current?.status ?? 'closed'} — no refund, no ledger change`)
      return NextResponse.json({ jobId: row.id, status: current?.status ?? 'failed', videoUrl: current?.video_url ?? null, canceled: false })
    }

    void finalizeProviderUsage(
      row.fal_request_id,
      falIdentityForVideoRow(row),
      mayStillBill
        ? { status: 'timeout', units: falUnitsForVideoRow(row), error: 'Canceled after the job left the queue or its status was unknown; fal may still bill it' }
        : { status: 'failed', error: 'Canceled by user' },
    )
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


export const POST = withUsage('generate-video/cancel', handlePostWithUsage)
