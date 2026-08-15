"use client"

import { compressImageIfNeeded } from '../../../hooks/useImageCompression'
import { MAX_PHOTO_BYTES, MAX_PHOTOS } from '../../../constants/photo-director'
import type { PhotoReference } from '@/lib/video/photo-director-schema'

/** Photo intake: validate, compress, and measure uploaded files. */

const THUMB_MAX = 384

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.readAsDataURL(blob)
  })
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('The file is not a readable image'))
    img.src = dataUrl
  })
}

function makeThumb(img: HTMLImageElement): string {
  const scale = Math.min(1, THUMB_MAX / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

export interface PhotoIntakeResult {
  photos: PhotoReference[]
  errors: string[]
}

/**
 * Turn raw Files into PhotoReferences: format/size validation, compression
 * (>4MB re-encodes to ≤2048px JPEG), duplicate detection against photos
 * already on the project, and dimension capture for the thumbnail.
 */
export async function processPhotoFiles(files: File[], existing: PhotoReference[]): Promise<PhotoIntakeResult> {
  const photos: PhotoReference[] = []
  const errors: string[] = []
  const seen = new Set(existing.map((photo) => photo.dataUrl).filter(Boolean))

  for (const file of files) {
    if (existing.length + photos.length >= MAX_PHOTOS) {
      errors.push(`Only ${MAX_PHOTOS} photos are supported — extra files were skipped`)
      break
    }
    if (!file.type.startsWith('image/')) {
      errors.push(`"${file.name}" is not an image`)
      continue
    }
    if (file.size > MAX_PHOTO_BYTES) {
      errors.push(`"${file.name}" is over ${Math.round(MAX_PHOTO_BYTES / 1024 / 1024)}MB`)
      continue
    }
    try {
      const compressed = await compressImageIfNeeded(file)
      const dataUrl = await blobToDataUrl(compressed)
      if (seen.has(dataUrl)) {
        errors.push(`"${file.name}" looks like a duplicate of a photo you already added`)
        continue
      }
      seen.add(dataUrl)
      const img = await loadImage(dataUrl)
      photos.push({
        id: `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        dataUrl,
        thumbUrl: makeThumb(img),
        width: img.width,
        height: img.height,
        isDerivedCrop: false,
      })
    } catch (error) {
      errors.push(`"${file.name}" could not be read${error instanceof Error ? ` — ${error.message}` : ''}`)
    }
  }

  return { photos, errors }
}

/**
 * Analysis-sized copy of a photo: ≤maxDim JPEG File. Keeps the vision call
 * cheap while generation continues to use the full-resolution original.
 */
export async function dataUrlToScaledJpegFile(dataUrl: string, maxDim: number, name: string): Promise<File> {
  const img = await loadImage(dataUrl)
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Could not encode the photo'))), 'image/jpeg', 0.85)
  })
  return new File([blob], name, { type: 'image/jpeg' })
}

/** True when two photos differ so much in shape that pairing them may look odd. */
export function hasExtremeDimensionMismatch(photos: PhotoReference[]): boolean {
  const sources = photos.filter((photo) => !photo.isDerivedCrop)
  if (sources.length < 2) return false
  const ratios = sources.map((photo) => photo.width / photo.height)
  return Math.max(...ratios) / Math.min(...ratios) > 1.8
}
