/**
 * lib/edit-upload.ts
 *
 * Shared result upload for the edit routes (/api/edit-image,
 * /api/thumbnail-edit). 2K PNG edit results as base64 data URIs can exceed
 * Vercel's response-body cap — after credits have already been debited —
 * so both routes upload to Blob when a token is configured and only fall
 * back to a data URI in local dev.
 */

import { put } from "@vercel/blob"

const MAX_BLOB_UPLOAD_ATTEMPTS = 3
const BLOB_RETRY_BASE_DELAY_MS = 50

export async function uploadEditImage(buffer: Buffer): Promise<string> {
  let imageUrl = `data:image/png;base64,${buffer.toString("base64")}`
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const pathname = `edits/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`
    for (let attempt = 0; attempt < MAX_BLOB_UPLOAD_ATTEMPTS; attempt += 1) {
      try {
        const uploaded = await put(pathname, buffer, {
          access: "public",
          allowOverwrite: true,
          contentType: "image/png",
        })
        imageUrl = uploaded.url
        break
      } catch (error) {
        if (attempt === MAX_BLOB_UPLOAD_ATTEMPTS - 1) {
          console.error(
            "[edit-upload] Blob upload retries exhausted; falling back to data URI:",
            error,
          )
          break
        }
        const delayMs = BLOB_RETRY_BASE_DELAY_MS * 2 ** attempt
        console.warn(
          `[edit-upload] Blob upload attempt ${attempt + 1} failed; retrying in ${delayMs}ms`,
          error,
        )
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }
  return imageUrl
}
