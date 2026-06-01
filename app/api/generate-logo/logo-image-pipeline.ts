import { removeBackground, type BackgroundRemovalMethod } from '@/lib/background-removal'
import { removeBackgroundCloud, removeBackgroundPixian } from '@/lib/cloud-bg-removal'
import { generateImageWithRetry } from '@/lib/gemini-client'
import { generateOpenAIImage } from '@/lib/openai-image-client'
import { removeBackgroundWithPixelcut } from '@/lib/pixelcut-bg-removal'
import { removeBackgroundWithReplicate } from '@/lib/replicate-bg-removal'
import { isReplicateAvailable, upscaleWithRealESRGAN } from '@/lib/replicate-upscaler'
import sharp from 'sharp'
import type { ParsedLogoGenerationRequest } from './logo-request'

export interface LogoGenerationResult {
  success: boolean
  imageBase64?: string
  error?: string
  seed?: number
}

export function isOpenAIImageModel(model: ParsedLogoGenerationRequest['model']): model is 'gpt-image-2' {
  return model === 'gpt-image-2'
}

export function shouldUseFreeFormPrompt(request: ParsedLogoGenerationRequest): boolean {
  const cloudRemovalAvailable =
    request.bgRemovalMethod === 'pixelcut' ||
    request.bgRemovalMethod === 'replicate' ||
    request.bgRemovalMethod === '851-labs' ||
    ((request.bgRemovalMethod === 'pixian' || request.bgRemovalMethod === 'cloud') && !!request.cloudApiKey)

  return request.skipBgRemoval || cloudRemovalAvailable
}

export async function generateLogoBaseImage(
  request: ParsedLogoGenerationRequest,
  enhancedPrompt: string
): Promise<LogoGenerationResult> {
  if (isOpenAIImageModel(request.model)) {
    try {
      const result = await generateOpenAIImage({
        prompt: enhancedPrompt,
        aspectRatio: request.aspectRatio,
        imageSize: request.resolution,
        imageQuality: request.imageQuality,
        referenceImageFile: request.referenceImageFile,
      })

      return {
        success: true,
        imageBase64: result.imageBase64,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate logo with ChatGPT Images 2.0',
      }
    }
  }

  return generateImageWithRetry({
    prompt: enhancedPrompt,
    aspectRatio: request.aspectRatio,
    model: request.model,
    imageSize: request.resolution,
    referenceImage: request.referenceImage,
    seed: request.seed,
    disableSearch: true,
  })
}

export async function removeLogoBackgroundIfNeeded(
  request: ParsedLogoGenerationRequest,
  imageBase64: string
): Promise<string> {
  if (request.skipBgRemoval) {
    console.log('[Logo API] Skipping background removal (will be done later if needed)')
    return imageBase64
  }

  if (request.bgRemovalMethod === 'none') {
    console.log('[Logo API] Background removal method is none; using original image')
    return imageBase64
  }

  console.log(`[Logo API] Removing background with method: ${request.bgRemovalMethod}...`)

  if (request.bgRemovalMethod === 'pixelcut') {
    return removeBackgroundWithPixelcut(imageBase64)
  }

  if (request.bgRemovalMethod === 'replicate') {
    return removeBackgroundWithReplicate(imageBase64, 'bria')
  }

  if (request.bgRemovalMethod === '851-labs') {
    return removeBackgroundWithReplicate(imageBase64, '851-labs')
  }

  if (request.bgRemovalMethod === 'pixian' && request.cloudApiKey) {
    return removeBackgroundPixian(imageBase64, request.cloudApiKey)
  }

  if (request.bgRemovalMethod === 'cloud' && request.cloudApiKey) {
    return removeBackgroundCloud(imageBase64, { apiKey: request.cloudApiKey })
  }

  return removeBackground(imageBase64, {
    method: request.bgRemovalMethod as BackgroundRemovalMethod,
    tolerance: 12,
    edgeSmoothing: true,
  })
}

export async function upscaleLogoIfNeeded(
  request: ParsedLogoGenerationRequest,
  imageBase64: string
): Promise<string> {
  if (request.resolution === '1K') return imageBase64

  const checkBuffer = Buffer.from(imageBase64, 'base64')
  const checkMetadata = await sharp(checkBuffer).metadata()
  const currentSize = Math.max(checkMetadata.width || 0, checkMetadata.height || 0)
  const targetSize = request.resolution === '4K' ? 4096 : 2048

  console.log(`[Logo API] Current image size: ${checkMetadata.width}x${checkMetadata.height}`)
  console.log(`[Logo API] Target size for ${request.resolution}: ${targetSize}`)

  if (currentSize >= targetSize * 0.9) {
    console.log(`[Logo API] Native ${request.resolution} resolution detected, no upscaling needed`)
    return imageBase64
  }

  try {
    const aiScale = request.resolution === '4K' ? 4 : 2

    if (isReplicateAvailable()) {
      console.log(`[Logo API] Using AI upscaling (Real-ESRGAN ${aiScale}x)...`)
      return upscaleWithRealESRGAN(imageBase64, aiScale)
    }

    console.log('[Logo API] Using Sharp upscaling (Replicate not available)...')
    const originalWidth = checkMetadata.width || 1024
    const originalHeight = checkMetadata.height || 1024
    const maxOriginalDim = Math.max(originalWidth, originalHeight)
    const scale = targetSize / maxOriginalDim
    const newWidth = Math.round(originalWidth * scale)
    const newHeight = Math.round(originalHeight * scale)

    const upscaledBuffer = await sharp(checkBuffer)
      .resize(newWidth, newHeight, {
        kernel: 'lanczos3',
        fit: 'fill',
      })
      .sharpen({ sigma: 1.0 })
      .png({ quality: 100 })
      .toBuffer()

    console.log(`[Logo API] Sharp upscale complete: ${newWidth}x${newHeight}`)
    return upscaledBuffer.toString('base64')
  } catch (upscaleError) {
    console.error('[Logo API] Upscale failed, using original:', upscaleError)
    return imageBase64
  }
}

export function toPngDataUrl(imageBase64: string): string {
  return `data:image/png;base64,${imageBase64}`
}
