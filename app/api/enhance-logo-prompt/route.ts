import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { NextResponse } from "next/server"
import { z } from "zod"
import { buildLogoPromptBlueprintInstructions } from "@/app/image-studio/constants/ai-logo-knowledge"
import { parseJson } from "@/lib/api/http"
import {
  generateOpenAIText,
  getOpenAITextApiKeyNames,
  hasOpenAITextApiKey,
} from "@/lib/openai-text-client"

interface EnhancedLogoPromptResponse {
  enhancedPrompt?: unknown
  negativePrompt?: unknown
  designBrief?: unknown
}

const ENHANCE_SYSTEM_PROMPT = `You are a senior brand identity designer and AI logo prompt specialist.
Transform a rough logo idea into a polished prompt for AI logo generation.

${buildLogoPromptBlueprintInstructions()}

Return JSON only in this exact shape:
{
  "enhancedPrompt": "80-160 word generation-ready logo prompt",
  "negativePrompt": "comma-separated logo failures to avoid",
  "designBrief": {
    "brandName": "exact brand name or empty string",
    "logoType": "symbol | wordmark | combination | badge | mascot | monogram | app-icon",
    "textModeRecommendation": "ai-text | exact-text-overlay",
    "rationale": "one short sentence"
  }
}

Rules:
- Preserve exact brand names, capitalization, slogans, acronyms, and requested words.
- If the user requests exact readable text, recommend exact-text-overlay and make the prompt emphasize a symbol-only mark with space for typography.
- Use one clear visual metaphor and one composition. Avoid stuffing the prompt with unrelated symbols.
- Keep the logo clean, scalable, professional, and usable on a transparent background.
- Do not include markdown, commentary, prefixes, or code fences.`

function extractEnhancedLogoPromptResponse(responseText: string): EnhancedLogoPromptResponse | null {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null

  try {
    return JSON.parse(jsonMatch[0]) as EnhancedLogoPromptResponse
  } catch {
    return null
  }
}

function cleanPlainTextPrompt(responseText: string): string {
  return responseText
    .replace(/^["']|["']$/g, '')
    .replace(/^Enhanced prompt:\s*/i, '')
    .trim()
}

const postBodySchema = z.object({ prompt: z.string().trim().min(1, 'Prompt is required').max(10_000) })

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.transform)
  if (rateLimited) return rateLimited

  const parsed = await parseJson(request, postBodySchema)
  if (parsed.response) return parsed.response
  const { prompt } = parsed.data

  try {

    console.log("[Enhance Logo Prompt] Input:", prompt.substring(0, 50))

    if (!hasOpenAITextApiKey()) {
      return NextResponse.json(
        { error: "AI service not configured", details: `${getOpenAITextApiKeyNames()} environment variable is not set` },
        { status: 500 }
      )
    }

    const fullPrompt = `${ENHANCE_SYSTEM_PROMPT}

User's basic description: "${prompt}"

Enhanced prompt JSON:`

    const responseText = (await generateOpenAIText(fullPrompt, { maxOutputTokens: 2000 })).trim()

    const parsedResponse = extractEnhancedLogoPromptResponse(responseText)
    const enhancedPrompt = typeof parsedResponse?.enhancedPrompt === 'string'
      ? parsedResponse.enhancedPrompt.trim()
      : cleanPlainTextPrompt(responseText)
    const negativePrompt = typeof parsedResponse?.negativePrompt === 'string'
      ? parsedResponse.negativePrompt.trim()
      : ''

    console.log("[Enhance Logo Prompt] Output length:", enhancedPrompt.length)

    return NextResponse.json({
      enhancedPrompt,
      negativePrompt,
      designBrief: parsedResponse?.designBrief,
      originalPrompt: prompt,
    })
  } catch (error) {
    console.error("[Enhance Logo Prompt] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to enhance prompt",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
