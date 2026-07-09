/**
 * Canvas Export Utilities
 * Reliable image export using manual Canvas API drawing
 * Bypasses html2canvas issues with Tailwind 4 oklch/oklab colors
 *
 * See EXPORT_FIX_REFERENCE.md for documentation on the preloadImage pattern
 */

/**
 * Preload image utility - waits for image to fully load
 * Uses fetch+blob pattern to handle Vercel Blob URLs reliably
 */
export async function preloadImage(url: string): Promise<HTMLImageElement> {
  // Handle data URLs directly (already local)
  if (url.startsWith('data:')) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Image failed to load'))
      img.src = url
    })
  }

  // Fetch remote URLs (Vercel Blob, etc.) and convert to blob URL
  const response = await fetch(url)
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(blobUrl)  // Clean up
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      reject(new Error('Image failed to load'))
    }
    img.src = blobUrl
  })
}

// Y offset to match cropped viewBox
const Y_OFFSET = 100

// Draw T-shirt shape onto canvas (adjusted for cropped viewBox)
export function drawTShirtShape(ctx: CanvasRenderingContext2D, color: string, isDark: boolean) {
  // Main body (subtract Y_OFFSET from all y-coordinates)
  ctx.beginPath()
  ctx.moveTo(70, 120 - Y_OFFSET)
  ctx.lineTo(30, 160 - Y_OFFSET)
  ctx.lineTo(60, 190 - Y_OFFSET)
  ctx.lineTo(60, 440 - Y_OFFSET)
  ctx.lineTo(340, 440 - Y_OFFSET)
  ctx.lineTo(340, 190 - Y_OFFSET)
  ctx.lineTo(370, 160 - Y_OFFSET)
  ctx.lineTo(330, 120 - Y_OFFSET)
  ctx.lineTo(270, 120 - Y_OFFSET)
  // Collar curve
  ctx.bezierCurveTo(270, 145 - Y_OFFSET, 240, 175 - Y_OFFSET, 200, 175 - Y_OFFSET)
  ctx.bezierCurveTo(160, 175 - Y_OFFSET, 130, 145 - Y_OFFSET, 130, 120 - Y_OFFSET)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Fabric sheen (subtle gradient effect)
  const gradient = ctx.createLinearGradient(0, 0, 400, 360)
  gradient.addColorStop(0, 'rgba(255,255,255,0.08)')
  gradient.addColorStop(0.5, 'rgba(255,255,255,0)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.08)')
  ctx.fillStyle = gradient
  ctx.fill()

  // Vertical fold line
  ctx.beginPath()
  ctx.moveTo(200, 175 - Y_OFFSET)
  ctx.lineTo(200, 440 - Y_OFFSET)
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  ctx.lineWidth = 1
  ctx.stroke()

  // Collar detail
  ctx.beginPath()
  ctx.moveTo(130, 120 - Y_OFFSET)
  ctx.bezierCurveTo(130, 145 - Y_OFFSET, 160, 175 - Y_OFFSET, 200, 175 - Y_OFFSET)
  ctx.bezierCurveTo(240, 175 - Y_OFFSET, 270, 145 - Y_OFFSET, 270, 120 - Y_OFFSET)
  ctx.strokeStyle = isDark ? '#222' : '#ccc'
  ctx.lineWidth = 2
  ctx.stroke()

  // Inner collar shadow
  ctx.beginPath()
  ctx.moveTo(140, 125 - Y_OFFSET)
  ctx.bezierCurveTo(140, 145 - Y_OFFSET, 165, 170 - Y_OFFSET, 200, 170 - Y_OFFSET)
  ctx.bezierCurveTo(235, 170 - Y_OFFSET, 260, 145 - Y_OFFSET, 260, 125 - Y_OFFSET)
  ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 1
  ctx.stroke()

  // Sleeve seam lines
  ctx.beginPath()
  ctx.moveTo(60, 190 - Y_OFFSET)
  ctx.lineTo(70, 120 - Y_OFFSET)
  ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(340, 190 - Y_OFFSET)
  ctx.lineTo(330, 120 - Y_OFFSET)
  ctx.stroke()
}

// Canvas dimensions - matches the cropped viewBox (0 100 400 360)
export const CANVAS_WIDTH = 400
export const CANVAS_HEIGHT = 360  // Cropped height (was 480, now 360 to match viewBox)
export const CANVAS_Y_OFFSET = 100  // ViewBox starts at y=100
export const CANVAS_SCALE = 2  // HiDPI support
