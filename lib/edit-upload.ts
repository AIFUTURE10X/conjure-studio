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

export async function uploadEditImage(buffer: Buffer): Promise<string> {
  let imageUrl = `data:image/png;base64,${buffer.toString("base64")}`
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const uploaded = await put(
        `edits/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`,
        buffer,
        { access: "public", contentType: "image/png" },
      )
      imageUrl = uploaded.url
    } catch (error) {
      console.error("[edit-upload] Blob upload failed; falling back to data URI:", error)
    }
  }
  return imageUrl
}
