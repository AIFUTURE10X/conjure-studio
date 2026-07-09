export const LOGO_ASPECT_RATIOS = [
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '21:9',
  '5:4',
  '4:5',
] as const

export const LOGO_RESOLUTIONS = ['1K', '2K', '4K'] as const

export const LOGO_GENERATION_MODELS = [
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image-preview',
  'gpt-image-2',
] as const

export const LOGO_TEXT_MODES = ['ai-text', 'exact-text-overlay'] as const

export const LOGO_REFERENCE_MODES = ['inspire', 'replicate'] as const

export const LOGO_BACKGROUND_REMOVAL_METHODS = [
  'native-transparent',
  'none',
  'auto',
  'ai-local',
  'simple',
  'cloud',
  'pixian',
  'replicate',
  'smart',
  'photoroom',
  '851-labs',
  'pixelcut',
  'fal',
] as const

export type LogoAspectRatio = typeof LOGO_ASPECT_RATIOS[number]
export type LogoResolution = typeof LOGO_RESOLUTIONS[number]
export type LogoGenerationModel = typeof LOGO_GENERATION_MODELS[number]
export type LogoTextMode = typeof LOGO_TEXT_MODES[number]
export type LogoReferenceMode = typeof LOGO_REFERENCE_MODES[number]
export type BgRemovalMethod = typeof LOGO_BACKGROUND_REMOVAL_METHODS[number]

export type LogoStyle =
  | 'minimalist'
  | 'flat'
  | '3d'
  | 'vintage'
  | 'modern'
  | '3d-metallic'
  | '3d-crystal'
  | '3d-gradient'
  | 'neon'
  | string

export interface LogoGenerationOptions {
  prompt: string
  negativePrompt?: string
  style: LogoStyle
  referenceImage?: File
  referenceMode?: LogoReferenceMode
  bgRemovalMethod?: BgRemovalMethod
  cloudApiKey?: string
  aspectRatio?: LogoAspectRatio
  resolution?: LogoResolution
  model?: LogoGenerationModel
  textMode?: LogoTextMode
  seed?: number
  skipBgRemoval?: boolean
}

export interface GeneratedLogo {
  url: string
  originalUrl?: string
  prompt: string
  style: LogoStyle
  aspectRatio: LogoAspectRatio
  textMode: LogoTextMode
  bgRemovalMethod: BgRemovalMethod
  timestamp: number
  seed?: number
}

export const DEFAULT_LOGO_GENERATION_SETTINGS = {
  aspectRatio: '1:1',
  resolution: '1K',
  model: 'gpt-image-2',
  textMode: 'ai-text',
  bgRemovalMethod: 'fal',
} satisfies {
  aspectRatio: LogoAspectRatio
  resolution: LogoResolution
  model: LogoGenerationModel
  textMode: LogoTextMode
  bgRemovalMethod: BgRemovalMethod
}

function normalizeFromList<T extends readonly string[]>(
  input: string | null | undefined,
  allowed: T,
  fallback: T[number],
  transform: (value: string) => string = (value) => value
): T[number] {
  const normalized = transform(input || fallback)
  return allowed.includes(normalized) ? normalized : fallback
}

export function normalizeLogoAspectRatio(input: string | null | undefined): LogoAspectRatio {
  const normalized = (input || DEFAULT_LOGO_GENERATION_SETTINGS.aspectRatio).replace(/\s+/g, '')
  if (!LOGO_ASPECT_RATIOS.includes(normalized as LogoAspectRatio)) {
    throw new Error(`Unsupported aspect ratio: ${input}`)
  }
  return normalized as LogoAspectRatio
}

export function normalizeLogoResolution(input: string | null | undefined): LogoResolution {
  return normalizeFromList(
    input,
    LOGO_RESOLUTIONS,
    DEFAULT_LOGO_GENERATION_SETTINGS.resolution,
    (value) => value.toUpperCase()
  )
}

export function normalizeLogoTextMode(input: string | null | undefined): LogoTextMode {
  return normalizeFromList(input, LOGO_TEXT_MODES, DEFAULT_LOGO_GENERATION_SETTINGS.textMode)
}

export function normalizeBgRemovalMethod(input: string | null | undefined): BgRemovalMethod {
  return normalizeFromList(input, LOGO_BACKGROUND_REMOVAL_METHODS, DEFAULT_LOGO_GENERATION_SETTINGS.bgRemovalMethod)
}

export function normalizeLogoModel(input: string | null | undefined): LogoGenerationModel {
  const migrations: Record<string, LogoGenerationModel> = {
    'gemini-2.5-flash-preview-image': 'gemini-3.1-flash-image-preview',
    'gemini-2.5-flash-image': 'gemini-3.1-flash-image-preview',
    'gemini-2.0-flash-exp': 'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image': 'gemini-3-pro-image-preview',
    'chatgpt-image-generator-2': 'gpt-image-2',
    'chatgpt-image-latest': 'gpt-image-2',
  }
  const migrated = input ? migrations[input] || input : undefined
  return normalizeFromList(migrated, LOGO_GENERATION_MODELS, DEFAULT_LOGO_GENERATION_SETTINGS.model)
}

export function parseLogoSeed(input: string | null | undefined): number | undefined {
  if (!input) return undefined
  const seed = Number.parseInt(input, 10)
  return Number.isFinite(seed) ? seed : undefined
}
