"use client"

/**
 * useLogoHistoryData Hook
 *
 * Handles CRUD operations for logo history items
 * Manages local storage backup and API interactions
 */

import { useCallback } from 'react'
import type { LogoHistoryItem, LogoHistoryState } from './types'
import { addDeletedIds, getDeletedIds } from './useLogoHistorySync'
import { getUserId } from '@/lib/user-id'

// Re-export getUserId for backward compatibility
export { getUserId }

const LOCAL_STORAGE_KEY = 'logo-history-local'

// Save to local storage as backup
export function saveToLocal(items: LogoHistoryItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items.slice(0, 100)))
  } catch (err) {
    console.error('[Logo History] Failed to save to local:', err)
  }
}

// Save item to Neon database
export async function saveToNeon(item: LogoHistoryItem): Promise<LogoHistoryItem | null> {
  try {
    const userId = getUserId()

    const response = await fetch('/api/logo-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        imageUrl: item.imageUrl,
        prompt: item.prompt,
        negativePrompt: item.negativePrompt,
        presetId: item.presetId,
        seed: item.seed,
        style: item.style,
        config: item.config,
        isFavorited: item.isFavorited,
        rating: item.rating
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to save: ${response.status}`)
    }

    const data = await response.json()
    return data.historyItem
  } catch (err) {
    console.error('[Logo History] Failed to save to Neon:', err)
    return null
  }
}

interface UseLogoHistoryDataProps {
  state: LogoHistoryState
  setState: React.Dispatch<React.SetStateAction<LogoHistoryState>>
  setSelectedForComparison: React.Dispatch<React.SetStateAction<string[]>>
}

export function useLogoHistoryData({
  state,
  setState,
  setSelectedForComparison
}: UseLogoHistoryDataProps) {
  // Add a new history item
  const addToHistory = useCallback(async (item: Omit<LogoHistoryItem, 'id' | 'timestamp' | 'isFavorited'>) => {
    console.log('[Logo History] addToHistory called, item.config:', item.config)
    console.log('[Logo History] imageUrl length:', item.imageUrl?.length, 'starts with:', item.imageUrl?.substring(0, 50))

    // Check for duplicate based on imageUrl (sufficient to prevent true duplicates)
    const existingItem = state.items.find(i => i.imageUrl === item.imageUrl)
    if (existingItem) {
      console.log('[Logo History] Image already in history, skipping duplicate, existing id:', existingItem.id)
      return existingItem.id
    }

    console.log('[Logo History] No duplicate found, proceeding to save...')

    const tempItem: LogoHistoryItem = {
      ...item,
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      isFavorited: false
    }

    setState(prev => {
      const updatedItems = [tempItem, ...prev.items].slice(0, 100)
      saveToLocal(updatedItems)
      return { ...prev, items: updatedItems }
    })

    try {
      const savedItem = await saveToNeon(tempItem)
      if (savedItem) {
        // The user may have deleted the item while the save was in flight —
        // its tombstone only names the temp id, so the fresh server row would
        // resurrect on the next sync. Delete it immediately instead.
        if (getDeletedIds().has(tempItem.id)) {
          addDeletedIds([savedItem.id])
          void fetch(`/api/logo-history?id=${encodeURIComponent(savedItem.id)}&userId=${encodeURIComponent(getUserId())}`, {
            method: 'DELETE'
          }).catch(() => {})
          console.log('[Logo History] Item deleted mid-save; removed fresh Neon row:', savedItem.id)
          return tempItem.id
        }
        setState(prev => {
          const updatedItems = prev.items.map(i => i.id === tempItem.id ? savedItem : i)
          saveToLocal(updatedItems)
          return { ...prev, items: updatedItems }
        })
        console.log('[Logo History] Saved to Neon:', savedItem.id)
      }
    } catch (err) {
      console.error('[Logo History] Failed to save:', err)
    }

    return tempItem.id
  }, [state.items, setState])

  // Toggle favorite status
  const toggleFavorite = useCallback(async (id: string) => {
    setState(prev => {
      const item = prev.items.find(i => i.id === id)
      if (!item) return prev

      const newFavorited = !item.isFavorited
      const updatedItems = prev.items.map(i =>
        i.id === id ? { ...i, isFavorited: newFavorited } : i
      )
      saveToLocal(updatedItems)

      fetch('/api/logo-history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId: getUserId(), isFavorited: newFavorited })
      }).catch(err => console.error('[Logo History] Failed to update favorite:', err))

      return { ...prev, items: updatedItems }
    })
  }, [setState])

  // Set rating
  const setRating = useCallback(async (id: string, rating: 1 | 2 | 3 | 4 | 5 | undefined) => {
    setState(prev => {
      const updatedItems = prev.items.map(item =>
        item.id === id ? { ...item, rating } : item
      )
      saveToLocal(updatedItems)

      fetch('/api/logo-history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId: getUserId(), rating })
      }).catch(err => console.error('[Logo History] Failed to update rating:', err))

      return { ...prev, items: updatedItems }
    })
  }, [setState])

  // Remove from history
  const removeFromHistory = useCallback(async (id: string) => {
    console.log('[Logo History] removeFromHistory called with id:', id)

    // Track deleted ID to prevent it from coming back
    addDeletedIds([id])

    // Immediately remove from UI
    setState(prev => {
      const updatedItems = prev.items.filter(item => item.id !== id)
      saveToLocal(updatedItems)
      return { ...prev, items: updatedItems }
    })
    setSelectedForComparison(prev => prev.filter(itemId => itemId !== id))

    // temp-/local- ids don't exist in Neon (the DELETE would 400); if a save is
    // in flight, addToHistory's tombstone check removes the fresh row itself.
    if (!/^\d+$/.test(id)) return

    try {
      const response = await fetch(`/api/logo-history?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(getUserId())}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`)
      }

      console.log('[Logo History] Deleted from Neon:', id)
    } catch (err) {
      console.error('[Logo History] Failed to delete:', err)
      // Item is already tracked as deleted, so it won't come back
    }
  }, [setState, setSelectedForComparison])

  // Get item by ID
  const getItemById = useCallback((id: string): LogoHistoryItem | undefined => {
    return state.items.find(item => item.id === id)
  }, [state.items])

  // Filter items
  const getFilteredItems = useCallback((filter: {
    favoritesOnly?: boolean
    presetId?: string
    minRating?: number
  } = {}): LogoHistoryItem[] => {
    return state.items.filter(item => {
      if (filter.favoritesOnly && !item.isFavorited) return false
      if (filter.presetId && item.presetId !== filter.presetId) return false
      if (filter.minRating && (!item.rating || item.rating < filter.minRating)) return false
      return true
    })
  }, [state.items])

  return {
    addToHistory,
    toggleFavorite,
    setRating,
    removeFromHistory,
    getItemById,
    getFilteredItems,
  }
}
