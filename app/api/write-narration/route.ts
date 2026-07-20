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
 * POST /api/write-narration — write a voiceover script timed to a film's
 * length, from the clips' prompts. Used by the Assemble Film dialog.
 */

const bodySchema = z.object({
  clips: z.array(z.string().max(1000)).min(1).max(12),
  targetSeconds: z.number().min(4).max(300),
})

export async function POST(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.helper)
  if (rateLimited) return rateLimited

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response
  const { clips, targetSeconds } = parsed.data

  // Comfortable narration pace ≈ 2.3 words/second, leaving breathing room.
  const targetWords = Math.max(10, Math.round(targetSeconds * 2.3 * 0.8))

  const prompt = `You are writing a film voiceover. Here are the film's shots in order:
${clips.map((clip, index) => `${index + 1}. ${clip}`).join('\n')}

Write a narration of about ${targetWords} words (the film runs ${targetSeconds} seconds — the narration must fit comfortably with pauses).
Rules: evocative but restrained; short sentences; present or past tense picked to suit the story; no scene numbers, no camera directions, no quotes around the text. Return ONLY the narration text.`

  try {
    const raw = await generateOpenAIText(prompt, { maxOutputTokens: 1500 })
    const narration = raw.trim().replace(/^["'\s]+|["'\s]+$/g, '')
    if (!narration) throw new Error('Empty narration returned')
    return NextResponse.json({ narration })
  } catch (error) {
    console.error("[narration] Failed:", error)
    if (isOpenAIRateLimitError(error)) {
      return apiError(429, "rate_limited", "The AI is busy — try again in a minute")
    }
    if (isOpenAIAuthError(error)) {
      return apiError(500, "provider_auth", "OpenAI API key is missing or invalid")
    }
    return apiError(500, "narration_failed", "Could not write the narration")
  }
}
