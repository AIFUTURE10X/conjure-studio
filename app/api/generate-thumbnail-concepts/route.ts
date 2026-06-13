import { GoogleGenerativeAI } from "@google/generative-ai"
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getGeminiApiKey, getGeminiApiKeyNames } from "@/lib/gemini-api-key"
import { parseJson } from "@/lib/api/http"
import {
  THUMBNAIL_AI_STYLES,
  THUMBNAIL_TEMPLATES,
  type ThumbnailConcept,
} from "@/app/image-studio/components/Thumbnail/thumbnail-constants"

const templateIds = THUMBNAIL_TEMPLATES.map((t) => t.id)
const styleIds = THUMBNAIL_AI_STYLES.map((s) => s.id)
const HEX_RE = /^#[0-9a-fA-F]{6}$/

const bodySchema = z.object({ title: z.string().trim().min(1, "Title is required").max(300) })

const SYSTEM_PROMPT = `You are a YouTube thumbnail strategist who designs high click-through-rate thumbnails.
Given a video title, propose 3 distinct thumbnail concepts.

Return JSON ONLY in this exact shape:
{
  "concepts": [
    {
      "summary": "one short phrase describing the concept angle",
      "headline": "2 to 4 punchy words for the thumbnail (NOT the whole title)",
      "color": "#RRGGBB hex for the headline text, bold and high-contrast",
      "templateId": one of ${JSON.stringify(templateIds)},
      "styleId": one of ${JSON.stringify(styleIds)},
      "backgroundPrompt": "a vivid visual description of the BACKGROUND image only — no text, no words, leaving clear space for a face and the headline"
    }
  ]
}

Rules:
- Exactly 3 concepts, each visually different (different style and angle).
- Headlines must be short, bold, and curiosity- or emotion-driven; never repeat the whole title.
- backgroundPrompt must never request any text, letters, or captions.
- Output JSON only — no markdown, no code fences, no commentary.`

function parseConcepts(text: string): ThumbnailConcept[] {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return []
  let raw: unknown
  try {
    raw = JSON.parse(match[0])
  } catch {
    return []
  }
  const list = (raw as { concepts?: unknown }).concepts
  if (!Array.isArray(list)) return []

  return list
    .slice(0, 3)
    .map((item): ThumbnailConcept => {
      const c = (item ?? {}) as Record<string, unknown>
      const templateId =
        typeof c.templateId === "string" && templateIds.includes(c.templateId) ? c.templateId : templateIds[0]
      const styleId =
        typeof c.styleId === "string" && styleIds.includes(c.styleId) ? c.styleId : styleIds[0]
      const color = typeof c.color === "string" && HEX_RE.test(c.color.trim()) ? c.color.trim() : "#ffffff"
      return {
        summary: typeof c.summary === "string" ? c.summary.trim().slice(0, 120) : "",
        headline: typeof c.headline === "string" ? c.headline.trim().slice(0, 60) : "",
        color,
        templateId,
        styleId,
        backgroundPrompt: typeof c.backgroundPrompt === "string" ? c.backgroundPrompt.trim().slice(0, 600) : "",
      }
    })
    .filter((c) => c.headline && c.backgroundPrompt)
}

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.transform)
  if (rateLimited) return rateLimited

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response
  const { title } = parsed.data

  try {
    const apiKey = getGeminiApiKey()
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured", details: `${getGeminiApiKeyNames()} environment variable is not set` },
        { status: 500 },
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nVideo title: "${title}"\n\nConcepts JSON:`)
    const concepts = parseConcepts(result.response.text().trim())

    if (concepts.length === 0) {
      return NextResponse.json({ error: "Could not generate concepts — try a different title" }, { status: 502 })
    }
    return NextResponse.json({ concepts })
  } catch (error) {
    console.error("[Thumbnail Concepts] Error:", error)
    return NextResponse.json(
      { error: "Failed to generate concepts", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
