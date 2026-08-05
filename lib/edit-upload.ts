/**
 * lib/edit-upload.ts
 *
 * Shared result upload for the edit routes (/api/edit-image,
 * /api/thumbnail-edit). 2K PNG edit results as base64 data URIs can exceed
 * Vercel's response-body cap — after credits have already been debited —
 * so both routes upload to Blob when a token is configured and only fall
 * back to a data URI in local dev.
 */

import { randomUUID } from "node:crypto"
import { put } from "@vercel/blob"

const MAX_BLOB_UPLOAD_ATTEMPTS = 3
const BLOB_RETRY_BASE_DELAY_MS = 50
const BLOB_UPLOAD_ATTEMPT_TIMEOUT_MS = 10_000
// Keep the base64 fallback below the platform's JSON response limit. Blob-backed
// deployments fail explicitly for larger results instead of returning an unusable response.
export const MAX_INLINE_EDIT_IMAGE_BYTES = 3_000_000

function isRetryableBlobError(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error)) return true
  const status = (error as { status?: unknown }).status
  return typeof status !== "number" || status === 408 || status === 425 || status === 429 || status >= 500
}

export async function uploadEditImage(buffer: Buffer): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    for (let attempt = 0; attempt < MAX_BLOB_UPLOAD_ATTEMPTS; attempt += 1) {
      const controller = new AbortController()
      let timeout: ReturnType<typeof setTimeout> | undefined
      try {
        const upload = put(`edits/${randomUUID()}.png`, buffer, {
          access: "public",
          contentType: "image/png",
          abortSignal: controller.signal,
        })
        const timeoutGuard = new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            controller.abort()
            reject(new Error("Blob upload attempt timed out"))
          }, BLOB_UPLOAD_ATTEMPT_TIMEOUT_MS)
        })
        const uploaded = await Promise.race([upload, timeoutGuard])
        return uploaded.url
      } catch (error) {
        if (!isRetryableBlobError(error)) {
          console.error(
            "[edit-upload] Blob upload failed with a permanent error; falling back to data URI:",
            error,
          )
          break
        }
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
      } finally {
        if (timeout) clearTimeout(timeout)
      }
    }
  }
  if (process.env.BLOB_READ_WRITE_TOKEN && buffer.length > MAX_INLINE_EDIT_IMAGE_BYTES) {
    throw new Error("Blob upload failed for an image too large for inline fallback")
  }
  return `data:image/png;base64,${buffer.toString("base64")}`
}
