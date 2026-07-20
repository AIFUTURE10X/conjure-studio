import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { withCreditGuard, isSaasEnforcementOn } from '@/lib/api/guard'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { apiError, parseJson } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { videoToolCost } from '@/lib/credits/cost-map'
import { runFalDirect, extractMediaUrl, submitVideoJob } from '@/lib/video/fal-video-client'
import { getMusicStyle } from '@/app/image-studio/constants/film-assembly'
import { userIdSchema } from '@/lib/validation/common'

export const runtime = "nodejs"
export const maxDuration = 300

/**
 * POST /api/assemble-film — stitch clips into one film with optional
 * narration and music. Pipeline: merge-videos (sync) → ElevenLabs/Kling
 * TTS (sync) → Lyria 2 music (sync) → ffmpeg compose (queued). The final
 * job lands in video_history as model 'film-assembly' so the existing
 * polling/Blob/refund flow finishes it.
 */

const bodySchema = z.object({
  userId: userIdSchema,
  clips: z.array(z.object({
    url: z.string().url().startsWith('https://'),
    durationSeconds: z.number().min(1).max(180).catch(5),
  })).min(2).max(12),
  narration: z.object({
    text: z.string().trim().min(1).max(1500),
    engine: z.enum(['elevenlabs', 'kling']),
    voiceId: z.string().trim().min(1).max(60),
  }).optional(),
  music: z.object({ styleId: z.string().max(40) }).optional(),
})

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

async function generateNarration(narration: NonNullable<z.infer<typeof bodySchema>['narration']>): Promise<string> {
  if (narration.engine === 'elevenlabs') {
    const data = await runFalDirect('fal-ai/elevenlabs/tts/eleven-v3', {
      text: narration.text,
      voice: narration.voiceId,
      stability: 0.5,
    })
    return extractMediaUrl(data)
  }
  const data = await runFalDirect('fal-ai/kling-video/v1/tts', {
    text: narration.text.slice(0, 500),
    voice_id: narration.voiceId,
  })
  return extractMediaUrl(data)
}

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.generation)
  if (rateLimited) return rateLimited

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response
  const { clips, narration, music } = parsed.data
  const userId = await resolveUserId(request, parsed.data.userId)

  const musicStyle = music ? getMusicStyle(music.styleId) : undefined
  const wantsMusic = Boolean(musicStyle && musicStyle.id !== 'none' && musicStyle.prompt)

  try {
    // 1) Stitch the clips (normalizes fps/resolution across inputs).
    console.log(`[film] Merging ${clips.length} clips`)
    const merged = extractMediaUrl(
      await runFalDirect('fal-ai/ffmpeg-api/merge-videos', {
        video_urls: clips.map((clip) => clip.url),
      }),
    )

    // 2) Narration + music in parallel (both are fast sync models).
    const [narrationUrl, musicUrl] = await Promise.all([
      narration ? generateNarration(narration) : Promise.resolve(null),
      wantsMusic
        ? runFalDirect('fal-ai/lyria2', { prompt: musicStyle!.prompt }).then(extractMediaUrl)
        : Promise.resolve(null),
    ])

    const totalMs = Math.round(clips.reduce((sum, clip) => sum + clip.durationSeconds, 0) * 1000)

    // 3) Compose the final timeline. Audio keyframes get the full film
    //    window; shorter audio simply ends early.
    const tracks: Array<Record<string, unknown>> = [
      {
        id: 'film',
        type: 'video',
        keyframes: [{ timestamp: 0, duration: totalMs, url: merged }],
      },
    ]
    if (narrationUrl) {
      tracks.push({ id: 'narration', type: 'audio', keyframes: [{ timestamp: 0, duration: totalMs, url: narrationUrl }] })
    }
    if (musicUrl) {
      tracks.push({ id: 'music', type: 'audio', keyframes: [{ timestamp: 0, duration: totalMs, url: musicUrl }] })
    }

    const requestId = await submitVideoJob('fal-ai/ffmpeg-api/compose', { tracks })
    const creditsCharged = isSaasEnforcementOn() ? videoToolCost('filmAssembly') : 0

    const promptLabel = `Film: ${clips.length} clips` +
      (narration ? ` · narrated (${narration.engine === 'elevenlabs' ? narration.voiceId : 'Kling voice'})` : '') +
      (wantsMusic ? ` · ${musicStyle!.label}` : '')

    const sql = getSQL()
    const rows = await sql`
      INSERT INTO public.video_history (
        user_id, prompt, model, fal_endpoint, fal_request_id, status,
        start_image_url, end_image_url, duration_seconds, resolution,
        aspect_ratio, has_audio, credits_charged
      ) VALUES (
        ${userId}, ${promptLabel}, 'film-assembly', 'fal-ai/ffmpeg-api/compose', ${requestId}, 'pending',
        NULL, NULL, ${Math.round(totalMs / 1000)}, '1080p',
        'auto', ${Boolean(narrationUrl || musicUrl)}, ${creditsCharged}
      )
      RETURNING id
    `
    return NextResponse.json({ jobId: rows[0].id as number, requestId, status: 'pending' })
  } catch (error) {
    console.error("[film] Assembly failed:", error)
    return apiError(500, 'internal_error', error instanceof Error ? error.message : 'Film assembly failed')
  }
}

export const POST = withCreditGuard('film_assembly', videoToolCost('filmAssembly'), handlePost)
