import { type NextRequest, NextResponse } from "next/server"
import { generateImageWithRetry, type ImageSize, type GenerationModel } from "@/lib/gemini-client"
import { generateOpenAIImage, type OpenAIImageQuality } from "@/lib/openai-image-client"
import { upscaleBase64WithSharp } from "@/lib/sharp-upscaler"

export const runtime = "nodejs"
export const maxDuration = 300

type AllowedRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3" | "21:9" | "5:4" | "4:5"
type OpenAIImageModel = "gpt-image-2"
type AppGenerationModel = GenerationModel | OpenAIImageModel

function normalizeAspectRatio(input: string): AllowedRatio {
  const allowed = new Set<AllowedRatio>(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "5:4", "4:5"])
  const trimmed = input.replace(/\s+/g, "") as AllowedRatio
  if (!allowed.has(trimmed)) {
    throw new Error(`Unsupported aspect ratio: ${input}`)
  }
  return trimmed
}

function normalizeImageSize(input: string | null): ImageSize {
  const allowed = new Set<ImageSize>(["1K", "2K", "4K"])
  const normalized = (input?.toUpperCase() || "1K") as ImageSize
  if (!allowed.has(normalized)) {
    return "1K"
  }
  return normalized
}

function normalizeImageQuality(input: string | null): OpenAIImageQuality {
  return input === "low" ? "low" : "auto"
}

function normalizeModel(input: string | null): AppGenerationModel {
  // Support old model names for backwards compatibility with saved presets
  const migrations: Record<string, AppGenerationModel> = {
    'gemini-2.5-flash-preview-image': 'gemini-3.1-flash-image-preview',
    'gemini-2.5-flash-image': 'gemini-3.1-flash-image-preview',
    'gemini-2.0-flash-exp': 'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image': 'gemini-3-pro-image-preview',
    'chatgpt-image-generator-2': 'gpt-image-2',
    'chatgpt-image-latest': 'gpt-image-2',
  }
  const migrated = input ? (migrations[input] || input) : null

  const allowed: AppGenerationModel[] = ["gemini-3.1-flash-image-preview", "gemini-3-pro-image-preview", "gemini-2.5-flash-image", "gpt-image-2"]
  if (migrated && allowed.includes(migrated as AppGenerationModel)) {
    return migrated as AppGenerationModel
  }
  return "gemini-3.1-flash-image-preview"
}

function isOpenAIImageModel(model: AppGenerationModel): model is OpenAIImageModel {
  return model === "gpt-image-2"
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const prompt = formData.get('prompt') as string
    const count = parseInt(formData.get('count') as string) || 1
    const rawAspectRatio = (formData.get('aspectRatio') as string) || "1:1"
    const referenceImageFile = formData.get('referenceImage') as File | null
    const referenceMode = (formData.get('referenceMode') as string) || 'inspire'
    const seedParam = formData.get('seed') as string | null
    const seed = seedParam ? parseInt(seedParam) : undefined
    const model = normalizeModel(formData.get('model') as string | null)
    const requestedImageSize = normalizeImageSize(formData.get('imageSize') as string | null)
    const imageSize = model === "gemini-2.5-flash-image" ? "1K" : requestedImageSize
    const imageQuality = normalizeImageQuality(formData.get('imageQuality') as string | null)

    // Convert File to base64 if present
    let referenceImage: string | undefined
    if (referenceImageFile && referenceImageFile.size > 0) {
      const arrayBuffer = await referenceImageFile.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      referenceImage = base64
    }

    console.log("[v0 SERVER] Generate request:", {
      prompt: prompt?.substring(0, 100),
      count,
      aspectRatio: rawAspectRatio,
      model,
      imageSize,
      imageQuality,
      hasRef: !!referenceImage,
      referenceMode,
      seed,
    })

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const aspectRatio = normalizeAspectRatio(rawAspectRatio)

    const tasks = Array.from({ length: count }, async (_, i) => {
      if (isOpenAIImageModel(model)) {
        try {
          const result = await generateOpenAIImage({
            prompt,
            aspectRatio,
            imageSize,
            imageQuality,
            referenceImageFile,
          })
          console.log(`[v0 SERVER] OpenAI image ${i + 1}/${count} generated successfully`, { size: result.size })
          return { ok: true as const, dataUrl: `data:image/png;base64,${result.imageBase64}` }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to generate image with OpenAI"
          console.error(`[v0 SERVER] OpenAI image ${i + 1}/${count} failed:`, message)
          return { ok: false as const, error: message }
        }
      }

      return generateImageWithRetry({
        prompt,
        aspectRatio,
        referenceImage,
        referenceMode: referenceMode as 'replicate' | 'inspire',
        seed,
        model,
        imageSize,
        disableSearch: true,
      }).then((result) => {
        if (result.success && result.imageBase64) {
          console.log(`[v0 SERVER] Image ${i + 1}/${count} generated successfully`)
          return { ok: true as const, dataUrl: `data:image/png;base64,${result.imageBase64}` }
        }
        console.error(`[v0 SERVER] Image ${i + 1}/${count} failed:`, result.error)
        return { ok: false as const, error: result.error || "Failed to generate image" }
      })
    })

    const settled = await Promise.all(tasks)
    const images = settled.flatMap((r) => (r.ok ? [r.dataUrl] : []))

    // Auto-fallback: Gemini 3 Pro at 4K is often overloaded. When every attempt
    // failed due to overload, recover transparently via Flash 2K + local Sharp upscale.
    let fallback: { used: true; reason: string } | undefined
    const allFailedWithOverload =
      settled.length > 0 &&
      settled.every((r) => !r.ok && /overload|high demand|unavailable|503/i.test(r.error))
    if (
      images.length === 0 &&
      allFailedWithOverload &&
      model === "gemini-3-pro-image-preview" &&
      imageSize === "4K"
    ) {
      console.log("[v0 SERVER] Pro 4K overloaded - falling back to Flash 2K + Sharp upscale")
      try {
        const flash = await generateImageWithRetry({
          prompt,
          aspectRatio,
          referenceImage,
          referenceMode: referenceMode as 'replicate' | 'inspire',
          seed,
          model: "gemini-3.1-flash-image-preview",
          imageSize: "2K",
          disableSearch: true,
        })
        if (flash.success && flash.imageBase64) {
          const upscaled = await upscaleBase64WithSharp(flash.imageBase64, 4096, { sharpen: true })
          images.push(`data:image/png;base64,${upscaled}`)
          fallback = {
            used: true,
            reason: "Gemini 3 Pro was overloaded - used Flash 2K + local upscale to deliver 4K.",
          }
          console.log("[v0 SERVER] Fallback succeeded")
        }
      } catch (fbErr) {
        console.error("[v0 SERVER] Fallback failed:", fbErr)
      }
    }

    if (images.length === 0) {
      const firstError = settled.find((r) => !r.ok)
      const message = firstError && !firstError.ok ? firstError.error : "Failed to generate image"
      return NextResponse.json({ error: message }, { status: 500 })
    }

    console.log(`[v0 SERVER] Success: ${images.length}/${count} images generated${fallback ? " (via fallback)" : ""}`)
    return NextResponse.json({ images, fallback })
  } catch (error) {
    console.error("[v0 SERVER] Route error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 },
    )
  }
}
