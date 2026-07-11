"use client"

/**
 * useLogoHistory Hook
 *
 * Main hook for logo generation history management
 * Combines data operations, sync, and selection management
 */

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import type { LogoHistoryItem, LogoHistoryState } from './types'
import { useLogoHistoryData, saveToLocal, getUserId } from './useLogoHistoryData'
import { useLogoHistorySync, addDeletedIds } from './useLogoHistorySync'
import { logoHistoryStore } from './logoHistoryStore'

// Re-export types for backwards compatibility
export type { LogoHistoryItem, LogoHistoryState } from './types'

export function useLogoHistory() {
  // Shared across every mounted panel (inline bar, pop-out modal, mockup
  // dropdown) — a delete in one place updates all of them at once. Selection
  // stays per-instance.
  const state = useSyncExternalStore(
    logoHistoryStore.subscribe,
    logoHistoryStore.getState,
    logoHistoryStore.getState,
  )
  const setState = logoHistoryStore.setState
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([])

  // Data operations hook
  const {
    addToHistory,
    toggleFavorite,
    setRating,
    removeFromHistory,
    getItemById,
    getFilteredItems,
  } = useLogoHistoryData({ state, setState, setSelectedForComparison })

  // Sync operations hook
  const {
    loadHistory,
    syncFromCloud,
    clearAllHistory,
  } = useLogoHistorySync({ state, setState, setSelectedForComparison })

  // Load history from Neon on mount
  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Toggle comparison selection
  const toggleComparisonSelection = useCallback((id: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id)
      }
      return [...prev, id]
    })
  }, [])

  // Clear comparison selection
  const clearComparisonSelection = useCallback(() => {
    setSelectedForComparison([])
  }, [])

  // Select all items
  const selectAll = useCallback(() => {
    setSelectedForComparison(state.items.map(item => item.id))
  }, [state.items])

  // Get items selected for comparison
  const getComparisonItems = useCallback((): LogoHistoryItem[] => {
    return selectedForComparison
      .map(id => state.items.find(item => item.id === id))
      .filter((item): item is LogoHistoryItem => item !== undefined)
  }, [selectedForComparison, state.items])

  // Delete selected items (bulk delete)
  const deleteSelected = useCallback(async () => {
    if (selectedForComparison.length === 0) return

    const idsToDelete = [...selectedForComparison]
    console.log('[Logo History] Bulk deleting', idsToDelete.length, 'items:', idsToDelete)

    // Track deleted IDs BEFORE making API calls to prevent race conditions
    addDeletedIds(idsToDelete)

    // Immediately remove from UI
    setState(prev => {
      const updatedItems = prev.items.filter(item => !idsToDelete.includes(item.id))
      saveToLocal(updatedItems)
      return { ...prev, items: updatedItems }
    })
    setSelectedForComparison([])

    try {
      const userId = getUserId()
      const deletePromises = idsToDelete.map(id =>
        fetch(`/api/logo-history?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE'
        }).then(res => {
          if (!res.ok) throw new Error(`Failed to delete ${id}`)
          return id
        })
      )

      await Promise.all(deletePromises)
      console.log('[Logo History] Bulk delete complete')
    } catch (err) {
      console.error('[Logo History] Failed to delete selected:', err)
      // Items are already tracked as deleted, so they won't come back
    }
  }, [selectedForComparison, setState])

  return {
    items: state.items,
    isLoading: state.isLoading,
    isSyncing: state.isSyncing,
    totalCount: state.items.length,
    favoritesCount: state.items.filter(i => i.isFavorited).length,

    // CRUD operations
    addToHistory,
    toggleFavorite,
    setRating,
    removeFromHistory,
    clearAllHistory,
    getItemById,
    getFilteredItems,

    // Sync
    syncFromCloud,
    refresh: loadHistory,

    // Comparison & Selection
    selectedForComparison,
    toggleComparisonSelection,
    clearComparisonSelection,
    getComparisonItems,
    canAddToComparison: selectedForComparison.length < 4,

    // Bulk selection
    selectAll,
    deleteSelected
  }
}
