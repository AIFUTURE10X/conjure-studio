import { getUserId } from '@/lib/user-id'
import { indexedDBHelper } from '@/lib/db/indexedDB'
import type { CreativeDirectionState } from '@/app/image-studio/constants/creative-direction-options'

export type HistoryItem = {
  id: string
  prompt: string
  aspectRatio: string
  imageUrls: string[]
  timestamp: number
  metadata?: {
    style?: string
    dimensions?: string
    fileSize?: string
    creativeDirection?: CreativeDirectionState
  }
}

const HISTORY_KEY = "image_generation_history"
const DELETED_IDS_KEY = "history_deleted_ids"
const MAX_HISTORY_ITEMS = 100

// Track deleted IDs to prevent them from coming back on sync
function getDeletedIds(): Set<string> {
  try {
    const data = localStorage.getItem(DELETED_IDS_KEY)
    return data ? new Set(JSON.parse(data)) : new Set()
  } catch {
    return new Set()
  }
}

function addDeletedId(id: string): void {
  try {
    const existing = getDeletedIds()
    existing.add(id)
    // Keep only last 500 deleted IDs to prevent unbounded growth
    const arr = Array.from(existing).slice(-500)
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(arr))
  } catch (err) {
    console.error('[v0] Failed to save deleted ID:', err)
  }
}

/**
 * Persist the history cache to localStorage without ever throwing. localStorage
 * is a best-effort cache (Neon is the source of truth), but older entries can
 * embed multi-MB base64 data URIs that blow past the ~5MB quota. Cache only
 * lightweight, displayable entries — drop items whose only image is a base64
 * data URI (they come back from Neon on sync) and any with no image at all, so
 * an emptied entry can't resurface as a blank card after a merge. Then
 * progressively trim the item count, and finally give up silently — a failed
 * cache write must never break a sync or a save.
 */
function persistHistoryCache(items: HistoryItem[]): void {
  // Durable cache: IndexedDB has a large quota, so store the FULL items
  // (including base64 data URIs) and accumulate them across syncs. This is what
  // lets already-synced history survive a reopen without re-syncing. Fire-and-
  // forget; on failure we still have the localStorage copy + Neon.
  const durable = items.filter((item) => item.imageUrls && item.imageUrls.length > 0)
  void indexedDBHelper.putHistoryItems(durable as unknown as { id: string; timestamp: number }[]).catch((err) => {
    console.error('[v0] Failed to persist history to IndexedDB:', err)
  })

  // Fast synchronous fallback in localStorage — only lightweight, displayable
  // entries (drop data URIs to fit the ~5MB quota; trim the count if needed).
  const lightweight = items.filter(
    (item) => item.imageUrls?.length && item.imageUrls.every((url) => !url.startsWith('data:')),
  )
  const candidates = [lightweight, lightweight.slice(0, 50), lightweight.slice(0, 20)]
  for (const candidate of candidates) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(candidate))
      return
    } catch {
      // Payload still too large for the quota — try a smaller slice.
    }
  }
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    // Nothing more we can do; Neon still has the data.
  }
}

export async function saveToHistory(
  prompt: string,
  aspectRatio: string,
  imageUrls: string[],
  metadata?: { style?: string; dimensions?: string; fileSize?: string; creativeDirection?: CreativeDirectionState }
): Promise<void> {
  try {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      prompt,
      aspectRatio,
      imageUrls,
      timestamp: Date.now(),
      metadata,
    }

    console.log("[v0] Saving history item:", newItem)

    // Save to localStorage immediately for fast access
    const history = getHistory()
    history.unshift(newItem)
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS)
    persistHistoryCache(trimmedHistory)
    console.log("[v0] History saved to localStorage. Total items:", trimmedHistory.length)

    // Also save to Neon for persistence
    try {
      const userId = getUserId()
      console.log('[v0] Saving to Neon API for userId:', userId)
      console.log('[v0] POST /api/history with:', { userId, prompt: prompt.substring(0, 50) + '...', aspectRatio, imageUrls: imageUrls.length + ' images' })

      const response = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          prompt,
          aspectRatio,
          imageUrls,
          metadata
        })
      })

      const responseData = await response.json()

      if (response.ok) {
        console.log('[v0] ✅ History saved to Neon database:', responseData)
      } else {
        console.error('[v0] ❌ Failed to save history to Neon:', response.status, responseData)
      }
    } catch (error) {
      console.error('[v0] ❌ API save failed, using localStorage only:', error)
    }
  } catch (error) {
    console.error("[v0] Error saving to history:", error)
  }
}

export function getHistory(): HistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (!stored) {
      console.log("[v0] No history found in localStorage")
      return []
    }
    const parsed = JSON.parse(stored) as HistoryItem[]
    // Drop blank entries (no image) so they can't render as empty cards.
    const items = parsed.filter((item) => item.imageUrls && item.imageUrls.length > 0)
    console.log("[v0] History retrieved from localStorage:", items.length, "items")
    return items
  } catch (error) {
    console.error("[v0] Error loading history:", error)
    return []
  }
}

/**
 * Durable history read used by the panel on open. Prefers the large-quota
 * IndexedDB cache so already-synced items survive a reopen with no re-sync;
 * on first run after the IndexedDB upgrade it seeds from the legacy localStorage
 * cache, and it falls back to localStorage if IndexedDB is unavailable.
 */
export async function getHistoryDurable(): Promise<HistoryItem[]> {
  const deletedIds = getDeletedIds()
  const clean = (items: HistoryItem[]) =>
    items
      .filter((item) => item.imageUrls && item.imageUrls.length > 0 && !deletedIds.has(item.id))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_HISTORY_ITEMS)

  try {
    const stored = (await indexedDBHelper.getAllHistoryItems()) as unknown as HistoryItem[]
    if (stored.length > 0) return clean(stored)

    // First run after the IndexedDB upgrade — migrate the localStorage cache.
    const local = getHistory()
    if (local.length > 0) {
      await indexedDBHelper
        .putHistoryItems(local as unknown as { id: string; timestamp: number }[])
        .catch(() => {})
    }
    return clean(local)
  } catch (error) {
    console.error('[v0] IndexedDB history read failed, using localStorage:', error)
    return clean(getHistory())
  }
}

export type SyncResult = {
  success: boolean
  data: HistoryItem[]
  error?: string
  syncedCount: number
}

export async function syncHistoryFromNeon(): Promise<SyncResult> {
  try {
    const userId = getUserId()
    const deletedIds = getDeletedIds()
    console.log('[v0] Syncing history from Neon for user:', userId)
    console.log('[v0] Filtering out', deletedIds.size, 'deleted items')

    const response = await fetch(`/api/history?userId=${userId}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] Neon API error:', response.status, errorText)
      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    // Filter out items that were deleted locally
    const neonHistory = (data.history as HistoryItem[]).filter(
      item => !deletedIds.has(item.id)
    )

    console.log('[v0] Synced history from Neon:', neonHistory.length, 'items (after filtering deleted)')

    // Merge against the DURABLE cache (not just localStorage) so the sync is
    // strictly additive — it can add new/changed Neon items but never drops the
    // already-persisted ones (which is what the reopen auto-sync depends on).
    const localHistory = (await getHistoryDurable()).filter(item => !deletedIds.has(item.id))
    const mergedHistory = mergeHistories(neonHistory, localHistory)
    persistHistoryCache(mergedHistory)

    return {
      success: true,
      data: mergedHistory,
      syncedCount: neonHistory.length
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Failed to sync from Neon:', errorMessage)
    // On failure keep whatever is durably cached instead of shrinking to the
    // (possibly smaller/empty) localStorage copy.
    return {
      success: false,
      data: await getHistoryDurable(),
      error: errorMessage,
      syncedCount: 0
    }
  }
}

function mergeHistories(neonHistory: HistoryItem[], localHistory: HistoryItem[]): HistoryItem[] {
  const merged = [...neonHistory]
  const existingUrls = new Set(neonHistory.flatMap(h => h.imageUrls))
  
  // Add local items that don't exist in Neon. Skip blank entries (no image) —
  // an empty imageUrls array matches nothing, so it would otherwise always be
  // appended as a duplicate blank card next to its real Neon row.
  for (const item of localHistory) {
    if (!item.imageUrls || item.imageUrls.length === 0) continue
    const hasMatch = item.imageUrls.some(url => existingUrls.has(url))
    if (!hasMatch) {
      merged.push(item)
    }
  }

  // Drop any blank entries (including from Neon), sort by timestamp, and limit.
  return merged
    .filter(item => item.imageUrls && item.imageUrls.length > 0)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_HISTORY_ITEMS)
}

export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    // Track deleted ID to prevent it from coming back on sync
    addDeletedId(id)

    // Remove from the durable IndexedDB cache and localStorage immediately
    void indexedDBHelper.removeHistoryItem(id).catch(() => {})
    const history = getHistory()
    const filtered = history.filter((item) => item.id !== id)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered))
    } catch {
      // localStorage quota — the durable IndexedDB delete above is what matters.
    }

    // Also delete from Neon database
    try {
      const response = await fetch(`/api/history?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(getUserId())}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        console.log('[v0] Deleted from Neon:', id)
      } else {
        console.error('[v0] Failed to delete from Neon:', response.status)
      }
    } catch (apiError) {
      console.error('[v0] API delete failed (item still tracked as deleted):', apiError)
    }
  } catch (error) {
    console.error("[v0] Error deleting history item:", error)
  }
}

export async function clearHistory(): Promise<void> {
  try {
    // Use the durable cache so we clear everything, not just the localStorage subset.
    const history = await getHistoryDurable()

    // Track all IDs as deleted first
    for (const item of history) {
      addDeletedId(item.id)
    }

    // Clear the durable IndexedDB cache and localStorage
    await indexedDBHelper.clearAllHistory().catch(() => {})
    localStorage.removeItem(HISTORY_KEY)

    // Delete each item from Neon
    for (const item of history) {
      try {
        await fetch(`/api/history?id=${encodeURIComponent(item.id)}&userId=${encodeURIComponent(getUserId())}`, {
          method: 'DELETE'
        })
      } catch (err) {
        console.error('[v0] Failed to delete item from Neon:', item.id, err)
      }
    }

    // Clear deleted IDs tracking since DB is now clean
    localStorage.removeItem(DELETED_IDS_KEY)
    console.log('[v0] Cleared all history from localStorage and Neon')
  } catch (error) {
    console.error("[v0] Error clearing history:", error)
  }
}

// User ID now imported from unified @/lib/user-id
