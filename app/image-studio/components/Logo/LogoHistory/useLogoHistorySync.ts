"use client"

/**
 * useLogoHistorySync Hook
 *
 * Handles syncing logo history with Neon database
 * Manages loading, syncing, and clearing operations
 */

import { useCallback, useRef } from 'react'
import type { LogoHistoryItem, LogoHistoryState } from './types'
import { getUserId, saveToLocal, saveToNeon } from './useLogoHistoryData'

const LOCAL_STORAGE_KEY = 'logo-history-local'
const DELETED_IDS_KEY = 'logo-history-deleted-ids'

// Module-level guard: several components mount useLogoHistory at once, and
// concurrent loadHistory calls used to re-post the same unsynced local items
// in parallel — the source of the duplicate-row bursts in Neon.
let syncInFlight = false

// Track deleted IDs to prevent them from coming back
function getDeletedIds(): Set<string> {
  try {
    const data = localStorage.getItem(DELETED_IDS_KEY)
    const ids = data ? new Set<string>(JSON.parse(data)) : new Set<string>()
    console.log('[Logo History] getDeletedIds returning', ids.size, 'deleted IDs')
    return ids
  } catch (err) {
    console.error('[Logo History] Failed to get deleted IDs:', err)
    return new Set()
  }
}

export function addDeletedIds(ids: string[]): void {
  try {
    console.log('[Logo History] addDeletedIds called with:', ids)
    const existing = getDeletedIds()
    ids.forEach(id => existing.add(id))
    // Keep only last 500 deleted IDs to prevent unbounded growth
    const arr = Array.from(existing).slice(-500)
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(arr))

    // Verify persistence
    const verified = localStorage.getItem(DELETED_IDS_KEY)
    console.log('[Logo History] Deleted IDs saved, verified count:', verified ? JSON.parse(verified).length : 0)
  } catch (err) {
    console.error('[Logo History] Failed to save deleted IDs:', err)
  }
}

function clearDeletedIds(): void {
  localStorage.removeItem(DELETED_IDS_KEY)
}

interface UseLogoHistorySyncProps {
  state: LogoHistoryState
  setState: React.Dispatch<React.SetStateAction<LogoHistoryState>>
  setSelectedForComparison: React.Dispatch<React.SetStateAction<string[]>>
}

export function useLogoHistorySync({
  state,
  setState,
  setSelectedForComparison
}: UseLogoHistorySyncProps) {

  // Load history from Neon database
  const loadHistory = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      const userId = getUserId()
      const deletedIds = getDeletedIds()

      console.log('[Logo History] Loading from Neon for user:', userId)

      const response = await fetch(`/api/logo-history?userId=${encodeURIComponent(userId)}`)

      if (!response.ok) {
        throw new Error(`Failed to load: ${response.status}`)
      }

      const data = await response.json()
      const rawCount = data.history?.length || 0
      const neonItems: LogoHistoryItem[] = (data.history || [])
        .filter((item: LogoHistoryItem) => {
          const isDeleted = deletedIds.has(item.id)
          if (isDeleted) {
            console.log('[Logo History] Filtering out deleted item:', item.id)
          }
          return !isDeleted
        })

      console.log('[Logo History] Loaded from Neon:', neonItems.length, '(filtered', rawCount - neonItems.length, 'deleted)')

      // Load local items that haven't been synced (also filter deleted)
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY)
      const localItems: LogoHistoryItem[] = localData
        ? JSON.parse(localData).filter((item: LogoHistoryItem) => !deletedIds.has(item.id))
        : []

      // Merge: Neon items take priority, add local items not in Neon
      const neonIds = new Set(neonItems.map(i => i.id))
      const neonUrls = new Set(neonItems.map(i => i.imageUrl))
      const unsynced = localItems.filter(l => !neonIds.has(l.id) && !neonUrls.has(l.imageUrl))

      // Final deduplication by imageUrl (keep most recent)
      const urlMap = new Map<string, LogoHistoryItem>()
      for (const item of [...neonItems, ...unsynced]) {
        const existing = urlMap.get(item.imageUrl)
        if (!existing || item.timestamp > existing.timestamp) {
          urlMap.set(item.imageUrl, item)
        }
      }
      const mergedItems = Array.from(urlMap.values())
        .sort((a, b) => b.timestamp - a.timestamp)

      setState({ items: mergedItems, isLoading: false, isSyncing: false })

      // Update localStorage with clean list (without deleted items)
      saveToLocal(mergedItems)

      // Sync unsynced local items to Neon. Replace each local temp item with
      // the returned server row (server id + blob URL) — otherwise the local
      // copy never matches what GET returns and gets re-posted on every load,
      // duplicating rows forever.
      if (unsynced.length > 0 && !syncInFlight) {
        syncInFlight = true
        try {
          console.log('[Logo History] Syncing', unsynced.length, 'local items to Neon')
          for (const item of unsynced) {
            const savedItem = await saveToNeon(item)
            if (savedItem) {
              setState(prev => {
                const updatedItems = prev.items.map(i => (i.id === item.id ? savedItem : i))
                saveToLocal(updatedItems)
                return { ...prev, items: updatedItems }
              })
            }
          }
        } finally {
          syncInFlight = false
        }
      }
    } catch (err) {
      console.error('[Logo History] Failed to load:', err)

      // Fallback to local storage (also filter deleted)
      const deletedIds = getDeletedIds()
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY)
      const localItems: LogoHistoryItem[] = localData
        ? JSON.parse(localData).filter((item: LogoHistoryItem) => !deletedIds.has(item.id))
        : []

      setState({ items: localItems, isLoading: false, isSyncing: false })
    }
  }, [setState])

  // Sync from cloud (refresh)
  const syncFromCloud = useCallback(async () => {
    setState(prev => ({ ...prev, isSyncing: true }))
    await loadHistory()
  }, [loadHistory, setState])

  // Clear all history
  const clearAllHistory = useCallback(async () => {
    const itemsToDelete = [...state.items]
    const idsToDelete = itemsToDelete.map(item => item.id)

    if (itemsToDelete.length === 0) {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      clearDeletedIds() // Fresh start
      setState({ items: [], isLoading: false, isSyncing: false })
      setSelectedForComparison([])
      return
    }

    console.log('[Logo History] Clearing all', itemsToDelete.length, 'items')

    // Track deleted IDs BEFORE making API calls to prevent race conditions
    addDeletedIds(idsToDelete)

    try {
      const userId = getUserId()
      const deletePromises = itemsToDelete.map(item =>
        fetch(`/api/logo-history?id=${encodeURIComponent(item.id)}&userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE'
        }).then(res => {
          if (!res.ok) throw new Error(`Failed to delete ${item.id}`)
          return item.id
        })
      )

      await Promise.all(deletePromises)
      console.log('[Logo History] All items deleted from Neon')

      localStorage.removeItem(LOCAL_STORAGE_KEY)
      clearDeletedIds() // Clear tracking since DB is now clean
      setState({ items: [], isLoading: false, isSyncing: false })
      setSelectedForComparison([])
    } catch (err) {
      console.error('[Logo History] Failed to clear all:', err)
      // Keep deleted IDs tracked even on error to prevent items coming back
    }
  }, [state.items, setState, setSelectedForComparison])

  return {
    loadHistory,
    syncFromCloud,
    clearAllHistory,
  }
}
