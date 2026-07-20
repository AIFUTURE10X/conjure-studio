import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { apiError, parseJson } from "@/lib/api/http"
import { urlOrDataUriSchema } from "@/lib/validation/common"
import {
  generateOpenAIVisionText,
  isOpenAIAuthError,
  isOpenAIRateLimitError,
} from "@/lib/openai-text-client"

/**
 * Suggest a motion-only prompt for image-to-video from a start frame.
 * Powers the auto-fill on "Animate" and the manual "Suggest motion" button.
 */

const MAX_IMAGE_BYTES = 12 * 1024 * 1024

const bodySchema = z.object({
  imageUrl: urlOrDataUriSchema,
  intensity: z.enum(["low", "high"]).optional(),
})

const MOTION_DIRECTOR_PROMPT = (intensity: "low" | "high" | undefined) => `You are a film director writing motion prompts for an image-to-video AI model.
Look at the image and write ONE motion prompt describing how this exact scene should come alive: one camera movement plus natural subject/environment motion.

Rules:
- Describe MOTION only — do not re-describe static scene details the model can already see.
- ${intensity === "high"
    ? "Use bold, dynamic motion: fast camera moves, energetic subject action."
    : intensity === "low"
      ? "Use subtle, restrained motion: slow camera drift, gentle ambient movement."
      : "Pick a motion level that suits the scene — cinematic but believable."}
- 1-2 sentences, under 45 words total.
- Concrete and cinematic (e.g. "slow push-in as steam rises and she turns toward the window").
- Output the prompt text only: no quotes, no preamble, no lists.`

async function imageUrlToBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:([^;,]+);base64,(.+)$/)
    if (!match) throw new Error("Unsupported data URL format")
    return { mimeType: match[1], base64: match[2] }
  }
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error(`Could not fetch image (${response.status})`)
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength > MAX_IMAGE_BYTES) throw new Error("Image is too large")
  const mimeType = response.headers.get("content-type")?.split(";")[0] || "image/png"
  return { mimeType, base64: Buffer.from(buffer).toString("base64") }
}

export async function POST(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.transform)
  if (rateLimited) return rateLimited

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response

  try {
    const { base64, mimeType } = await imageUrlToBase64(parsed.data.imageUrl)
    const raw = await generateOpenAIVisionText({
      prompt: MOTION_DIRECTOR_PROMPT(parsed.data.intensity),
      imageBase64: base64,
      mimeType,
      options: { maxOutputTokens: 1200 },
    })

    const motionPrompt = raw.trim().replace(/^["'\s]+|["'\s]+$/g, "")
    if (!motionPrompt) throw new Error("Empty suggestion returned")

    return NextResponse.json({ motionPrompt })
  } catch (error) {
    console.error("[motion-prompt] Failed:", error)
    if (isOpenAIRateLimitError(error)) {
      return apiError(429, "rate_limited", "The AI is busy — try again in a minute")
    }
    if (isOpenAIAuthError(error)) {
      return apiError(500, "provider_auth", "OpenAI API key is missing or invalid")
    }
    return apiError(500, "suggestion_failed", error instanceof Error ? error.message : "Could not suggest a motion prompt")
  }
}
