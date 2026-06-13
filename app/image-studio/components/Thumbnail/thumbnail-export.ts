/**
 * Thumbnail export helpers — pure, browser-only image utilities kept out of the
 * provider. Capture the 1280×720 stage to a canvas, then encode/clamp/download.
 */

import { MAX_THUMBNAIL_BYTES, THUMB_HEIGHT, THUMB_WIDTH } from './thumbnail-constants'

/** Exclude on-canvas chrome (selection boxes, handles, safe-zone) from exports. */
const EXPORT_FILTER = (el: HTMLElement) => !(el instanceof Element && el.hasAttribute('data-export-ignore'))

/** Render the live stage DOM to an exact 1280×720 canvas (WYSIWYG). */
export async function captureStageCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const { toCanvas } = await import('html-to-image')
  return toCanvas(node, {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    canvasWidth: THUMB_WIDTH,
    canvasHeight: THUMB_HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
    filter: EXPORT_FILTER,
  })
}

export function canvasToPngDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await canvasToBlob(canvas, 'image/png')
  if (!blob) throw new Error('PNG encoding failed')
  return blob
}

/**
 * Encode as JPEG, lowering quality until the file fits YouTube's 2 MB cap (or a
 * quality floor of 0.4). Returns the blob plus the quality that achieved it.
 */
export async function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  maxBytes = MAX_THUMBNAIL_BYTES,
): Promise<{ blob: Blob; quality: number }> {
  let quality = 0.92
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  while (blob && blob.size > maxBytes && quality > 0.4) {
    quality = Math.round((quality - 0.08) * 100) / 100
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  }
  if (!blob) throw new Error('JPEG encoding failed')
  return { blob, quality }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
