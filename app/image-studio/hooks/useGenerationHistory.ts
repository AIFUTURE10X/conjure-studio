"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { addToHistory, getAllHistory, deleteHistoryItem, type HistoryItem } from '@/lib/db/historyService'

export type { HistoryItem }

export function useGenerationHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const savingRef = useRef(false) // Use ref to avoid stale closure issues

  const loadHistory = useCallback(async () => {
    setIsLoading(true)
    console.log('[v0] useGenerationHistory: Loading history...')

    try {
      const loaded = await getAllHistory()
      console.log('[v0] useGenerationHistory: Loaded', loaded.length, 'items')
      setHistory(loaded)
    } catch (error) {
      console.error('[v0] useGenerationHistory: Load failed:', error)
      setHistory([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveToHistory = useCallback(async (
    prompt: string,
    aspectRatio: string,
    imageUrls: string[],
    metadata?: HistoryItem['metadata']
  ): Promise<HistoryItem | null> => {
    console.log('[v0] useGenerationHistory: saveToHistory called!')
    console.log('[v0] useGenerationHistory: prompt:', prompt?.substring(0, 50) + '...')
    console.log('[v0] useGenerationHistory: imageUrls:', imageUrls?.length)
    console.log('[v0] useGenerationHistory: savingRef.current:', savingRef.current)

    // Use ref to check - avoids stale closure issues
    if (savingRef.current) {
      console.log('[v0] useGenerationHistory: Already saving, skipping duplicate request')
      return null
    }

    savingRef.current = true
    setIsSaving(true)
    console.log('[v0] useGenerationHistory: Starting save to history service...')

    try {
      const result = await addToHistory(prompt, aspectRatio, imageUrls, metadata)

      if (result) {
        console.log('[v0] useGenerationHistory: Saved successfully, ID:', result.id)
        setHistory(prev => [result, ...prev])
      } else {
        console.error('[v0] useGenerationHistory: Save returned null')
      }

      return result
    } catch (error) {
      console.error('[v0] useGenerationHistory: Save failed:', error)
      return null
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }, []) // Remove isSaving from deps since we use ref now

  const removeFromHistory = useCallback(async (id: string): Promise<boolean> => {
    console.log('[v0] useGenerationHistory: Removing item:', id)

    const success = await deleteHistoryItem(id)

    if (success) {
      setHistory(prev => prev.filter(item => item.id !== id))
    }

    return success
  }, [])

  const refresh = useCallback(async () => {
    console.log('[v0] useGenerationHistory: Refreshing...')
    await loadHistory()
  }, [loadHistory])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return {
    history,
    isLoading,
    isSaving,
    saveToHistory,
    removeFromHistory,
    refresh
  }
}
