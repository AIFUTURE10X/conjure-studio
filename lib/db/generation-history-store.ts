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

/** Insert attempts before a generation is declared unsaved. */
const INSERT_ATTEMPTS = 3

/**
 * Thrown when the row could not be inserted after every retry. Carries the
 * Blob URLs that *were* uploaded, so the caller can hand the client a cheap
 * (URL-sized, never base64) retry payload instead of losing the images.
 */
export class HistoryInsertError extends Error {
  constructor(message: string, readonly blobUrls: string[], readonly cause?: unknown) {
    super(message)
    this.name = 'HistoryInsertError'
  }
}

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

  // A single-attempt INSERT turns one transient Neon HTTP hiccup into a
  // permanently missing history row for an image the user already generated
  // (and paid credits for). Retry — and before each retry, check whether the
  // previous attempt actually landed, so a lost response can't duplicate the
  // card. blob_urls is unique per attempt (Date.now()-keyed names), which is
  // what makes that probe exact.
  //
  // RETURNING lists columns instead of *: image_urls can hold full base64 data
  // URIs when a Blob upload fell back, and echoing megabytes back through the
  // Neon HTTP driver is the same overflow that once 500'd every history read.
  let result: Record<string, unknown>[] | undefined
  let lastError: unknown
  for (let attempt = 1; attempt <= INSERT_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      try {
        const existing = await sql`
          SELECT id, prompt, aspect_ratio, created_at
          FROM public.generation_history
          WHERE user_id = ${userId} AND blob_urls = ${blobUrls}::text[]
          ORDER BY id DESC
          LIMIT 1
        `
        if (existing.length > 0) {
          console.log('[v0] History store: previous insert had landed after all, id', existing[0].id)
          result = existing
          break
        }
      } catch (probeError) {
        console.error('[v0] History store: duplicate probe failed, retrying insert anyway:', probeError)
      }
    }

    try {
      result = await sql`
        INSERT INTO public.generation_history (
          user_id, prompt, aspect_ratio, image_urls, blob_urls, metadata
        )
        VALUES (
          ${userId}, ${prompt}, ${aspectRatio || null},
          ${storedImageUrls}, ${blobUrls}, ${metadataJson}
        )
        RETURNING id, prompt, aspect_ratio, created_at
      `
      break
    } catch (error) {
      lastError = error
      console.error(`[v0] History store: insert attempt ${attempt}/${INSERT_ATTEMPTS} failed:`, error)
      if (attempt < INSERT_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt))
      }
    }
  }

  if (!result || result.length === 0) {
    throw new HistoryInsertError(
      'Failed to insert generation history row after retries',
      blobUrls.filter((url) => /^https?:\/\//.test(url)),
      lastError,
    )
  }

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

  // Echo the values we just wrote rather than re-reading the heavy columns.
  const row = result[0]
  return {
    id: String(row.id),
    prompt: (row.prompt as string) ?? prompt,
    aspectRatio: (row.aspect_ratio as string | null) ?? null,
    imageUrls: blobUrls,
    metadata: parseHistoryMetadata(metadataJson),
    timestamp: new Date(row.created_at as string).getTime(),
  }
}
