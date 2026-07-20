import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { withCreditGuard, videoFormCost } from '@/lib/api/guard'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { apiError, parseFormData, parseFormFields } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { isSaasEnforcementOn } from '@/lib/api/guard'
import { videoGenerationCost } from '@/lib/credits/cost-map'
import { getVideoModel, VIDEO_MODEL_IDS, type VideoResolution } from '@/lib/video/providers'
import { submitVideoJob, uploadFrameToFal } from '@/lib/video/fal-video-client'
import { promptSchema, userIdSchema } from '@/lib/validation/common'

export const runtime = "nodejs"
export const maxDuration = 300

/**
 * POST /api/generate-video — submit an async video job to the fal queue.
 *
 * Returns { jobId, requestId } immediately; the client polls
 * /api/generate-video/status until the job completes. Credits are debited
 * here by the guard; a job that later fails is refunded by the status route
 * (idempotent per job).
 */

const formSchema = z.object({
  userId: userIdSchema,
  prompt: promptSchema,
  model: z.enum(VIDEO_MODEL_IDS as [string, ...string[]]),
  duration: z.coerce.number().int().min(2).max(15).default(5),
  resolution: z.enum(['480p', '720p', '1080p', '4k']).default('1080p'),
  aspectRatio: z.string().trim().max(20).default('auto'),
  generateAudio: z.preprocess((value) => value === 'true' || value === true, z.boolean()).default(false),
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
  const { prompt, model: modelId, duration, aspectRatio, generateAudio } = parsedFields.data
  const userId = await resolveUserId(request, parsedFields.data.userId)

  const model = getVideoModel(modelId)
  if (!model) return apiError(400, 'invalid_request', `Unknown video model: ${modelId}`)

  // Snap resolution to what the model actually supports.
  const resolution: VideoResolution = model.capabilities.resolutions.includes(parsedFields.data.resolution)
    ? parsedFields.data.resolution
    : model.capabilities.resolutions[model.capabilities.resolutions.length - 1]

  try {
    // Native extension path (Veo): append ~7s to an existing clip, same file.
    const extendVideoUrl = (formData.get('extendVideoUrl') as string | null)?.trim() || null
    if (extendVideoUrl) {
      if (!extendVideoUrl.startsWith('https://')) {
        return apiError(400, 'invalid_request', 'extendVideoUrl must be an https URL')
      }
      if (!model.buildExtend) {
        return apiError(400, 'invalid_request', `${model.label} does not support native extension — continue from the last frame instead`)
      }

      const audio = generateAudio && model.capabilities.audio
      const { endpoint, input, addedSeconds } = model.buildExtend({
        prompt, videoUrl: extendVideoUrl, resolution, aspectRatio, generateAudio: audio,
      })

      console.log("[video] Submitting extend job:", { model: modelId, endpoint, addedSeconds })
      const requestId = await submitVideoJob(endpoint, input)

      const creditsCharged = isSaasEnforcementOn()
        ? videoGenerationCost(modelId, addedSeconds, resolution, audio)
        : 0

      const sql = getSQL()
      const rows = await sql`
        INSERT INTO public.video_history (
          user_id, prompt, model, fal_endpoint, fal_request_id, status,
          start_image_url, end_image_url, duration_seconds, resolution,
          aspect_ratio, has_audio, credits_charged
        ) VALUES (
          ${userId}, ${prompt}, ${modelId}, ${endpoint}, ${requestId}, 'pending',
          NULL, NULL, ${addedSeconds}, ${resolution},
          ${aspectRatio}, ${audio}, ${creditsCharged}
        )
        RETURNING id
      `
      return NextResponse.json({ jobId: rows[0].id as number, requestId, status: 'pending', model: modelId })
    }

    const startFrameFile = formData.get('startFrame') as File | null
    const endFrameFile = formData.get('endFrame') as File | null

    if (!startFrameFile && !model.capabilities.textToVideo) {
      return apiError(400, 'invalid_request', `${model.label} requires a start frame`)
    }

    const [startImageUrl, endImageUrl] = await Promise.all([
      startFrameFile && startFrameFile.size > 0 ? uploadFrameToFal(startFrameFile) : Promise.resolve(undefined),
      endFrameFile && endFrameFile.size > 0 && model.capabilities.endFrame
        ? uploadFrameToFal(endFrameFile)
        : Promise.resolve(undefined),
    ])

    const params = {
      prompt,
      startImageUrl,
      endImageUrl: startImageUrl ? endImageUrl : undefined,
      durationSeconds: duration,
      resolution,
      aspectRatio,
      generateAudio: generateAudio && model.capabilities.audio,
    }

    const endpoint = model.endpoint(params)
    const input = model.buildInput(params)

    console.log("[video] Submitting job:", { model: modelId, endpoint, duration, resolution, hasStart: !!startImageUrl, hasEnd: !!endImageUrl })

    const requestId = await submitVideoJob(endpoint, input)

    // credits_charged mirrors what the guard debited (0 when enforcement is
    // off) so the status route can refund a failed job idempotently.
    const creditsCharged = isSaasEnforcementOn()
      ? videoGenerationCost(modelId, duration, resolution, params.generateAudio)
      : 0

    const sql = getSQL()
    const rows = await sql`
      INSERT INTO public.video_history (
        user_id, prompt, model, fal_endpoint, fal_request_id, status,
        start_image_url, end_image_url, duration_seconds, resolution,
        aspect_ratio, has_audio, credits_charged
      ) VALUES (
        ${userId}, ${prompt}, ${modelId}, ${endpoint}, ${requestId}, 'pending',
        ${startImageUrl ?? null}, ${endImageUrl ?? null}, ${duration}, ${resolution},
        ${aspectRatio}, ${params.generateAudio}, ${creditsCharged}
      )
      RETURNING id
    `

    return NextResponse.json({
      jobId: rows[0].id as number,
      requestId,
      status: 'pending',
      model: modelId,
    })
  } catch (error) {
    console.error("[video] Submit failed:", error)
    const message = error instanceof Error ? error.message : 'Failed to submit video job'
    return apiError(500, 'internal_error', message)
  }
}

export const POST = withCreditGuard('video_generation', videoFormCost, handlePost)
