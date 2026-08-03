import { neon } from '@neondatabase/serverless'
import { put } from '@vercel/blob'
import { ensureGenerationHistorySchema } from '@/lib/db/history-schema'

/**
 * Server-side storage for generation_history rows, shared by POST /api/history
 * (legacy client-initiated saves, e.g. AI-edit results) and /api/generate-image
 * (which saves every generation in-process, per the project's server-side
 * history-save pattern — client-side saves proved unreliable and 413 on large
 * base64 payloads).
 */

/** Rows the app keeps per user — matches the GET LIMIT and the client caches. */
export const RETENTION_LIMIT = 100

export function getGenerationHistoryDatabaseUrl() {
  return process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
}

export function hasGenerationHistoryDatabase() {
  return !!getGenerationHistoryDatabaseUrl()
}

/**
 * True for URLs already stored in our own Vercel Blob store (durable + public,
 * e.g. an edit result from uploadEditImage). Re-uploading these would mint a
 * new history/ URL that no longer matches the copy the client already holds,
 * which resurfaces the item as a duplicate card on the next sync.
 */
function isDurableBlobUrl(url: string) {
  try {
    return new URL(url).hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}

/** Neon returns JSONB as a parsed object, but tolerate a string too. */
export function parseHistoryMetadata(value: unknown) {
  if (!value) return undefined
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }
  return value
}

export interface StoredHistoryItem {
  id: string
  prompt: string
  aspectRatio: string | null
  imageUrls: string[]
  metadata?: unknown
  timestamp: number
}

export interface StoreGenerationHistoryInput {
  userId: string
  prompt: string
  aspectRatio?: string | null
  /** http(s) URLs or data:image/ URIs. */
  imageUrls: string[]
  metadata?: unknown
}

/**
 * Upload each image to Blob, insert the row, and prune retention.
 * Throws on insert failure; a Blob or prune failure never fails the save.
 */
export async function storeGenerationHistory(input: StoreGenerationHistoryInput): Promise<StoredHistoryItem> {
  const url = getGenerationHistoryDatabaseUrl()
  if (!url) throw new Error('No database connection string configured')
  const sql = neon(url)
  await ensureGenerationHistorySchema(sql)

  const { userId, prompt, aspectRatio, imageUrls, metadata } = input

  // Upload each image to Vercel Blob for durable storage. When Blob isn't
  // configured or a single upload fails, we fall back to storing the original
  // URL / data URI directly so the save still succeeds (mirrors logo-history).
  const storedImageUrls: string[] = []
  const blobUrls: string[] = []

  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i]

    // Already in our durable Blob store: keep the URL as-is so it stays
    // identical to the copy the client saved locally (avoids sync duplicates)
    // and so we don't store a second copy of the same asset.
    if (isDurableBlobUrl(imageUrl)) {
      storedImageUrls.push(imageUrl)
      blobUrls.push(imageUrl)
      continue
    }

    let blobUrl: string | null = null
    try {
      let imageBuffer: Buffer
      if (imageUrl.startsWith('data:')) {
        const base64Data = imageUrl.split(',')[1]
        if (!base64Data) throw new Error('Invalid data URL format')
        imageBuffer = Buffer.from(base64Data, 'base64')
      } else {
        const response = await fetch(imageUrl)
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)
        imageBuffer = Buffer.from(await response.arrayBuffer())
      }

      const fileName = `history/${userId}-${Date.now()}-${i}.png`
      const uploadResult = await put(fileName, imageBuffer, {
        access: 'public',
        contentType: 'image/png',
      })
      blobUrl = uploadResult.url
      console.log(`[v0] History store: image ${i + 1} uploaded to Blob:`, blobUrl)
    } catch (error) {
      console.error(`[v0] History store: Blob upload failed for image ${i + 1}, storing URL directly:`, error)
    }

    // When Blob succeeded, avoid storing the (huge) data URI twice.
    storedImageUrls.push(
      blobUrl && imageUrl.startsWith('data:') ? imageUrl.substring(0, 50) + '...[base64]' : imageUrl,
    )
    blobUrls.push(blobUrl ?? imageUrl)
  }

  const metadataJson = metadata ? JSON.stringify(metadata) : null

  // The neon driver serializes JS arrays to Postgres arrays — no
  // hand-built '{...}' literals.
  const result = await sql`
    INSERT INTO public.generation_history (
      user_id, prompt, aspect_ratio, image_urls, blob_urls, metadata
    )
    VALUES (
      ${userId}, ${prompt}, ${aspectRatio || null},
      ${storedImageUrls}, ${blobUrls}, ${metadataJson}
    )
    RETURNING *
  `

  // Enforce retention on write: the UI, the client caches, and GET all cap at
  // RETENTION_LIMIT items, so anything older is an invisible ghost row — and
  // ghost rows are what "resurrected" deleted history after a Clear All.
  // Never let a prune failure fail the save.
  try {
    await sql`
      DELETE FROM public.generation_history
      WHERE user_id = ${userId} AND id NOT IN (
        SELECT id FROM public.generation_history
        WHERE user_id = ${userId}
        ORDER BY created_at DESC, id DESC
        LIMIT ${RETENTION_LIMIT}
      )
    `
  } catch (pruneError) {
    console.error('[v0] History store: retention prune failed:', pruneError)
  }

  return {
    id: result[0].id.toString(),
    prompt: result[0].prompt,
    aspectRatio: result[0].aspect_ratio,
    imageUrls: result[0].blob_urls || result[0].image_urls,
    metadata: parseHistoryMetadata(result[0].metadata),
    timestamp: new Date(result[0].created_at).getTime(),
  }
}
