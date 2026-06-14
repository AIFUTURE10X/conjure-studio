import { hasTransparency, removeBackground, type BackgroundRemovalMethod } from '@/lib/background-removal'
import { removeBackgroundCloud, removeBackgroundPixian } from '@/lib/cloud-bg-removal'
import { generateImageWithRetry } from '@/lib/gemini-client'
import { generateOpenAIImage } from '@/lib/openai-image-client'
import { isPhotoRoomBgRemovalAvailable, removeBackgroundWithPhotoRoom } from '@/lib/photoroom-bg-removal'
import { removeBackgroundWithPixelcut } from '@/lib/pixelcut-bg-removal'
import { removeBackgroundWithReplicate } from '@/lib/replicate-bg-removal'
import { removeBackgroundSmart } from '@/lib/smart-bg-removal'
import { upscaleBase64WithSharp } from '@/lib/sharp-upscaler'
import sharp from 'sharp'
import type { ParsedLogoGenerationRequest } from './logo-request'

export interface LogoGenerationResult {
  success: boolean
  imageBase64?: string
  error?: string
  seed?: number
}

export interface LogoBackgroundRemovalResult {
  imageBase64: string
  bgRemovalMethod: ParsedLogoGenerationRequest['bgRemovalMethod']
}

export function isOpenAIImageModel(model: ParsedLogoGenerationRequest['model']): model is 'gpt-image-2' {
  return model === 'gpt-image-2'
}

export function shouldUseFreeFormPrompt(request: ParsedLogoGenerationRequest): boolean {
  const cloudRemovalAvailable =
    request.bgRemovalMethod === 'pixelcut' ||
    request.bgRemovalMethod === 'replicate' ||
    request.bgRemovalMethod === '851-labs' ||
    (request.bgRemovalMethod === 'photoroom' && (!!request.cloudApiKey || isPhotoRoomBgRemovalAvailable())) ||
    ((request.bgRemovalMethod === 'pixian' || request.bgRemovalMethod === 'cloud') && !!request.cloudApiKey)

  return request.skipBgRemoval || request.bgRemovalMethod === 'none' || cloudRemovalAvailable
}

async function ensureNativeTransparentLogo(imageBase64: string): Promise<string> {
  if (await hasTransparency(imageBase64)) {
    console.log('[Logo API] Native transparent PNG output contains alpha')
    return imageBase64
  }

  console.warn('[Logo API] OpenAI returned an opaque PNG for native transparency; applying local smart fallback')
  return removeBackgroundSmart(imageBase64, {
    tolerance: 35,
    edgeSmoothing: false,
  })
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
        outputBackground: 'auto',
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
): Promise<LogoBackgroundRemovalResult> {
  const result = (
    processedBase64: string,
    bgRemovalMethod: ParsedLogoGenerationRequest['bgRemovalMethod'] = request.bgRemovalMethod
  ): LogoBackgroundRemovalResult => ({
    imageBase64: processedBase64,
    bgRemovalMethod,
  })

  if (request.bgRemovalMethod === 'native-transparent') {
    console.log('[Logo API] Verifying legacy transparent PNG cleanup output')
    return result(await ensureNativeTransparentLogo(imageBase64))
  }

  if (request.skipBgRemoval) {
    console.log('[Logo API] Skipping background removal (will be done later if needed)')
    return result(imageBase64)
  }

  if (request.bgRemovalMethod === 'none') {
    console.log('[Logo API] Background removal method is none; using original image')
    return result(imageBase64)
  }

  console.log(`[Logo API] Removing background with method: ${request.bgRemovalMethod}...`)

  if (request.bgRemovalMethod === 'pixelcut') {
    return result(await removeBackgroundWithPixelcut(imageBase64))
  }

  if (request.bgRemovalMethod === 'replicate') {
    return result(await removeBackgroundWithReplicate(imageBase64, 'bria'))
  }

  if (request.bgRemovalMethod === '851-labs') {
    return result(await removeBackgroundWithReplicate(imageBase64, '851-labs'))
  }

  if (request.bgRemovalMethod === 'photoroom') {
    if (request.cloudApiKey || isPhotoRoomBgRemovalAvailable()) {
      return result(await removeBackgroundWithPhotoRoom(imageBase64, request.cloudApiKey || undefined, request.resolution !== '1K'))
    }

    throw new Error('PhotoRoom background removal is selected but PHOTOROOM_API_KEY is not configured.')
  }

  if (request.bgRemovalMethod === 'smart') {
    return result(await removeBackgroundSmart(imageBase64, {
      tolerance: 25,
      edgeSmoothing: false,
    }))
  }

  if (request.bgRemovalMethod === 'pixian' && request.cloudApiKey) {
    return result(await removeBackgroundPixian(imageBase64, request.cloudApiKey))
  }

  if (request.bgRemovalMethod === 'cloud' && request.cloudApiKey) {
    return result(await removeBackgroundCloud(imageBase64, { apiKey: request.cloudApiKey }))
  }

  return result(await removeBackground(imageBase64, {
    method: request.bgRemovalMethod as BackgroundRemovalMethod,
    tolerance: 12,
    edgeSmoothing: true,
  }))
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

    console.log(`[Logo API] Using Sharp upscaling (${aiScale}x target, Replicate bypassed)...`)
    const upscaledBase64 = await upscaleBase64WithSharp(imageBase64, targetSize, { sharpen: true })
    const upscaledMetadata = await sharp(Buffer.from(upscaledBase64, 'base64')).metadata()
    console.log(`[Logo API] Sharp upscale complete: ${upscaledMetadata.width}x${upscaledMetadata.height}`)
    return upscaledBase64
  } catch (upscaleError) {
    console.error('[Logo API] Upscale failed, using original:', upscaleError)
    return imageBase64
  }
}

export function toPngDataUrl(imageBase64: string): string {
  return `data:image/png;base64,${imageBase64}`
}
