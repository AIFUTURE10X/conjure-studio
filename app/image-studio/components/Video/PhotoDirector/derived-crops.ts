"use client"

import type { PhotoReference } from '@/lib/video/photo-director-schema'

/**
 * Derived crops: a close-up cut from a real photo becomes an extra start
 * frame for detail shots — dramatically safer than asking a video model to
 * zoom, because the pixels stay real.
 */

/** Normalized crop rectangle (0-1 fractions of the source image). */
export interface CropFraction {
  x: number
  y: number
  w: number
  h: number
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load the photo'))
    img.src = dataUrl
  })
}

const THUMB_MAX = 384

/** Cut a crop from a source photo at native resolution and return it as a new PhotoReference. */
export async function createDerivedCrop(source: PhotoReference, fraction: CropFraction, label: string): Promise<PhotoReference> {
  const img = await loadImage(source.dataUrl)
  const sx = Math.round(fraction.x * img.width)
  const sy = Math.round(fraction.y * img.height)
  const sw = Math.max(1, Math.round(fraction.w * img.width))
  const sh = Math.max(1, Math.round(fraction.h * img.height))

  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9)

  const thumbScale = Math.min(1, THUMB_MAX / Math.max(sw, sh))
  const thumbCanvas = document.createElement('canvas')
  thumbCanvas.width = Math.max(1, Math.round(sw * thumbScale))
  thumbCanvas.height = Math.max(1, Math.round(sh * thumbScale))
  thumbCanvas.getContext('2d')!.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height)

  return {
    id: `crop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    dataUrl,
    thumbUrl: thumbCanvas.toDataURL('image/jpeg', 0.8),
    width: sw,
    height: sh,
    label,
    isDerivedCrop: true,
    sourcePhotoId: source.id,
    cropRect: { x: sx, y: sy, w: sw, h: sh },
  }
}
