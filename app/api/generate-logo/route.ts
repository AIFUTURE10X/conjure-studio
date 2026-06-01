import { type NextRequest, NextResponse } from "next/server"
import { generateImageWithRetry, type GenerationModel } from "@/lib/gemini-client"
import { generateOpenAIImage, type OpenAIImageQuality } from "@/lib/openai-image-client"
import { removeBackground, type BackgroundRemovalMethod } from "@/lib/background-removal"

export const runtime = "nodejs"
export const maxDuration = 300
import { removeBackgroundCloud, removeBackgroundPixian } from "@/lib/cloud-bg-removal"
import { removeBackgroundWithReplicate, type ReplicateBgModel } from "@/lib/replicate-bg-removal"
import { removeBackgroundWithPixelcut } from "@/lib/pixelcut-bg-removal"
import { upscaleWithRealESRGAN, isReplicateAvailable } from "@/lib/replicate-upscaler"
import { buildFreeFormLogoPrompt, buildLogoPrompt } from "./logo-prompts"
import sharp from 'sharp'

type LogoGenerationModel = GenerationModel | 'gpt-image-2'
type LogoGenerationResult = {
  success: boolean
  imageBase64?: string
  error?: string
  seed?: number
}

function normalizeModel(input: string | null): LogoGenerationModel {
  const migrations: Record<string, LogoGenerationModel> = {
    'gemini-2.5-flash-preview-image': 'gemini-3.1-flash-image-preview',
    'gemini-2.5-flash-image': 'gemini-3.1-flash-image-preview',
    'gemini-2.0-flash-exp': 'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image': 'gemini-3-pro-image-preview',
    'chatgpt-image-generator-2': 'gpt-image-2',
    'chatgpt-image-latest': 'gpt-image-2',
  }
  const migrated = input ? (migrations[input] || input) : null
  const allowed: LogoGenerationModel[] = ['gemini-3.1-flash-image-preview', 'gemini-3-pro-image-preview', 'gpt-image-2']
  if (migrated && allowed.includes(migrated as LogoGenerationModel)) {
    return migrated as LogoGenerationModel
  }
  return 'gemini-3.1-flash-image-preview'
}

function isOpenAIImageModel(model: LogoGenerationModel): model is 'gpt-image-2' {
  return model === 'gpt-image-2'
}

function normalizeImageQuality(input: string | null): OpenAIImageQuality {
  return input === 'low' ? 'low' : 'auto'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const prompt = formData.get('prompt') as string
    const negativePrompt = formData.get('negativePrompt') as string | null
    const style = (formData.get('style') as string) || 'modern+3d-metallic'
    const modelParam = formData.get('model') as string | null
    const referenceImageFile = formData.get('referenceImage') as File | null
    const bgRemovalMethod = (formData.get('bgRemovalMethod') as BackgroundRemovalMethod) || 'auto'
    const cloudApiKey = formData.get('cloudApiKey') as string | null
    const resolutionParam = formData.get('resolution') as string | null
    const imageQuality = normalizeImageQuality(formData.get('imageQuality') as string | null)
    const seedParam = formData.get('seed') as string | null
    const seed = seedParam ? parseInt(seedParam, 10) : undefined
    // Skip background removal by default - user can remove it afterward
    const skipBgRemoval = formData.get('skipBgRemoval') !== 'false'

    // Validate and use resolution (default to 1K)
    const validResolutions = ['1K', '2K', '4K'] as const
    type ImageSize = typeof validResolutions[number]
    const resolution: ImageSize = validResolutions.includes(resolutionParam as ImageSize)
      ? (resolutionParam as ImageSize)
      : '1K'

    // Convert reference image to base64 if present
    let referenceImage: string | undefined
    if (referenceImageFile && referenceImageFile.size > 0) {
      const arrayBuffer = await referenceImageFile.arrayBuffer()
      referenceImage = Buffer.from(arrayBuffer).toString('base64')
    }

    console.log("[Logo API] Generate request:", {
      prompt: prompt?.substring(0, 100),
      negativePrompt: negativePrompt?.substring(0, 50),
      style,
      model: modelParam,
      bgRemovalMethod,
      skipBgRemoval,
      resolution,
      seed: seed !== undefined ? seed : 'random',
      hasReference: !!referenceImage,
    })

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Use free-form generation (no background constraints) when:
    // 1. Skipping BG removal (user will remove it later if needed)
    // 2. Using AI-based removal that can handle any background
    const useCloudRemoval = bgRemovalMethod === 'pixelcut' || bgRemovalMethod === 'replicate' || bgRemovalMethod === '851-labs' || ((bgRemovalMethod === 'pixian' || bgRemovalMethod === 'cloud') && cloudApiKey)
    const useFreeFormPrompt = skipBgRemoval || useCloudRemoval
    let enhancedPrompt = useFreeFormPrompt
      ? buildFreeFormLogoPrompt(prompt, style)
      : buildLogoPrompt(prompt, style)

    // Append negative prompt if provided
    if (negativePrompt?.trim()) {
      enhancedPrompt += `\n\nAVOID these elements in the design:\n${negativePrompt.trim()}`
    }

    console.log("[Logo API] Using free-form generation:", useCloudRemoval)
    console.log("[Logo API] Has negative prompt:", !!negativePrompt?.trim())
    console.log("[Logo API] Enhanced prompt:", enhancedPrompt.substring(0, 200) + "...")

    const model = normalizeModel(modelParam)

    // Generate the logo image. Gemini keeps seed support; OpenAI uses GPT Image 2.
    const result: LogoGenerationResult = isOpenAIImageModel(model)
      ? await generateOpenAIImage({
          prompt: enhancedPrompt,
          aspectRatio: "1:1",
          imageSize: resolution,
          imageQuality,
          referenceImageFile,
        })
          .then((openAIResult) => ({
            success: true,
            imageBase64: openAIResult.imageBase64,
          }))
          .catch((error) => ({
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate logo with ChatGPT Images 2.0",
          }))
      : await generateImageWithRetry({
          prompt: enhancedPrompt,
          aspectRatio: "1:1", // Logos are typically square
          model,
          imageSize: resolution, // Gemini 3 Pro natively supports 1K, 2K, 4K
          referenceImage,
          seed, // Pass seed for reproducible generation
          disableSearch: true, // Critical for original creative logo generation
        })

    if (!result.success || !result.imageBase64) {
      console.error("[Logo API] Generation failed:", result.error)
      return NextResponse.json(
        { error: result.error || "Failed to generate logo" },
        { status: 500 }
      )
    }

    // Conditionally remove background (skipped by default)
    let processedBase64: string = result.imageBase64

    if (!skipBgRemoval) {
      console.log(`[Logo API] Removing background with method: ${bgRemovalMethod}...`)

      // Remove background based on selected method
      if (bgRemovalMethod === 'pixelcut') {
        // Use Pixelcut API - optimized for logos with text preservation
        processedBase64 = await removeBackgroundWithPixelcut(result.imageBase64)
      } else if (bgRemovalMethod === 'replicate') {
        // Use Replicate AI (BRIA) - works on any background color with 256 levels of transparency
        processedBase64 = await removeBackgroundWithReplicate(result.imageBase64, 'bria')
      } else if (bgRemovalMethod === '851-labs') {
        // Use 851-labs/background-remover - very cheap, good threshold control
        processedBase64 = await removeBackgroundWithReplicate(result.imageBase64, '851-labs')
      } else if (bgRemovalMethod === 'pixian' && cloudApiKey) {
        // Use Pixian.ai API
        processedBase64 = await removeBackgroundPixian(result.imageBase64, cloudApiKey)
      } else if (bgRemovalMethod === 'cloud' && cloudApiKey) {
        // Use remove.bg cloud API
        processedBase64 = await removeBackgroundCloud(result.imageBase64, {
          apiKey: cloudApiKey
        })
      } else {
        // Use local methods (auto, simple, chromakey)
        processedBase64 = await removeBackground(result.imageBase64, {
          method: bgRemovalMethod,
          tolerance: 12, // Lower tolerance preserves design elements, only removes pure white background
          edgeSmoothing: true,
        })
      }

      console.log("[Logo API] Background removed successfully")
    } else {
      console.log("[Logo API] Skipping background removal (will be done later if needed)")
    }

    // Note: Gemini 3 Pro now generates at native resolution (1K/2K/4K)
    // This upscaling code is kept as a fallback in case the native generation doesn't produce expected size
    let finalBase64 = processedBase64
    if (resolution !== '1K') {
      // Check if we actually got a higher resolution image from Gemini
      // If so, skip upscaling. Otherwise, upscale as fallback.
      const checkBuffer = Buffer.from(processedBase64, 'base64')
      const checkMetadata = await sharp(checkBuffer).metadata()
      const currentSize = Math.max(checkMetadata.width || 0, checkMetadata.height || 0)
      const targetSize = resolution === '4K' ? 4096 : 2048

      console.log(`[Logo API] Current image size: ${checkMetadata.width}x${checkMetadata.height}`)
      console.log(`[Logo API] Target size for ${resolution}: ${targetSize}`)

      // Only upscale if the image is significantly smaller than target (less than 90%)
      if (currentSize < targetSize * 0.9) {
        console.log(`[Logo API] Image smaller than target, upscaling as fallback...`)
        console.log(`[Logo API] Replicate available: ${isReplicateAvailable()}`)

        try {
          const aiScale = resolution === '4K' ? 4 : 2

          // Try AI upscaling if available
          if (isReplicateAvailable()) {
            console.log(`[Logo API] Using AI upscaling (Real-ESRGAN ${aiScale}x)...`)
            finalBase64 = await upscaleWithRealESRGAN(processedBase64, aiScale as 2 | 4)
            console.log("[Logo API] AI upscale complete")
          } else {
            // Fallback to Sharp upscaling with enhanced sharpening
            console.log("[Logo API] Using Sharp upscaling (Replicate not available)...")
            const originalWidth = checkMetadata.width || 1024
            const originalHeight = checkMetadata.height || 1024
            const maxOriginalDim = Math.max(originalWidth, originalHeight)
            const scale = targetSize / maxOriginalDim
            const newWidth = Math.round(originalWidth * scale)
            const newHeight = Math.round(originalHeight * scale)

            // Use lanczos3 with sharpening to improve quality
            const upscaledBuffer = await sharp(checkBuffer)
              .resize(newWidth, newHeight, {
                kernel: 'lanczos3',
                fit: 'fill',
              })
              .sharpen({ sigma: 1.0 }) // Add sharpening to improve clarity
              .png({ quality: 100 })
              .toBuffer()

            finalBase64 = upscaledBuffer.toString('base64')
            console.log(`[Logo API] Sharp upscale complete: ${newWidth}x${newHeight}`)
          }
        } catch (upscaleError) {
          console.error("[Logo API] Upscale failed, using original:", upscaleError)
          // Continue with original image if upscaling fails
        }
      } else {
        console.log(`[Logo API] Gemini generated at native ${resolution} resolution, no upscaling needed`)
      }
    }

    // Return as data URL
    const dataUrl = `data:image/png;base64,${finalBase64}`

    return NextResponse.json({
      success: true,
      image: dataUrl,
      style,
      bgRemovalMethod,
      resolution,
      seed: result.seed, // Return seed for reproducibility
    })
  } catch (error) {
    console.error("[Logo API] Route error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate logo" },
      { status: 500 }
    )
  }
}
