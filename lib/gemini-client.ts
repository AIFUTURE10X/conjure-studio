/**
 * lib/gemini-client.ts
 * Unified Gemini API client with retry, backoff, and fallback handling
 */

import { GoogleGenAI } from "@google/genai"
import { getGeminiApiKey, getGeminiApiKeyNames } from "@/lib/gemini-api-key"

let client: GoogleGenAI | null = null

function getClient() {
  if (!client) {
    const apiKey = getGeminiApiKey()
    if (!apiKey) {
      throw new Error(`${getGeminiApiKeyNames()} environment variable is not set`)
    }
    client = new GoogleGenAI({ apiKey })
  }
  return client
}

export type ImageSize = "1K" | "2K" | "4K"
export type GenerationModel = "gemini-3.1-flash-image-preview" | "gemini-3-pro-image-preview" | "gemini-2.5-flash-image"

export interface GenerateImageOptions {
  prompt: string
  aspect_ratio?: string
  imageBase64?: string
  model?: string
  maxAttempts?: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Extract HTTP-like status code from a Gemini SDK error.
 * The SDK sometimes stringifies the API response into err.message, so we
 * fall back to parsing the message body when no .status / .code is present.
 */
function extractStatus(err: any): number | undefined {
  if (!err) return undefined
  if (typeof err.status === "number") return err.status
  if (typeof err.code === "number") return err.code
  if (typeof err?.error?.code === "number") return err.error.code

  const msg: string = err.message || ""
  try {
    const parsed = JSON.parse(msg)
    if (typeof parsed?.error?.code === "number") return parsed.error.code
  } catch {
    // not JSON — fall through to regex
  }
  const match = msg.match(/\b(408|425|429|500|502|503|504|529)\b/)
  return match ? parseInt(match[1], 10) : undefined
}

function isQuotaOrRateError(err: any): boolean {
  if (!err) return false
  const msg = err.message?.toLowerCase?.() || ""
  const status = extractStatus(err)
  return (
    status === 429 ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted") ||
    msg.includes("resource exhausted")
  )
}

function isOverloadedError(err: any): boolean {
  if (!err) return false
  const msg = err.message?.toLowerCase?.() || ""
  const status = extractStatus(err)
  return (
    status === 503 ||
    status === 502 ||
    status === 504 ||
    status === 529 ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("currently experiencing") ||
    msg.includes("overloaded") ||
    err.code === "UNAVAILABLE"
  )
}

function isRetryableError(err: any): boolean {
  if (!err) return false
  if (isQuotaOrRateError(err) || isOverloadedError(err)) return true
  const msg: string = err.message || ""
  return /ECONNRESET|ETIMEDOUT|ENETUNREACH|ECONNREFUSED|EAI_AGAIN/i.test(msg)
}

function friendlyError(err: any, model: string, imageSize: string): string {
  if (isOverloadedError(err)) {
    return `Gemini ${model} is currently overloaded${
      imageSize === "4K" ? " (4K generation is especially demand-sensitive)" : ""
    }. Please try again in a moment, lower the image size to 2K, or switch to a different model.`
  }
  if (isQuotaOrRateError(err)) {
    return "API quota exceeded for this Gemini model. Please wait a minute and try again, or check your quota at https://aistudio.google.com/app/apikey."
  }
  return err?.message || "Failed to generate image"
}

export type ReferenceMode = 'replicate' | 'inspire'

export async function generateImageWithRetry({
  prompt,
  aspectRatio = "1:1",
  referenceImage,
  referenceMode = "inspire",
  seed,
  model = "gemini-3.1-flash-image-preview",
  imageSize = "1K",
  disableSearch = false,
}: {
  prompt: string
  aspectRatio?: string
  referenceImage?: string
  referenceMode?: ReferenceMode
  seed?: number
  model?: GenerationModel
  imageSize?: ImageSize
  /** Disable Google Search grounding for creative generation (logos, art) */
  disableSearch?: boolean
}) {
  const maxAttempts = Number(process.env.GEMINI_MAX_ATTEMPTS || 4)
  const baseDelay = Number(process.env.GEMINI_RETRY_BASE_DELAY || 1500)
  // Demand spikes typically clear in a few seconds — start higher than rate-limit retries
  const overloadBaseDelay = Number(process.env.GEMINI_OVERLOAD_BASE_DELAY || 4000)
  // Cap any single backoff so retries don't compound into 30s+ waits on 4K overload
  const maxBackoff = Number(process.env.GEMINI_MAX_BACKOFF || 8000)
  let delay = baseDelay

  // Force 1K for older Gemini 2.5 Flash (doesn't support higher resolutions).
  // Gemini 3.1 Flash and 3 Pro support imageSize.
  const effectiveImageSize = model === "gemini-2.5-flash-image" ? "1K" : imageSize

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[v0 SERVER] Gemini attempt ${attempt}/${maxAttempts}`)
      console.log(`[v0 SERVER] Model: ${model}`)
      console.log(`[v0 SERVER] Aspect Ratio: ${aspectRatio}`)
      console.log(`[v0 SERVER] Image Size: ${effectiveImageSize}`)
      console.log(`[v0 SERVER] Has reference image: ${!!referenceImage}`)
      console.log(`[v0 SERVER] Seed: ${seed !== undefined ? seed : 'random'}`)

      const geminiClient = getClient()

      // Build content parts - for image-to-image, put the image FIRST with clear instructions
      const contentParts: any[] = []

      if (referenceImage) {
        // Image-to-image generation: put image first, then instruction
        contentParts.push({
          inlineData: {
            mimeType: "image/png",
            data: referenceImage,
          },
        })

        if (referenceMode === 'replicate') {
          // REPLICATE MODE: Generate an exact copy of the image
          contentParts.push({
            text: `Generate an EXACT replica of this image. Recreate every detail precisely - same subject, same colors, same composition, same style, same background. Do not add, remove, or change anything. Output should be visually identical to the input image.`
          })
          console.log(`[v0 SERVER] REPLICATE mode: generating exact copy`)
        } else {
          // INSPIRE MODE: Use as reference while incorporating user prompt
          contentParts.push({
            text: `Using the provided image as reference, generate a new image that maintains the same subject/object appearance. ${prompt}`
          })
          console.log(`[v0 SERVER] INSPIRE mode: using image as reference for prompt`)
        }
      } else {
        // Text-to-image: just the prompt
        contentParts.push({ text: prompt })
      }

      const imageConfig: any = {
        aspectRatio: aspectRatio,
      }

      // Add imageSize for models that support it
      if (model !== "gemini-2.5-flash-image") {
        imageConfig.imageSize = effectiveImageSize
      }

      const config: any = {
        // Use IMAGE-only response for better quality (no text reasoning to split attention)
        responseModalities: ["IMAGE"],
        imageConfig,
      }

      if (seed !== undefined) {
        config.seed = seed
      }

      // Add Google Search Grounding for newer models (disabled for creative generation like logos)
      // When disableSearch=true, model uses pure creative synthesis without web influence
      const tools = (model !== "gemini-2.5-flash-image" && !disableSearch)
        ? [{ googleSearch: {} }]
        : undefined

      // Type-only cast: `tools` at the top level is not in the SDK's param
      // type, but the request structure is pinned by
      // WORKING_CONFIG_DO_NOT_MODIFY.md and must not change.
      const generateContentParams = {
        model: model,
        contents: contentParts,
        config,
        tools,
      }
      const response = await geminiClient.models.generateContent(
        generateContentParams as Parameters<typeof geminiClient.models.generateContent>[0],
      )

      console.log(`[v0 SERVER] API response received`)
      console.log(`[v0 SERVER] Response object keys:`, Object.keys(response))

      // Check if Google Search grounding was used
      const groundingMetadata = (response.candidates?.[0] as any)?.groundingMetadata
      if (groundingMetadata) {
        console.log(`[v0 SERVER] Google Search grounding WAS USED`)
        console.log(`[v0 SERVER] Search queries:`, groundingMetadata.webSearchQueries)
        console.log(`[v0 SERVER] Grounding chunks:`, groundingMetadata.groundingChunks?.length || 0)
      } else {
        console.log(`[v0 SERVER] Google Search grounding was NOT used (model used its own knowledge)`)
      }

      let imageBase64 = null

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageBase64 = part.inlineData.data
            console.log("[v0 SERVER] Found image in part.inlineData.data")
            break
          }
          if ((part as any).inline_data?.data) {
            imageBase64 = (part as any).inline_data.data
            console.log("[v0 SERVER] Found image in part.inline_data.data")
            break
          }
        }
      }

      if (!imageBase64 && (response as any).response?.candidates?.[0]?.content?.parts) {
        for (const part of (response as any).response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageBase64 = part.inlineData.data
            console.log("[v0 SERVER] Found image in response.response.candidates")
            break
          }
          if (part.inline_data?.data) {
            imageBase64 = part.inline_data.data
            console.log("[v0 SERVER] Found image in response.response.candidates (snake_case)")
            break
          }
        }
      }

      if (!imageBase64) {
        console.error(`[v0 SERVER] Response structure:`, JSON.stringify(response, null, 2).substring(0, 1000))
        throw new Error("No image data returned from Gemini API")
      }

      console.log("[v0 SERVER] Image generation successful, base64 length:", imageBase64.length)
      return {
        success: true,
        imageBase64,
        seed, // Return the seed that was used (undefined if random)
      }
    } catch (err: any) {
      console.error(`[v0 SERVER] Attempt ${attempt} error:`, err.message)

      if (err.response) {
        console.error(`[v0 SERVER] Error response:`, JSON.stringify(err.response, null, 2).substring(0, 500))
      }

      if (isRetryableError(err) && attempt < maxAttempts) {
        // Overload (503/UNAVAILABLE) needs longer waits than rate limits — and grows with attempts
        const isOverload = isOverloadedError(err)
        const waitMs = isOverload
          ? Math.min(maxBackoff, overloadBaseDelay * Math.pow(2, attempt - 1))
          : Math.min(maxBackoff, delay)
        console.warn(
          `[v0 SERVER] ${isOverload ? "Overloaded (503)" : "Retryable"} error, retrying after ${waitMs}ms`,
        )
        await sleep(waitMs)
        delay = Math.min(maxBackoff, delay * 2)
        continue
      }

      // Non-retryable, or out of attempts
      return {
        success: false,
        error: friendlyError(err, model, effectiveImageSize),
      }
    }
  }

  return {
    success: false,
    error: "Failed after max retry attempts. Gemini may be overloaded — please try again.",
  }
}
