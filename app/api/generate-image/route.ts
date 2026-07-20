import { type NextRequest, NextResponse } from "next/server"
import { withCreditGuard, imageFormCost } from '@/lib/api/guard'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from "zod"
import { generateImageWithRetry, type GenerationModel } from "@/lib/gemini-client"
import { generateOpenAIImage } from "@/lib/openai-image-client"
import { upscaleBase64WithSharp } from "@/lib/sharp-upscaler"
import { parseFormData, parseFormFields } from "@/lib/api/http"
import { aspectRatioSchema, imageModelSchema, imageSizeSchema } from "@/lib/validation/common"

export const runtime = "nodejs"
export const maxDuration = 300

type OpenAIImageModel = "gpt-image-2"
type AppGenerationModel = GenerationModel | OpenAIImageModel

// Old model names from saved presets migrate forward; unknown values fall
// back to the default model (matching the old lenient normalizer).
const MODEL_MIGRATIONS: Record<string, string> = {
  'gemini-2.5-flash-preview-image': 'gemini-3.1-flash-image-preview',
  'gemini-2.5-flash-image': 'gemini-3.1-flash-image-preview',
  'gemini-2.0-flash-exp': 'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image': 'gemini-3-pro-image-preview',
  'chatgpt-image-generator-2': 'gpt-image-2',
  'chatgpt-image-latest': 'gpt-image-2',
}

const lenientModelSchema = z.preprocess((value) => {
  if (typeof value !== 'string' || !value) return 'gpt-image-2'
  const migrated = MODEL_MIGRATIONS[value] || value
  return imageModelSchema.options.includes(migrated as never) ? migrated : 'gpt-image-2'
}, imageModelSchema)

const lenientImageSizeSchema = z.preprocess((value) => {
  if (typeof value !== 'string' || !value) return '1K'
  const upper = value.toUpperCase()
  return imageSizeSchema.options.includes(upper as never) ? upper : '1K'
}, imageSizeSchema)

const formSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required').max(20_000),
  count: z.coerce.number().int().min(1).max(4).default(1),
  aspectRatio: z.preprocess(
    (value) => (typeof value === 'string' && value ? value.replace(/\s+/g, '') : '1:1'),
    aspectRatioSchema,
  ),
  referenceMode: z.enum(['inspire', 'replicate']).default('inspire'),
  seed: z.coerce.number().int().optional(),
  model: lenientModelSchema.default('gpt-image-2'),
  imageSize: lenientImageSizeSchema.default('1K'),
  imageQuality: z.enum(['low', 'medium', 'high', 'auto']).default('medium'),
})

function isOpenAIImageModel(model: AppGenerationModel): model is OpenAIImageModel {
  return model === "gpt-image-2"
}

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.generation)
  if (rateLimited) return rateLimited

  const parsedForm = await parseFormData(request)
  if (parsedForm.response) return parsedForm.response
  const formData = parsedForm.data

  const parsedFields = parseFormFields(formData, formSchema)
  if (parsedFields.response) return parsedFields.response
  const { prompt, count, aspectRatio, referenceMode, seed, model, imageQuality } = parsedFields.data
  const imageSize = model === "gemini-2.5-flash-image" ? "1K" : parsedFields.data.imageSize

  try {
    const referenceImageFile = formData.get('referenceImage') as File | null
    const maskImageFile = formData.get('maskImage') as File | null

    // Convert File to base64 if present
    let referenceImage: string | undefined
    if (referenceImageFile && referenceImageFile.size > 0) {
      const arrayBuffer = await referenceImageFile.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      referenceImage = base64
    }

    console.log("[v0 SERVER] Generate request:", {
      prompt: prompt.substring(0, 100),
      count,
      aspectRatio,
      model,
      imageSize,
      imageQuality,
      hasRef: !!referenceImage,
      referenceMode,
      seed,
    })

    const tasks = Array.from({ length: count }, async (_, i) => {
      if (isOpenAIImageModel(model)) {
        try {
          const result = await generateOpenAIImage({
            prompt,
            aspectRatio,
            imageSize,
            imageQuality,
            referenceImageFile,
            maskImageFile,
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

export const POST = withCreditGuard('image_generation', imageFormCost, handlePost)
