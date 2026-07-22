import { type NextRequest, NextResponse } from "next/server"
import { withCreditGuard } from '@/lib/api/guard'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { apiError, parseFormData } from '@/lib/api/http'
import { videoToolCost } from '@/lib/credits/cost-map'
import { runFalDirect, uploadFrameToFal } from '@/lib/video/fal-video-client'

export const runtime = "nodejs"
export const maxDuration = 300

/**
 * POST /api/transcribe — fal Whisper with word-level timestamps, used by
 * Script → B-roll to auto-place cutaways on real timecodes. Synchronous
 * (one await), so the credit guard's non-2xx refund covers failures and no
 * job row is needed. Audio-first: the whole request must stay under
 * Vercel's ~4.5MB body cap, so we take audio (or a short clip) up to 4MB —
 * for a long talking-head video, export its audio track first.
 */

const MAX_MEDIA_BYTES = 4 * 1024 * 1024

interface WhisperChunk {
  timestamp?: [number | null, number | null] | null
  text?: string
}

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.generation)
  if (rateLimited) return rateLimited

  const parsedForm = await parseFormData(request)
  if (parsedForm.response) return parsedForm.response
  const file = parsedForm.data.get('media') as File | null
  if (!file || file.size === 0) {
    return apiError(400, 'invalid_request', 'Upload an audio file (or a short clip)')
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return apiError(400, 'invalid_request', 'File is too large (max 4MB) — upload just the audio track')
  }

  try {
    const audioUrl = await uploadFrameToFal(file)
    const result = await runFalDirect('fal-ai/whisper', {
      audio_url: audioUrl,
      task: 'transcribe',
      chunk_level: 'word',
    })
    // WhisperOutput: { text, chunks: [{ timestamp: [start, end], text }] } — seconds, not ms.
    const chunks = Array.isArray(result.chunks) ? (result.chunks as WhisperChunk[]) : []
    const words = chunks
      .map((chunk) => ({ start: chunk.timestamp?.[0] ?? 0, text: (chunk.text ?? '').trim() }))
      .filter((word) => word.text.length > 0)
    // No usable speech (silence, a music bed, wrong-language noise): fail with a
    // 4xx so the credit guard refunds the debit instead of committing it.
    if (words.length === 0) {
      return apiError(422, 'no_speech', 'No speech found — upload the voiceover audio track')
    }
    return NextResponse.json({ text: typeof result.text === 'string' ? result.text : '', words })
  } catch (error) {
    console.error('[transcribe] Failed:', error)
    return apiError(500, 'transcribe_failed', error instanceof Error ? error.message : 'Transcription failed')
  }
}

export const POST = withCreditGuard('transcription', videoToolCost('transcribe'), handlePost)
