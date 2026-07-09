import {
  normalizeBgRemovalMethod,
  normalizeLogoAspectRatio,
  normalizeLogoModel,
  normalizeLogoResolution,
  normalizeLogoTextMode,
  parseLogoSeed,
  type BgRemovalMethod,
  type LogoAspectRatio,
  type LogoGenerationModel,
  type LogoReferenceMode,
  type LogoResolution,
  type LogoTextMode,
} from '@/lib/logo-generation-contract'
import type { OpenAIImageQuality } from '@/lib/openai-image-client'

export interface ParsedLogoGenerationRequest {
  prompt: string
  negativePrompt: string | null
  style: string
  model: LogoGenerationModel
  referenceImageFile: File | null
  referenceImage?: string
  referenceMode: LogoReferenceMode
  bgRemovalMethod: BgRemovalMethod
  cloudApiKey: string | null
  aspectRatio: LogoAspectRatio
  resolution: LogoResolution
  imageQuality: OpenAIImageQuality
  textMode: LogoTextMode
  seed?: number
  skipBgRemoval: boolean
}

function normalizeImageQuality(input: string | null): OpenAIImageQuality {
  if (input === 'low' || input === 'medium' || input === 'high' || input === 'auto') return input
  return 'medium'
}

function normalizeReferenceMode(input: string | null): LogoReferenceMode {
  return input === 'replicate' ? 'replicate' : 'inspire'
}

async function fileToBase64(file: File | null): Promise<string | undefined> {
  if (!file || file.size <= 0) return undefined
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer).toString('base64')
}

export async function parseLogoGenerationRequest(formData: FormData): Promise<ParsedLogoGenerationRequest> {
  const referenceImageFile = formData.get('referenceImage') as File | null

  return {
    prompt: (formData.get('prompt') as string) || '',
    negativePrompt: formData.get('negativePrompt') as string | null,
    style: (formData.get('style') as string) || 'modern+3d-metallic',
    model: normalizeLogoModel(formData.get('model') as string | null),
    referenceImageFile,
    referenceImage: await fileToBase64(referenceImageFile),
    referenceMode: normalizeReferenceMode(formData.get('referenceMode') as string | null),
    bgRemovalMethod: normalizeBgRemovalMethod(formData.get('bgRemovalMethod') as string | null),
    cloudApiKey: formData.get('cloudApiKey') as string | null,
    aspectRatio: normalizeLogoAspectRatio(formData.get('aspectRatio') as string | null),
    resolution: normalizeLogoResolution(formData.get('resolution') as string | null),
    imageQuality: normalizeImageQuality(formData.get('imageQuality') as string | null),
    textMode: normalizeLogoTextMode(formData.get('textMode') as string | null),
    seed: parseLogoSeed(formData.get('seed') as string | null),
    skipBgRemoval: formData.get('skipBgRemoval') !== 'false',
  }
}
