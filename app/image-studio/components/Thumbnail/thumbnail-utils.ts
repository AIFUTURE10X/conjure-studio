/**
 * Thumbnail provider helpers — pure functions kept out of the provider to
 * stay under the file-size limit.
 */

import {
  DEFAULT_CONFIG,
  THUMB_STORAGE_KEY,
  buildThumbnailBgPrompt,
  type ThumbnailConfig,
} from './thumbnail-constants'

export function loadThumbnailConfig(): ThumbnailConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  try {
    const raw = window.localStorage.getItem(THUMB_STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    const parsed = JSON.parse(raw) as Partial<ThumbnailConfig>
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      background: { ...DEFAULT_CONFIG.background, ...parsed.background },
      headline: { ...DEFAULT_CONFIG.headline, ...parsed.headline },
      subject: parsed.subject ?? null,
    }
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

/** Request `count` thumbnail backgrounds from the shared image engine. */
export async function postGenerateImage(
  idea: string,
  stylePrompt: string,
  options: { model?: string; imageSize?: string } | undefined,
  count: number,
): Promise<string[]> {
  const form = new FormData()
  form.append('prompt', buildThumbnailBgPrompt(idea, stylePrompt))
  form.append('aspectRatio', '16:9')
  form.append('count', String(count))
  form.append('model', options?.model || 'gemini-3.1-flash-image-preview')
  form.append('imageSize', options?.imageSize || '1K')
  const res = await fetch('/api/generate-image', { method: 'POST', body: form })
  const data = (await res.json()) as { images?: string[]; error?: string }
  if (!res.ok || !Array.isArray(data.images) || data.images.length === 0) {
    throw new Error(data.error || 'No image returned')
  }
  return data.images
}
