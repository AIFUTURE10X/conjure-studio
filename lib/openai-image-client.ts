import type { ImageSize } from "@/lib/gemini-client"
import { elapsedMs, recordProviderUsage } from "@/lib/costs/record"
import { defaultImageOutputTokens, type ProviderUsageUnits } from "@/lib/costs/provider-rates"

type AllowedRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3" | "21:9" | "5:4" | "4:5"
/** Wire model for every OpenAI image call. ChatGPT Images 2.5 Flare: same
 *  price per token as gpt-image-2, higher quality, ~50% lower latency. */
export const OPENAI_IMAGE_MODEL = 'gpt-image-2.5-flare'

export type OpenAIImageQuality = "low" | "medium" | "high" | "auto"
export type OpenAIImageBackground = "auto"

const RATIO_VALUES: Record<AllowedRatio, readonly [number, number]> = {
  "1:1": [1, 1],
  "16:9": [16, 9],
  "9:16": [9, 16],
  "4:3": [4, 3],
  "3:4": [3, 4],
  "3:2": [3, 2],
  "2:3": [2, 3],
  "21:9": [21, 9],
  "5:4": [5, 4],
  "4:5": [4, 5],
}

const MAX_EDGE = 3840
const MAX_PIXELS = 8_294_400
const LONG_EDGE_BY_SIZE: Record<ImageSize, number> = {
  "1K": 1536,
  "2K": 2048,
  "4K": 3840,
}

const roundToMultipleOf16 = (value: number) => Math.max(16, Math.round(value / 16) * 16)

export function getOpenAIImageSize(aspectRatio: AllowedRatio, imageSize: ImageSize): string {
  if (aspectRatio === "1:1") {
    const squareSize = imageSize === "4K" ? 2880 : imageSize === "2K" ? 2048 : 1024
    return `${squareSize}x${squareSize}`
  }

  const [ratioWidth, ratioHeight] = RATIO_VALUES[aspectRatio]
  let longEdge = LONG_EDGE_BY_SIZE[imageSize]
  let width = 1024
  let height = 1024

  do {
    if (ratioWidth >= ratioHeight) {
      width = roundToMultipleOf16(longEdge)
      height = roundToMultipleOf16(longEdge * (ratioHeight / ratioWidth))
    } else {
      height = roundToMultipleOf16(longEdge)
      width = roundToMultipleOf16(longEdge * (ratioWidth / ratioHeight))
    }
    longEdge -= 16
  } while ((width > MAX_EDGE || height > MAX_EDGE || width * height > MAX_PIXELS) && longEdge > 1024)

  return `${width}x${height}`
}

function getOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set")
  }
  return apiKey
}

function formatOpenAIError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body)
    return parsed?.error?.message || `OpenAI image generation failed (${status})`
  } catch {
    return body || `OpenAI image generation failed (${status})`
  }
}

interface OpenAIErrorBody {
  error?: { message?: string; param?: string; code?: string }
}

function parseOpenAIError(body: string): OpenAIErrorBody["error"] {
  try {
    return (JSON.parse(body) as OpenAIErrorBody)?.error
  } catch {
    return undefined
  }
}

/** Token usage OpenAI reports on every image response; recorded as the exact cost basis (issue #50). */
function parseOpenAIImageUsage(data: unknown): ProviderUsageUnits | null {
  const usage = (data as { usage?: Record<string, unknown> } | null)?.usage
  if (!usage || typeof usage !== "object") return null
  const details = (usage.input_tokens_details ?? {}) as Record<string, unknown>
  const outDetails = (usage.output_tokens_details ?? {}) as Record<string, unknown>
  const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0)
  return {
    text_tokens_in: num(details.text_tokens),
    image_tokens_in: num(details.image_tokens),
    // OpenAI reports one `cached_tokens` figure for image requests without
    // saying which modality it covers; it is treated as cached image input
    // ($2/1M), the higher of the two cached rates, so caching never under-prices.
    cached_image_tokens_in: num(details.cached_tokens),
    image_tokens_out: num(outDetails.image_tokens) || num(usage.output_tokens),
  }
}

/** Our own deadline elapsed after the request was sent — OpenAI may still complete and bill it. */
export class OpenAITimeoutError extends Error {
  constructor() {
    super("OpenAI request timed out")
    this.name = "OpenAITimeoutError"
  }
}

/** Every OpenAI image call goes through this so a hung request fails fast enough for the credit guard to refund it, instead of the route timing out first. */
async function fetchOpenAI(url: string, init: RequestInit, requestTimeoutMs: number): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(requestTimeoutMs) })
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new OpenAITimeoutError()
    }
    throw error
  }
}

async function generateOpenAIImageRaw({
  prompt,
  aspectRatio,
  imageSize,
  imageQuality,
  referenceImageFile,
  maskImageFile,
  n,
  exactSize,
  requestTimeoutMs = 100_000,
}: {
  prompt: string
  aspectRatio: AllowedRatio
  imageSize: ImageSize
  imageQuality: OpenAIImageQuality
  outputBackground?: OpenAIImageBackground
  referenceImageFile?: File | null
  /** PNG mask for inpainting — fully transparent areas mark what to edit. */
  maskImageFile?: File | null
  /** Number of variants to request (1-3 in practice; passed through as-is). */
  n?: number
  /** Exact "WxH" (edges divisible by 16, aspect 1:3-3:1) — overrides the imageSize bucket when set. */
  exactSize?: string
  /** Per-call timeout so long-running routes can use their available budget. */
  requestTimeoutMs?: number
}) {
  const size = exactSize ?? getOpenAIImageSize(aspectRatio, imageSize)
  const apiKey = getOpenAIKey()

  if (referenceImageFile && referenceImageFile.size > 0) {
    const buildFormData = (includeModeration: boolean) => {
      const formData = new FormData()
      formData.append("model", OPENAI_IMAGE_MODEL)
      formData.append("prompt", prompt)
      formData.append("size", size)
      formData.append("quality", imageQuality)
      formData.append("output_format", "png")
      formData.append("image[]", referenceImageFile, referenceImageFile.name || "reference.png")
      if (maskImageFile && maskImageFile.size > 0) {
        formData.append("mask", maskImageFile, maskImageFile.name || "mask.png")
      }
      if (n && n > 1) {
        formData.append("n", String(n))
      }
      // OpenAI's safety filter over-triggers on edits of images containing
      // realistic people; 'low' is the documented relaxation for creative
      // tools. Dropped on retry if the model rejects the parameter.
      if (includeModeration) {
        formData.append("moderation", "low")
      }
      return formData
    }

    const postEdit = (formData: FormData) =>
      fetchOpenAI("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      }, requestTimeoutMs)

    let response = await postEdit(buildFormData(true))
    let body = await response.text()
    if (!response.ok) {
      const err = parseOpenAIError(body)
      const isRealBlock =
        err?.code === "moderation_blocked" || /safety|content policy|moderation_blocked/i.test(err?.message ?? "")
      const isUnsupportedParam = err?.param === "moderation" || /unknown parameter/i.test(err?.message ?? "")
      // Only retry when OpenAI rejected the `moderation` param itself (e.g.
      // an account/model that doesn't support it) — never for an actual
      // safety block, which would otherwise get retried into a second,
      // fully-deterministic re-block.
      if (!isRealBlock && isUnsupportedParam) {
        response = await postEdit(buildFormData(false))
        body = await response.text()
      }
    }
    if (!response.ok) {
      throw new Error(formatOpenAIError(response.status, body))
    }

    const data = JSON.parse(body)
    const imagesBase64: string[] = (data?.data ?? [])
      .map((entry: { b64_json?: string }) => entry?.b64_json)
      .filter((value: string | undefined): value is string => Boolean(value))
    if (imagesBase64.length === 0) {
      throw new Error("No image data returned from OpenAI API")
    }
    return { imageBase64: imagesBase64[0], imagesBase64, size, usage: parseOpenAIImageUsage(data) }
  }

  const response = await fetchOpenAI("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt,
      n: 1,
      size,
      quality: imageQuality,
      output_format: "png",
    }),
  }, requestTimeoutMs)

  const body = await response.text()
  if (!response.ok) {
    throw new Error(formatOpenAIError(response.status, body))
  }

  const data = JSON.parse(body)
  const imageBase64 = data?.data?.[0]?.b64_json
  if (!imageBase64) {
    throw new Error("No image data returned from OpenAI API")
  }

  return { imageBase64, imagesBase64: [imageBase64], size, usage: parseOpenAIImageUsage(data) }
}

type GenerateOpenAIImageParams = Parameters<typeof generateOpenAIImageRaw>[0]

/**
 * Generate or edit an image and record the call in the provider usage ledger.
 * The provider's own token usage is the cost basis; a timeout after the
 * request was sent records the list-rate estimate for what was requested,
 * since OpenAI may still have completed and billed it.
 */
export async function generateOpenAIImage(params: GenerateOpenAIImageParams) {
  const startedAt = Date.now()
  const size = params.exactSize ?? getOpenAIImageSize(params.aspectRatio, params.imageSize)
  const isEdit = Boolean(params.referenceImageFile && params.referenceImageFile.size > 0)
  const requested: ProviderUsageUnits = {
    image_tokens_out: defaultImageOutputTokens(OPENAI_IMAGE_MODEL, params.imageQuality, size) * Math.max(1, params.n ?? 1),
    quality: params.imageQuality,
  }
  const base = { provider: "openai" as const, model: OPENAI_IMAGE_MODEL, operation: isEdit ? ("image-edit" as const) : ("image-generate" as const) }
  try {
    const result = await generateOpenAIImageRaw(params)
    void recordProviderUsage({ ...base, status: "succeeded", units: result.usage ?? requested, exact: Boolean(result.usage), latencyMs: elapsedMs(startedAt) })
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    void recordProviderUsage({ ...base, status: error instanceof OpenAITimeoutError ? "timeout" : "failed", units: requested, error: message, latencyMs: elapsedMs(startedAt) })
    throw error
  }
}
