import { getUserId } from '@/lib/user-id'
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
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory))
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
    console.log("[v0] History retrieved from localStorage:", parsed.length, "items")
    return parsed
  } catch (error) {
    console.error("[v0] Error loading history:", error)
    return []
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

    // Merge with localStorage and update (also filter deleted from local)
    const localHistory = getHistory().filter(item => !deletedIds.has(item.id))
    const mergedHistory = mergeHistories(neonHistory, localHistory)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(mergedHistory))

    return {
      success: true,
      data: mergedHistory,
      syncedCount: neonHistory.length
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Failed to sync from Neon:', errorMessage)
    return {
      success: false,
      data: getHistory(),
      error: errorMessage,
      syncedCount: 0
    }
  }
}

function mergeHistories(neonHistory: HistoryItem[], localHistory: HistoryItem[]): HistoryItem[] {
  const merged = [...neonHistory]
  const existingUrls = new Set(neonHistory.flatMap(h => h.imageUrls))
  
  // Add local items that don't exist in Neon
  for (const item of localHistory) {
    const hasMatch = item.imageUrls.some(url => existingUrls.has(url))
    if (!hasMatch) {
      merged.push(item)
    }
  }
  
  // Sort by timestamp and limit
  return merged
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_HISTORY_ITEMS)
}

export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    // Track deleted ID to prevent it from coming back on sync
    addDeletedId(id)

    // Remove from localStorage immediately
    const history = getHistory()
    const filtered = history.filter((item) => item.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered))

    // Also delete from Neon database
    try {
      const response = await fetch(`/api/history?id=${encodeURIComponent(id)}`, {
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
    const history = getHistory()

    // Track all IDs as deleted first
    for (const item of history) {
      addDeletedId(item.id)
    }

    // Clear localStorage
    localStorage.removeItem(HISTORY_KEY)

    // Delete each item from Neon
    for (const item of history) {
      try {
        await fetch(`/api/history?id=${encodeURIComponent(item.id)}`, {
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
