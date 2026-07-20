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
 * POST /api/generate-script — Story Mode's front door. Turns an idea (or a
 * pasted script) into a structured shot plan the client can edit, then
 * batch-generate frames and clips from.
 */

const bodySchema = z.object({
  idea: z.string().trim().min(3).max(8000),
  shotCount: z.number().int().min(2).max(8).default(4),
})

const shotSchema = z.object({
  title: z.string().min(1).max(200),
  framePrompt: z.string().min(10).max(2000),
  motionPrompt: z.string().min(5).max(1000),
  durationSeconds: z.number().int().min(4).max(12).catch(5),
})

const scriptSchema = z.object({
  title: z.string().min(1).max(200),
  shots: z.array(shotSchema).min(1).max(10),
})

const DIRECTOR_PROMPT = (idea: string, shotCount: number) => `You are a film director and screenwriter for short AI-generated videos.

Break the following idea (or script) into exactly ${shotCount} shots that tell one coherent story with a beginning, middle, and end.

CONTINUITY RULES (critical):
- Decide on the main character(s), setting, and visual style ONCE, then repeat the exact same descriptors word-for-word in every shot's framePrompt (e.g. "a woman with short silver hair in a red raincoat, cinematic photoreal style, moody blue-hour light"). This keeps characters and style consistent across separately-generated shots.

For each shot return:
- "title": 3-6 word shot name
- "framePrompt": a rich text-to-image prompt for the FIRST frame of the shot — subject (with the repeated descriptors), setting, composition, lighting, style
- "motionPrompt": motion only — one camera movement plus subject/environment action, 1-2 sentences, under 40 words. Do not re-describe the scene.
- "durationSeconds": 4-12 (default 5; longer for slow reveals)

Return STRICT JSON only, no markdown fences, exactly this shape:
{"title": "story title", "shots": [{"title": "...", "framePrompt": "...", "motionPrompt": "...", "durationSeconds": 5}]}

IDEA OR SCRIPT:
${idea}`

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
      DIRECTOR_PROMPT(parsed.data.idea, parsed.data.shotCount),
      { maxOutputTokens: 4000 },
    )
    const script = scriptSchema.parse(extractJson(raw))
    return NextResponse.json({ script })
  } catch (error) {
    console.error("[script] Failed:", error)
    if (isOpenAIRateLimitError(error)) {
      return apiError(429, "rate_limited", "The AI is busy — try again in a minute")
    }
    if (isOpenAIAuthError(error)) {
      return apiError(500, "provider_auth", "OpenAI API key is missing or invalid")
    }
    return apiError(500, "script_failed", "Could not write the script — try rephrasing your idea")
  }
}
