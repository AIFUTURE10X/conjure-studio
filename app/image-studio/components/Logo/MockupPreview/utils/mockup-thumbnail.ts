/**
 * Mockup Thumbnail Utility
 *
 * Generates small thumbnails from canvas for preset saving.
 * Extracted to eliminate duplicate code in ProductMockupsPanel.
 */

/**
 * Generate a thumbnail from a canvas element
 * @param canvas - Source canvas element
 * @param maxSize - Maximum dimension (width or height) in pixels (default: 150)
 * @param quality - JPEG quality 0-1 (default: 0.7)
 * @returns Data URL of the thumbnail in JPEG format
 */
export function generateThumbnail(
  canvas: HTMLCanvasElement,
  maxSize: number = 150,
  quality: number = 0.7
): string {
  const thumbCanvas = document.createElement('canvas')
  const scale = Math.min(maxSize / canvas.width, maxSize / canvas.height)
  thumbCanvas.width = canvas.width * scale
  thumbCanvas.height = canvas.height * scale
  const ctx = thumbCanvas.getContext('2d')
  ctx?.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height)
  return thumbCanvas.toDataURL('image/jpeg', quality)
}

/**
 * Generate a thumbnail from a canvas, returning undefined if capture fails
 * @param captureCanvas - Async function to capture the canvas
 * @param maxSize - Maximum dimension (default: 150)
 * @returns Promise of data URL or undefined
 */
export async function generateThumbnailFromCapture(
  captureCanvas: () => Promise<HTMLCanvasElement | null>,
  maxSize: number = 150
): Promise<string | undefined> {
  const canvas = await captureCanvas()
  if (!canvas) return undefined
  return generateThumbnail(canvas, maxSize)
}
