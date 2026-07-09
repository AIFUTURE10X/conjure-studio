/**
 * Logo History Types
 *
 * Shared type definitions for logo history hooks and components
 */

export interface LogoHistoryItem {
  id: string
  timestamp: number
  imageUrl: string
  prompt: string
  negativePrompt?: string
  presetId?: string
  config?: Record<string, any>
  seed?: number
  isFavorited: boolean
  rating?: 1 | 2 | 3 | 4 | 5
  style?: string
}

export interface LogoHistoryState {
  items: LogoHistoryItem[]
  isLoading: boolean
  isSyncing: boolean
}
