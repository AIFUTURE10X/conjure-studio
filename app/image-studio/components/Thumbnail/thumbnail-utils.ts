/**
 * Thumbnail provider helpers — pure functions kept out of the provider to
 * stay under the file-size limit.
 */

import {
  DEFAULT_CONFIG,
  THUMB_STORAGE_KEY,
  buildThumbnailBgPrompt,
  createTextBlock,
  type ThumbnailConfig,
  type ThumbnailTextBlock,
} from './thumbnail-constants'

/**
 * Upgrade any persisted/snapshotted config to the current shape. Older configs
 * stored a single `headline` object; here that becomes a one-element
 * `headlines[]`. Blocks keep their id when present and get a fresh one otherwise.
 */
export function normalizeConfig(
  parsed: Partial<ThumbnailConfig> & { headline?: Partial<ThumbnailTextBlock> },
): ThumbnailConfig {
  let headlines: ThumbnailTextBlock[]
  if (Array.isArray(parsed.headlines) && parsed.headlines.length > 0) {
    headlines = parsed.headlines.map((h) => createTextBlock(h))
  } else if (parsed.headline) {
    headlines = [createTextBlock(parsed.headline)]
  } else {
    headlines = DEFAULT_CONFIG.headlines.map((h) => ({ ...h }))
  }
  return {
    templateId: parsed.templateId ?? DEFAULT_CONFIG.templateId,
    background: { ...DEFAULT_CONFIG.background, ...parsed.background },
    subject: parsed.subject ?? null,
    headlines,
    stickers: Array.isArray(parsed.stickers) ? parsed.stickers : [],
    subjectOnTop: parsed.subjectOnTop,
  }
}

export function loadThumbnailConfig(): ThumbnailConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  try {
    const raw = window.localStorage.getItem(THUMB_STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    return normalizeConfig(JSON.parse(raw))
  } catch {
    return DEFAULT_CONFIG
  }
}

export async function toDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url
  const blob = await (await fetch(url)).blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}

export interface GenerateImageOptions {
  model?: string
  imageSize?: string
  /** Optional data-URL reference image to guide generation (image-to-image). */
  referenceImage?: string
  /** How closely to follow the reference: 'inspire' (loose) or 'replicate' (close). */
  referenceMode?: 'inspire' | 'replicate'
}

/** Request `count` thumbnail backgrounds from the shared image engine. */
export async function postGenerateImage(
  idea: string,
  stylePrompt: string,
  options: GenerateImageOptions | undefined,
  count: number,
): Promise<string[]> {
  const form = new FormData()
  form.append('prompt', buildThumbnailBgPrompt(idea, stylePrompt))
  form.append('aspectRatio', '16:9')
  form.append('count', String(count))
  form.append('model', options?.model || 'gpt-image-2')
  form.append('imageSize', options?.imageSize || '1K')
  if (options?.referenceImage) {
    const blob = await (await fetch(options.referenceImage)).blob()
    form.append('referenceImage', blob, 'reference.png')
    form.append('referenceMode', options.referenceMode || 'inspire')
  }
  const res = await fetch('/api/generate-image', { method: 'POST', body: form })
  const data = (await res.json()) as { images?: string[]; error?: string }
  if (!res.ok || !Array.isArray(data.images) || data.images.length === 0) {
    throw new Error(data.error || 'No image returned')
  }
  return data.images
}
