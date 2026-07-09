// History Service Layer - follows same pattern as dbService.ts for favorites

import { getUserId } from '@/lib/user-id'
import type { CreativeDirectionState } from '@/app/image-studio/constants/creative-direction-options'

export interface HistoryItem {
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

export async function addToHistory(
  prompt: string,
  aspectRatio: string,
  imageUrls: string[],
  metadata?: HistoryItem['metadata']
): Promise<HistoryItem | null> {
  const userId = getUserId()

  console.log('[v0] History Service: Adding to history')
  console.log('[v0] History Service: userId:', userId)
  console.log('[v0] History Service: prompt:', prompt.substring(0, 50) + '...')
  console.log('[v0] History Service: imageUrls count:', imageUrls.length)

  try {
    const response = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, prompt, aspectRatio, imageUrls, metadata })
    })

    console.log('[v0] History Service: API response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[v0] History Service: API error:', errorData)
      throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    console.log('[v0] History Service: Saved with ID:', data.historyItem?.id)

    return data.historyItem
  } catch (error) {
    console.error('[v0] History Service: API save failed:', error)
    return null
  }
}

export async function getAllHistory(): Promise<HistoryItem[]> {
  const userId = getUserId()
  console.log('[v0] History Service: Loading history for user:', userId)

  try {
    const response = await fetch(`/api/history?userId=${encodeURIComponent(userId)}`)

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const { history } = await response.json()
    console.log('[v0] History Service: Loaded:', history?.length || 0, 'items')

    return history || []
  } catch (error) {
    console.error('[v0] History Service: API load failed:', error)
    return []
  }
}

export async function deleteHistoryItem(id: string): Promise<boolean> {
  console.log('[v0] History Service: Deleting item:', id)

  try {
    const response = await fetch(`/api/history?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(getUserId())}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    console.log('[v0] History Service: Deleted successfully')
    return true
  } catch (error) {
    console.error('[v0] History Service: Delete failed:', error)
    return false
  }
}
