import { getUserId } from '@/lib/user-id'
import { indexedDBHelper } from '@/lib/db/indexedDB'
import {
  addDeletedId,
  addDeletedUrls,
  clearTombstones,
  getDeletedIds,
  getDeletedUrls,
  isTombstoned,
} from '@/lib/history-tombstones'
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
const MAX_HISTORY_ITEMS = 100

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
        // Adopt Neon's id for the cached copy. The cache was written under a
        // client UUID, but Neon assigns its own serial id — leaving both in
        // play means a later delete tombstones/DELETEs an id Neon has never
        // heard of, and the sync resurrects the row. One id everywhere fixes
        // that at the root.
        const savedId = (responseData as { historyItem?: { id?: unknown } })?.historyItem?.id
        if (savedId != null && String(savedId) !== newItem.id && !String(savedId).startsWith('local-')) {
          reidentifyCachedItem(newItem.id, String(savedId))
        }
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

/** Rewrite a cached item's id (localStorage + IndexedDB) after Neon assigns one. */
function reidentifyCachedItem(oldId: string, newId: string): void {
  try {
    const history = getHistory()
    const index = history.findIndex((item) => item.id === oldId)
    if (index === -1) return
    history[index] = { ...history[index], id: newId }
    persistHistoryCache(history)
    void indexedDBHelper.removeHistoryItem(oldId).catch(() => {})
  } catch (error) {
    console.error('[v0] Failed to adopt Neon history id:', error)
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
  const deletedUrls = getDeletedUrls()
  const clean = (items: HistoryItem[]) =>
    items
      .filter((item) => item.imageUrls && item.imageUrls.length > 0 && !isTombstoned(item, deletedIds, deletedUrls))
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
    const deletedUrls = getDeletedUrls()
    console.log('[v0] Syncing history from Neon for user:', userId)
    console.log('[v0] Filtering out', deletedIds.size, 'deleted ids /', deletedUrls.size, 'deleted urls')

    const response = await fetch(`/api/history?userId=${userId}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] Neon API error:', response.status, errorText)
      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    // Filter out items that were deleted locally — by id, or by image URL for
    // rows whose Neon id never matched the cached copy (legacy UUID cache ids).
    const neonHistory = (data.history as HistoryItem[]).filter(
      item => !isTombstoned(item, deletedIds, deletedUrls)
    )

    console.log('[v0] Synced history from Neon:', neonHistory.length, 'items (after filtering deleted)')

    // Merge against the DURABLE cache (not just localStorage) so the sync is
    // strictly additive — it can add new/changed Neon items but never drops the
    // already-persisted ones (which is what the reopen auto-sync depends on).
    const localHistory = (await getHistoryDurable()).filter(item => !isTombstoned(item, deletedIds, deletedUrls))
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
  const existingIds = new Set(neonHistory.map(h => h.id))

  // Add local items that don't exist in Neon. Skip blank entries (no image) —
  // an empty imageUrls array matches nothing, so it would otherwise always be
  // appended as a duplicate blank card next to its real Neon row. Match on the
  // durable id as well as image URLs so an already-synced row can't reappear as
  // a second card if its stored URL was rewritten server-side.
  for (const item of localHistory) {
    if (!item.imageUrls || item.imageUrls.length === 0) continue
    if (existingIds.has(item.id)) continue
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
    // Track the deleted id AND the item's image URLs so no sync can bring it
    // back — the URL tombstone covers rows whose Neon id differs from the
    // cached id (legacy UUID entries) or whose Neon DELETE fails below.
    addDeletedId(id)
    try {
      const cached = (await getHistoryDurable()).find((item) => item.id === id)
        ?? getHistory().find((item) => item.id === id)
      addDeletedUrls(cached?.imageUrls)
    } catch {
      // Tombstoning by id still applies.
    }

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

    // Track everything as deleted first — ids and image URLs — so the wipe
    // sticks even if some Neon deletes below fail.
    for (const item of history) {
      addDeletedId(item.id)
      addDeletedUrls(item.imageUrls)
    }

    // Clear the durable IndexedDB cache and localStorage
    await indexedDBHelper.clearAllHistory().catch(() => {})
    localStorage.removeItem(HISTORY_KEY)

    // Delete each item from Neon
    let allRemoteDeletesSucceeded = true
    for (const item of history) {
      try {
        const response = await fetch(`/api/history?id=${encodeURIComponent(item.id)}&userId=${encodeURIComponent(getUserId())}`, {
          method: 'DELETE'
        })
        if (!response.ok) allRemoteDeletesSucceeded = false
      } catch (err) {
        allRemoteDeletesSucceeded = false
        console.error('[v0] Failed to delete item from Neon:', item.id, err)
      }
    }

    // Only drop the tombstones once the cloud is confirmed clean. Clearing
    // them after failed deletes is what used to resurrect the entire history
    // on the next sync.
    if (allRemoteDeletesSucceeded) {
      clearTombstones()
      console.log('[v0] Cleared all history from local caches and Neon')
    } else {
      console.warn('[v0] Some Neon deletes failed — keeping tombstones so the wipe survives future syncs')
    }
  } catch (error) {
    console.error("[v0] Error clearing history:", error)
  }
}

// User ID now imported from unified @/lib/user-id
