import { type NextRequest, NextResponse } from "next/server"
import { withCreditGuard, flatCost } from '@/lib/api/guard'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import sharp from 'sharp'
import { upscaleWithRealESRGAN, isReplicateAvailable } from "@/lib/replicate-upscaler"
import { upscaleBase64WithSharp } from "@/lib/sharp-upscaler"

export const runtime = "nodejs"
export const maxDuration = 120

// Target resolutions
const RESOLUTIONS = {
  '2K': 2048,
  '4K': 4096,
} as const

type TargetResolution = keyof typeof RESOLUTIONS
type UpscaleMethod = 'ai' | 'fast'

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.transform)
  if (rateLimited) return rateLimited

  try {
    const formData = await request.formData()
    const imageBase64 = formData.get('imageBase64') as string | null
    const targetResolution = (formData.get('targetResolution') as TargetResolution) || '2K'
    const method = (formData.get('method') as UpscaleMethod) || 'fast'

    const useAI = method === 'ai' && isReplicateAvailable()

    console.log("[Upscale API] Request received:", {
      hasImage: !!imageBase64,
      targetResolution,
      method,
      useAI,
    })

    if (!imageBase64) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    // Extract base64 data (remove data URL prefix if present)
    const base64Data = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64

    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Get original image dimensions
    const metadata = await sharp(imageBuffer).metadata()
    const originalWidth = metadata.width || 1024
    const originalHeight = metadata.height || 1024

    console.log("[Upscale API] Original dimensions:", { originalWidth, originalHeight })

    // Calculate target dimensions and scale
    const targetSize = RESOLUTIONS[targetResolution]
    const maxOriginalDim = Math.max(originalWidth, originalHeight)

    // Only upscale - never downscale
    if (maxOriginalDim >= targetSize) {
      console.log("[Upscale API] Image already at or above target resolution, skipping upscale")
      return NextResponse.json({
        success: true,
        image: `data:image/png;base64,${base64Data}`,
        originalDimensions: { width: originalWidth, height: originalHeight },
        newDimensions: { width: originalWidth, height: originalHeight },
        targetResolution,
        method: 'none',
        message: `Image already at ${maxOriginalDim}px (target: ${targetSize}px). No upscaling needed.`
      })
    }

    // Determine the scale factor for AI upscaling (2x or 4x)
    const aiScale = targetResolution === '4K' ? 4 : 2

    let upscaledBase64: string
    let actualMethod: string

    // Try AI upscaling first if available and requested
    if (useAI) {
      try {
        console.log(`[Upscale API] Using AI upscaling (Real-ESRGAN ${aiScale}x)...`)
        upscaledBase64 = await upscaleWithRealESRGAN(base64Data, aiScale as 2 | 4)
        actualMethod = 'ai'
        console.log("[Upscale API] AI upscale complete")
      } catch (aiError) {
        console.error("[Upscale API] AI upscale failed, falling back to Sharp:", aiError)
        // Fallback to Sharp
        upscaledBase64 = await upscaleBase64WithSharp(base64Data, targetSize)
        actualMethod = 'fallback'
      }
    } else {
      // Use Sharp directly
      console.log("[Upscale API] Using Sharp (fast mode)...")
      upscaledBase64 = await upscaleBase64WithSharp(base64Data, targetSize)
      actualMethod = 'fast'
    }

    // Get final dimensions
    const upscaledBuffer = Buffer.from(upscaledBase64, 'base64')
    const upscaledMetadata = await sharp(upscaledBuffer).metadata()
    const newWidth = upscaledMetadata.width || targetSize
    const newHeight = upscaledMetadata.height || targetSize

    console.log("[Upscale API] Final dimensions:", { newWidth, newHeight, method: actualMethod })

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${upscaledBase64}`,
      originalDimensions: { width: originalWidth, height: originalHeight },
      newDimensions: { width: newWidth, height: newHeight },
      targetResolution,
      method: actualMethod,
    })
  } catch (error) {
    console.error("[Upscale API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upscale image" },
      { status: 500 }
    )
  }
}

export const POST = withCreditGuard('upscale', flatCost('upscale'), handlePost)
