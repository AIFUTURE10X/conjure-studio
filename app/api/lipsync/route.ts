import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { withCreditGuard, isSaasEnforcementOn } from '@/lib/api/guard'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { apiError, parseFormData, parseFormFields } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { videoToolCost } from '@/lib/credits/cost-map'
import { submitVideoJob, uploadFrameToFal } from '@/lib/video/fal-video-client'
import { userIdSchema } from '@/lib/validation/common'

export const runtime = "nodejs"
export const maxDuration = 300

/**
 * POST /api/lipsync — make a finished clip talk (Kling lipsync via fal).
 * Text mode uses built-in TTS voices; audio mode lip-syncs an uploaded
 * MP3/WAV. Jobs reuse the video_history queue/poll/refund pipeline with
 * model 'kling-lipsync'.
 */

const MAX_AUDIO_BYTES = 5 * 1024 * 1024

const formSchema = z.object({
  userId: userIdSchema,
  videoUrl: z.string().url().startsWith('https://'),
  mode: z.enum(['text', 'audio']),
  text: z.string().trim().max(120).optional(),
  voiceId: z.string().trim().max(60).optional(),
  voiceSpeed: z.coerce.number().min(0.5).max(2).default(1),
})

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.generation)
  if (rateLimited) return rateLimited

  const parsedForm = await parseFormData(request)
  if (parsedForm.response) return parsedForm.response
  const formData = parsedForm.data

  const parsedFields = parseFormFields(formData, formSchema)
  if (parsedFields.response) return parsedFields.response
  const { videoUrl, mode, text, voiceId, voiceSpeed } = parsedFields.data
  const userId = await resolveUserId(request, parsedFields.data.userId)

  try {
    let endpoint: string
    let input: Record<string, unknown>
    let promptLabel: string

    if (mode === 'text') {
      if (!text || !voiceId) {
        return apiError(400, 'invalid_request', 'Text mode needs text and a voice')
      }
      endpoint = 'fal-ai/kling-video/lipsync/text-to-video'
      input = {
        video_url: videoUrl,
        text,
        voice_id: voiceId,
        voice_language: 'en',
        voice_speed: voiceSpeed,
      }
      promptLabel = `Lip sync: “${text}”`
    } else {
      const audioFile = formData.get('audio') as File | null
      if (!audioFile || audioFile.size === 0) {
        return apiError(400, 'invalid_request', 'Audio mode needs an audio file')
      }
      if (audioFile.size > MAX_AUDIO_BYTES) {
        return apiError(400, 'invalid_request', 'Audio file is too large (max 5MB)')
      }
      const audioUrl = await uploadFrameToFal(audioFile)
      endpoint = 'fal-ai/kling-video/lipsync/audio-to-video'
      input = { video_url: videoUrl, audio_url: audioUrl }
      promptLabel = 'Lip sync (uploaded audio)'
    }

    console.log("[lipsync] Submitting job:", { endpoint, mode })
    const requestId = await submitVideoJob(endpoint, input)
    const creditsCharged = isSaasEnforcementOn() ? videoToolCost('lipsync') : 0

    const sql = getSQL()
    const rows = await sql`
      INSERT INTO public.video_history (
        user_id, prompt, model, fal_endpoint, fal_request_id, status,
        start_image_url, end_image_url, duration_seconds, resolution,
        aspect_ratio, has_audio, credits_charged
      ) VALUES (
        ${userId}, ${promptLabel}, 'kling-lipsync', ${endpoint}, ${requestId}, 'pending',
        NULL, NULL, NULL, NULL, 'auto', TRUE, ${creditsCharged}
      )
      RETURNING id
    `
    return NextResponse.json({ jobId: rows[0].id as number, requestId, status: 'pending' })
  } catch (error) {
    console.error("[lipsync] Submit failed:", error)
    return apiError(500, 'internal_error', error instanceof Error ? error.message : 'Failed to start lip sync')
  }
}

export const POST = withCreditGuard('lipsync', videoToolCost('lipsync'), handlePost)
