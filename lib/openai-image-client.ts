import type { ImageSize } from "@/lib/gemini-client"

type AllowedRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3" | "21:9" | "5:4" | "4:5"
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

export async function generateOpenAIImage({
  prompt,
  aspectRatio,
  imageSize,
  imageQuality,
  referenceImageFile,
  maskImageFile,
  n,
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
}) {
  const size = getOpenAIImageSize(aspectRatio, imageSize)
  const apiKey = getOpenAIKey()

  if (referenceImageFile && referenceImageFile.size > 0) {
    const buildFormData = (includeModeration: boolean) => {
      const formData = new FormData()
      formData.append("model", "gpt-image-2")
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
      fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      })

    let response = await postEdit(buildFormData(true))
    let body = await response.text()
    if (!response.ok && /moderation/i.test(body) && /unknown|unrecognized|unsupported|invalid/i.test(body)) {
      response = await postEdit(buildFormData(false))
      body = await response.text()
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
    return { imageBase64: imagesBase64[0], imagesBase64, size }
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt,
      n: 1,
      size,
      quality: imageQuality,
      output_format: "png",
    }),
  })

  const body = await response.text()
  if (!response.ok) {
    throw new Error(formatOpenAIError(response.status, body))
  }

  const data = JSON.parse(body)
  const imageBase64 = data?.data?.[0]?.b64_json
  if (!imageBase64) {
    throw new Error("No image data returned from OpenAI API")
  }

  return { imageBase64, imagesBase64: [imageBase64], size }
}
