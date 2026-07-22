import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { apiError, parseJson } from '@/lib/api/http'
import {
  generateOpenAIText,
  isOpenAIAuthError,
  isOpenAIRateLimitError,
} from "@/lib/openai-text-client"

/**
 * POST /api/plan-broll — turns a voiceover transcript into a list of
 * "motivated B-roll moments": the lines worth illustrating, each with a
 * silent text-to-video cutaway prompt. Text-only (OpenAI) so it is NOT
 * credit-guarded — only the clips generated from this plan cost credits.
 */

const bodySchema = z.object({
  transcript: z.string().trim().min(20).max(20000),
  beatCount: z.number().int().min(2).max(20).default(8),
})

const beatSchema = z.object({
  // Verbatim substring of the transcript this cutaway covers — lets the editor
  // (and a later manifest export) map the clip back to the spoken line.
  sourcePhrase: z.string().min(1).max(500),
  keyword: z.string().min(1).max(60),
  videoPrompt: z.string().min(10).max(2000),
  durationSeconds: z.number().int().min(4).max(8).catch(5),
})

const planSchema = z.object({
  beats: z.array(beatSchema).min(1).max(24),
})

const BROLL_PROMPT = (transcript: string, beatCount: number) => `You are a B-roll editor for a talking-head video. Below is the VOICEOVER TRANSCRIPT the creator is speaking to camera. Your job is to choose the moments where a visual cutaway (B-roll) laid OVER the voiceover would add the most value, and write a clip for each.

Pick up to ${beatCount} moments — fewer is fine if the transcript doesn't have that many strong ones. Do NOT pad with weak filler moments.

CHOOSE moments that are: concrete nouns, actions, places, numbers, comparisons, or clear emotional beats. Spread them across the whole transcript, not clustered at the start.
SKIP: greetings, filler, calls-to-action ("subscribe"), and abstract talk with nothing to show.

INTERPRET IN CONTEXT, never literally. If the speaker says "cut costs", show a falling line chart or shrinking stack of coins — NOT scissors. If they say "the pipeline", show data/fluid flowing through stages, not oil infrastructure (unless the topic is oil).

Each clip prompt MUST:
- describe ONE subject, its setting, and a single subtle camera move (slow push-in, gentle pan, rack focus)
- be silent and calm enough to sit UNDER a voice — no frantic action
- contain NO on-screen text, captions, logos, brand names, or recognizable real people
- leave visual headroom (clean negative space) for captions to be overlaid later

For each moment return:
- "sourcePhrase": the exact substring of the transcript this covers, copied VERBATIM (so it can be located later)
- "keyword": a 2-3 word label for the moment
- "videoPrompt": the text-to-video cutaway prompt (subject + setting + one camera move), under 45 words
- "durationSeconds": 4-6

Return STRICT JSON only, no markdown fences, exactly this shape:
{"beats": [{"sourcePhrase": "...", "keyword": "...", "videoPrompt": "...", "durationSeconds": 5}]}

VOICEOVER TRANSCRIPT:
${transcript}`

function extractJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object in response')
  return JSON.parse(trimmed.slice(start, end + 1))
}

export async function POST(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.helper)
  if (rateLimited) return rateLimited

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response

  try {
    const raw = await generateOpenAIText(
      BROLL_PROMPT(parsed.data.transcript, parsed.data.beatCount),
      { maxOutputTokens: 6000 },
    )
    const plan = planSchema.parse(extractJson(raw))
    return NextResponse.json({ plan })
  } catch (error) {
    console.error("[broll] Plan failed:", error)
    if (isOpenAIRateLimitError(error)) {
      return apiError(429, "rate_limited", "The AI is busy — try again in a minute")
    }
    if (isOpenAIAuthError(error)) {
      return apiError(500, "provider_auth", "OpenAI API key is missing or invalid")
    }
    return apiError(500, "broll_plan_failed", "Could not plan B-roll — try a longer or clearer transcript")
  }
}
