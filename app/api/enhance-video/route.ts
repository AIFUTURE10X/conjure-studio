import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { withCreditGuard, isSaasEnforcementOn } from '@/lib/api/guard'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { apiError, parseJson } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { videoToolCost } from '@/lib/credits/cost-map'
import { submitVideoJob } from '@/lib/video/fal-video-client'
import { userIdSchema } from '@/lib/validation/common'

export const runtime = "nodejs"
export const maxDuration = 300

/**
 * POST /api/enhance-video — upscale a finished clip with SeedVR2 (fal).
 * Reuses the video_history queue/poll/refund pipeline with model
 * 'seedvr-upscale'.
 */

const bodySchema = z.object({
  userId: userIdSchema,
  videoUrl: z.string().url().startsWith('https://'),
  targetResolution: z.enum(['1080p', '1440p', '2160p']).default('1080p'),
})

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.generation)
  if (rateLimited) return rateLimited

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response
  const { videoUrl, targetResolution } = parsed.data
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const endpoint = 'fal-ai/seedvr/upscale/video'
    const input = {
      video_url: videoUrl,
      upscale_mode: 'target',
      target_resolution: targetResolution,
      output_format: 'X264 (.mp4)',
      output_quality: 'high',
    }

    console.log("[enhance-video] Submitting job:", { endpoint, targetResolution })
    const requestId = await submitVideoJob(endpoint, input)
    const creditsCharged = isSaasEnforcementOn() ? videoToolCost('videoUpscale') : 0

    const sql = getSQL()
    const rows = await sql`
      INSERT INTO public.video_history (
        user_id, prompt, model, fal_endpoint, fal_request_id, status,
        start_image_url, end_image_url, duration_seconds, resolution,
        aspect_ratio, has_audio, credits_charged
      ) VALUES (
        ${userId}, ${'Enhanced (upscaled to ' + targetResolution + ')'}, 'seedvr-upscale', ${endpoint}, ${requestId}, 'pending',
        NULL, NULL, NULL, ${targetResolution}, 'auto', FALSE, ${creditsCharged}
      )
      RETURNING id
    `
    return NextResponse.json({ jobId: rows[0].id as number, requestId, status: 'pending' })
  } catch (error) {
    console.error("[enhance-video] Submit failed:", error)
    return apiError(500, 'internal_error', error instanceof Error ? error.message : 'Failed to start enhance')
  }
}

export const POST = withCreditGuard('video_upscale', videoToolCost('videoUpscale'), handlePost)
