/**
 * Client helpers for posting studio images to API routes.
 *
 * Generated logos and thumbnail backgrounds live in state as base64 data URLs,
 * which carry ~33% more characters than the bytes they encode. Inlining one in a
 * JSON body overruns the platform request-body cap, and that failure comes back
 * as a plain-text `413 Request Entity Too Large` — which then blows up in
 * `response.json()` as "Unexpected token 'R'". Sending a downscaled binary file
 * keeps the payload an order of magnitude smaller, and `readApiJson` turns any
 * remaining non-JSON failure into something a user can read.
 */

/** Stay well under the 4.5 MB serverless request-body cap, headers included. */
const MAX_UPLOAD_BYTES = 3_500_000

/** Longest edge to try, in order. The image engines resample references to ~1.5K anyway. */
const EDGE_STEPS = [1536, 1024, 768]

/** Redraws the bitmap at `maxEdge` and encodes PNG, which keeps logo transparency. */
function encodePng(bitmap: ImageBitmap, maxEdge: number): Promise<Blob | null> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))

  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

/**
 * Turns any image source (data URL, blob URL, or remote URL) into an upload-sized
 * `File`, stepping the resolution down until it fits the request-body budget.
 *
 * @example
 * const form = new FormData()
 * form.append('image', await toImageFile(generatedLogo.url, 'logo.png'))
 */
export async function toImageFile(source: string, filename = 'image.png'): Promise<File> {
  const original = await (await fetch(source)).blob()
  const type = original.type || 'image/png'

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(original)
  } catch {
    // Undecodable here (SVG in some browsers, exotic formats) — let the server deal with it.
    return new File([original], filename, { type })
  }

  try {
    let best = new File([original], filename, { type })
    if (Math.max(bitmap.width, bitmap.height) <= EDGE_STEPS[0] && original.size <= MAX_UPLOAD_BYTES) {
      return best
    }

    for (const edge of EDGE_STEPS) {
      const encoded = await encodePng(bitmap, edge)
      if (!encoded) break
      best = new File([encoded], filename, { type: 'image/png' })
      if (encoded.size <= MAX_UPLOAD_BYTES) break
    }

    return best
  } finally {
    bitmap.close()
  }
}

function describeNonJsonFailure(response: Response, raw: string): string {
  if (response.status === 413) {
    return 'That image is too large to send — try a smaller logo or lower resolution.'
  }
  if (response.status === 504 || response.status === 408) {
    return 'The request timed out — please try again.'
  }

  const snippet = raw.trim().replace(/\s+/g, ' ').slice(0, 120)
  return snippet ? `Server error ${response.status}: ${snippet}` : `Server error ${response.status}`
}

/**
 * Parses an API response as JSON, converting non-JSON bodies (413 plain text,
 * gateway timeout pages) into a readable Error instead of a JSON parse failure.
 */
export async function readApiJson<T>(response: Response): Promise<T> {
  const raw = await response.text()
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error(describeNonJsonFailure(response, raw))
  }
}
