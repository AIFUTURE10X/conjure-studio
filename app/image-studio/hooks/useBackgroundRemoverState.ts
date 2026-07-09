"use client"

/**
 * Background Remover State Management
 *
 * Manages queue of images for background removal with batch processing support.
 * Uses fal · BiRefNet as the default method (PhotoRoom available as a fallback).
 */

import { useState, useCallback } from 'react'

// ============ Types ============

export type BgRemovalMethod = 'photoroom' | 'fal'

export interface QueueItem {
  id: string
  file: File
  fileName: string
  originalUrl: string      // Data URL preview
  processedUrl: string | null
  status: 'pending' | 'processing' | 'complete' | 'error'
  error?: string
}

export interface BackgroundRemoverState {
  queue: QueueItem[]
  selectedId: string | null
  selectedMethod: BgRemovalMethod
  isProcessingAll: boolean
  // Actions
  addToQueue: (files: File[]) => void
  removeFromQueue: (id: string) => void
  clearQueue: () => void
  setSelectedItem: (id: string | null) => void
  setSelectedMethod: (method: BgRemovalMethod) => void
  processItem: (id: string) => Promise<void>
  processAll: () => Promise<void>
  getSelectedItem: () => QueueItem | undefined
}

interface RemoveBackgroundResponse {
  image?: string
  error?: string
}

// ============ Helper Functions ============

function generateId(): string {
  return `bg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ============ Hook ============

export function useBackgroundRemoverState(): BackgroundRemoverState {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<BgRemovalMethod>('fal')
  const [isProcessingAll, setIsProcessingAll] = useState(false)

  // Add files to queue
  const addToQueue = useCallback(async (files: File[]) => {
    const newItems: QueueItem[] = await Promise.all(
      files.map(async (file) => ({
        id: generateId(),
        file,
        fileName: file.name,
        originalUrl: await fileToDataUrl(file),
        processedUrl: null,
        status: 'pending' as const,
      }))
    )

    setQueue(prev => [...prev, ...newItems])

    // Auto-select first item if nothing selected
    if (!selectedId && newItems.length > 0) {
      setSelectedId(newItems[0].id)
    }
  }, [selectedId])

  // Remove single item
  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id))
    // If removed item was selected, clear selection
    setSelectedId(prev => prev === id ? null : prev)
  }, [])

  // Clear all items
  const clearQueue = useCallback(() => {
    setQueue([])
    setSelectedId(null)
  }, [])

  // Set selected item
  const setSelectedItem = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  // Get currently selected item
  const getSelectedItem = useCallback(() => {
    return queue.find(item => item.id === selectedId)
  }, [queue, selectedId])

  // Process single item
  const processItem = useCallback(async (id: string) => {
    const item = queue.find(i => i.id === id)
    if (!item || item.status === 'processing' || item.status === 'complete') return

    // Mark as processing
    setQueue(prev => prev.map(i =>
      i.id === id ? { ...i, status: 'processing' as const, error: undefined } : i
    ))

    try {
      const formData = new FormData()
      formData.append('image', item.file)
      formData.append('bgRemovalMethod', selectedMethod)

      const response = await fetch('/api/remove-background', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json().catch((): RemoveBackgroundResponse => ({})) as RemoveBackgroundResponse

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      if (!data.image) {
        throw new Error(data.error || 'No image returned')
      }
      const processedImage = data.image

      // Mark as complete
      setQueue(prev => prev.map(i =>
        i.id === id ? { ...i, status: 'complete' as const, processedUrl: processedImage } : i
      ))
    } catch (error) {
      // Mark as error
      setQueue(prev => prev.map(i =>
        i.id === id ? {
          ...i,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error'
        } : i
      ))
    }
  }, [queue, selectedMethod])

  // Process all pending items
  const processAll = useCallback(async () => {
    const pendingItems = queue.filter(i => i.status === 'pending')
    if (pendingItems.length === 0) return

    setIsProcessingAll(true)

    // Process sequentially to avoid rate limiting
    for (const item of pendingItems) {
      await processItem(item.id)
    }

    setIsProcessingAll(false)
  }, [queue, processItem])

  return {
    queue,
    selectedId,
    selectedMethod,
    isProcessingAll,
    addToQueue,
    removeFromQueue,
    clearQueue,
    setSelectedItem,
    setSelectedMethod,
    processItem,
    processAll,
    getSelectedItem,
  }
}
