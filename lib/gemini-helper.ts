import { GoogleGenAI } from "@google/genai"

interface RetryConfig {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
}

interface GenerateImageOptions {
  prompt: string
  count?: number
  aspectRatio?: string
  referenceImage?: string
  retryConfig?: RetryConfig
}

interface GenerateImageResult {
  images: string[]
  attempts: number
  totalDelay: number
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1500,
  maxDelay: 10000,
  backoffMultiplier: 2,
}

/**
 * Checks if an error is a quota/rate limit error
 */
function isQuotaError(error: any): boolean {
  const errorMessage = error.message?.toLowerCase() || ""
  const errorCode = error.status || error.code

  return (
    errorMessage.includes("quota") ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("429") ||
    errorCode === 429 ||
    errorCode === "RESOURCE_EXHAUSTED"
  )
}

/**
 * Checks if an error is retryable
 */
function isRetryableError(error: any): boolean {
  // Retry on quota errors and network errors
  return (
    isQuotaError(error) ||
    error.message?.includes("ECONNRESET") ||
    error.message?.includes("ETIMEDOUT") ||
    error.status === 503 || // Service unavailable
    error.code === "UNAVAILABLE"
  )
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate images with Gemini API with automatic retry and exponential backoff
 */
export async function generateImageWithRetry(
  apiKey: string,
  options: GenerateImageOptions,
): Promise<GenerateImageResult> {
  const { prompt, count = 1, aspectRatio = "1:1", referenceImage, retryConfig = {} } = options

  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }

  const client = new GoogleGenAI({ apiKey })
  const model = "gemini-3.1-flash-image-preview"

  let currentDelay = config.initialDelay
  let totalDelay = 0
  let lastError: any

  // Build the full prompt
  let fullPrompt = prompt
  if (count > 1) {
    fullPrompt = `Generate ${count} different variations of this image: ${prompt}`
  }
  if (referenceImage) {
    fullPrompt = `${fullPrompt}\n\nStyle requirements: Maintain consistent art style, character design, and visual aesthetic. Use the reference image as style guidance.`
  }

  console.log(`[v0] Starting image generation with retry (max ${config.maxAttempts} attempts)`)

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(`[v0] Attempt ${attempt}/${config.maxAttempts}`)

      const response = await client.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          responseModalities: ["Image"],
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      })

      // Success! Extract images
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No image candidates returned from API")
      }

      const images: string[] = []

      for (const candidate of response.candidates) {
        if (!candidate.content?.parts) continue

        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType?.startsWith("image/")) {
            const base64Data = part.inlineData.data
            const mimeType = part.inlineData.mimeType
            const dataUrl = `data:${mimeType};base64,${base64Data}`
            images.push(dataUrl)
          }
        }
      }

      if (images.length === 0) {
        throw new Error("No images were generated")
      }

      console.log(`[v0] Success! Generated ${images.length} image(s) after ${attempt} attempt(s)`)

      return {
        images,
        attempts: attempt,
        totalDelay,
      }
    } catch (error: any) {
      lastError = error
      console.error(`[v0] Attempt ${attempt} failed:`, error.message)

      // Check if we should retry
      if (attempt < config.maxAttempts && isRetryableError(error)) {
        const delayMs = Math.min(currentDelay, config.maxDelay)

        if (isQuotaError(error)) {
          console.log(`[v0] Quota error detected. Waiting ${delayMs}ms before retry...`)
        } else {
          console.log(`[v0] Retryable error. Waiting ${delayMs}ms before retry...`)
        }

        await sleep(delayMs)
        totalDelay += delayMs
        currentDelay *= config.backoffMultiplier
      } else {
        // Non-retryable error or max attempts reached
        console.error(`[v0] Giving up after ${attempt} attempt(s)`)
        throw error
      }
    }
  }

  // Should never reach here, but just in case
  throw lastError || new Error("Failed after all retry attempts")
}

/**
 * Format error message for client consumption
 */
export function formatGeminiError(error: any): { message: string; statusCode: number } {
  let message = "Failed to generate images"
  let statusCode = 500

  if (error.message?.includes("safety") || error.message?.includes("blocked")) {
    message = "Image generation was blocked by safety filters. Please try a different prompt."
    statusCode = 400
  } else if (isQuotaError(error)) {
    message =
      "API quota exceeded. Your Gemini API key has reached its rate limit. Please wait a few minutes and try again, or check your quota at https://aistudio.google.com/app/apikey"
    statusCode = 429
  } else if (error.message?.includes("404") || error.status === 404) {
    message =
      "Model not found. The model (gemini-3.1-flash-image-preview) may not be available for your API key yet."
    statusCode = 404
  } else if (error.message?.includes("401") || error.status === 401) {
    message = "Invalid API key. Please check your GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable."
    statusCode = 401
  } else if (error.message?.includes("403") || error.status === 403) {
    message = "Access forbidden. Your API key may not have permission to use this model."
    statusCode = 403
  } else if (error.message) {
    message = error.message
  }

  return { message, statusCode }
}
