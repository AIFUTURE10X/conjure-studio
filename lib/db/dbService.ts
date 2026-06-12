import { indexedDBHelper } from './indexedDB'
import { getUserId } from '@/lib/user-id'

export interface FavoriteImage {
  id: string
  url: string
  blobUrl?: string
  timestamp: number
  metadata?: {
    ratio?: string
    style?: string
    dimensions?: string
    fileSize?: string
    params?: any
  }
}

export async function addFavorite(
  imageUrl: string,
  metadata?: FavoriteImage['metadata']
): Promise<FavoriteImage> {
  const userId = getUserId()
  
  console.log('[v0] Adding favorite:', { userId, imageUrl })

  try {
    // Call API route
    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, imageUrl, metadata })
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const { favorite } = await response.json()
    console.log('[v0] Saved via API with ID:', favorite.id)
    
    // Cache in IndexedDB
    await indexedDBHelper.cacheFavorite({
      id: favorite.id,
      imageUrl: favorite.url,
      timestamp: favorite.timestamp,
      metadata
    })
    console.log('[v0] Cached in IndexedDB')
    
    return favorite
  } catch (error) {
    console.error('[v0] API save failed:', error)
    // Fallback: save only to IndexedDB
    const fallbackId = `local-${Date.now()}`
    const cachedFavorite = {
      id: fallbackId,
      imageUrl,
      timestamp: Date.now(),
      metadata
    }
    await indexedDBHelper.cacheFavorite(cachedFavorite)
    
    return {
      id: fallbackId,
      url: imageUrl,
      timestamp: Date.now(),
      metadata
    }
  }
}

export async function getAllFavorites(): Promise<FavoriteImage[]> {
  const userId = getUserId()
  console.log('[v0] Loading all favorites for user:', userId)

  try {
    // Call API route
    const response = await fetch(`/api/favorites?userId=${encodeURIComponent(userId)}`)

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const { favorites } = await response.json()
    console.log('[v0] Loaded via API:', favorites.length)

    return favorites
  } catch (error) {
    console.error('[v0] API load failed, trying IndexedDB:', error)
    
    // Fallback to IndexedDB
    try {
      const cached = await indexedDBHelper.getAllCachedFavorites()
      console.log('[v0] Loaded from IndexedDB:', cached.length)
      return cached.map(c => ({
        id: c.id,
        url: c.imageUrl,
        timestamp: c.timestamp,
        metadata: c.metadata
      }))
    } catch (idbError) {
      console.error('[v0] IndexedDB load failed:', idbError)
      return []
    }
  }
}

export async function removeFavorite(id: string): Promise<void> {
  console.log('[v0] Removing favorite:', id)

  // Remove from IndexedDB
  try {
    await indexedDBHelper.deleteCachedFavorite(id)
    console.log('[v0] Removed from IndexedDB')
  } catch (error) {
    console.error('[v0] IndexedDB delete failed:', error)
  }

  // Remove from Neon via API
  try {
    const response = await fetch(`/api/favorites?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(getUserId())}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    console.log('[v0] Removed via API')
  } catch (error) {
    console.error('[v0] API delete failed:', error)
  }
}

export async function clearAllFavorites(): Promise<void> {
  const userId = getUserId()
  console.log('[v0] Clearing all favorites for user:', userId)

  // Clear IndexedDB
  try {
    await indexedDBHelper.clearAllFavorites()
    console.log('[v0] Cleared IndexedDB')
  } catch (error) {
    console.error('[v0] IndexedDB clear failed:', error)
  }

  // Get all favorites and delete them one by one
  try {
    const favorites = await getAllFavorites()
    for (const fav of favorites) {
      await removeFavorite(fav.id)
    }
    console.log('[v0] Cleared all favorites via API')
  } catch (error) {
    console.error('[v0] API clear failed:', error)
  }
}
