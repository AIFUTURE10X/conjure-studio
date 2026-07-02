/**
 * upload-prep
 *
 * Client-side preparation of edit uploads. Vercel serverless functions cap
 * request bodies at ~4.5 MB, and edit results come back as 2K PNGs — posting
 * one back unmodified for the next round of editing 413s. Downscale to a
 * bounded edge and prefer JPEG when the image has no transparency (photos
 * compress ~10x smaller); keep PNG for transparent sources (BG-removed
 * images) with a harder size-driven rescale as the fallback.
 */

const MAX_EDGE = 1600
const FALLBACK_EDGE = 1024
const MAX_PNG_BYTES = 3_500_000
const JPEG_QUALITY = 0.9

export interface PreparedUpload {
  blob: Blob
  width: number
  height: number
  fileName: string
}

export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = url
  })
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))), type, quality),
  )

function drawScaled(img: HTMLImageElement, maxEdge: number): HTMLCanvasElement {
  const nw = img.naturalWidth || 1024
  const nh = img.naturalHeight || 1024
  const scale = Math.min(1, maxEdge / Math.max(nw, nh))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(nw * scale))
  canvas.height = Math.max(1, Math.round(nh * scale))
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}

/**
 * Full alpha scan — a sparse sample can step over small transparent regions
 * entirely (e.g. a thin cutout edge), flattening them to an opaque JPEG
 * background. The scan itself costs milliseconds even at 2K.
 */
function hasTransparency(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d')!
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true
  }
  return false
}

/**
 * Scale the source image to fit the upload budget and pick the cheapest
 * encoding that preserves it. Returns the blob plus the exact pixel size the
 * matching mask must be built at.
 */
export async function prepareImageForEdit(img: HTMLImageElement): Promise<PreparedUpload> {
  let canvas = drawScaled(img, MAX_EDGE)

  if (!hasTransparency(canvas)) {
    const blob = await toBlob(canvas, 'image/jpeg', JPEG_QUALITY)
    return { blob, width: canvas.width, height: canvas.height, fileName: 'image.jpg' }
  }

  let blob = await toBlob(canvas, 'image/png')
  if (blob.size > MAX_PNG_BYTES) {
    canvas = drawScaled(img, FALLBACK_EDGE)
    blob = await toBlob(canvas, 'image/png')
  }
  return { blob, width: canvas.width, height: canvas.height, fileName: 'image.png' }
}

/** Rescale an existing mask PNG to match the prepared image's dimensions. */
export async function scaleMaskBlob(mask: Blob, width: number, height: number): Promise<Blob> {
  const url = URL.createObjectURL(mask)
  try {
    const img = await loadImageElement(url)
    if (img.naturalWidth === width && img.naturalHeight === height) return mask
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
    return await toBlob(canvas, 'image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

export interface EditResponseBody {
  image?: string
  images?: string[]
  error?: string
}

/**
 * Parse an edit-route response that may not be JSON — proxies answer plain
 * text for oversized bodies (413 "Request Entity Too Large") and gateway
 * errors, which otherwise surfaces as a JSON.parse toast.
 */
export async function parseEditResponse(response: Response): Promise<EditResponseBody> {
  const text = await response.text()
  try {
    return JSON.parse(text) as EditResponseBody
  } catch {
    if (response.status === 413) {
      return { error: 'The image is too large to upload. Try again — it will be compressed further.' }
    }
    return { error: `Edit failed (${response.status || 'network error'})` }
  }
}

/** Multi-variant responses carry `images`; older single-image responses carry `image`. */
export function editResponseUrls(data: EditResponseBody): string[] {
  return data.images?.length ? data.images : data.image ? [data.image] : []
}
