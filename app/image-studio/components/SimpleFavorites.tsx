"use client"

import { useState, useEffect, useCallback } from 'react'
import { addFavorite, getAllFavorites, removeFavorite, clearAllFavorites, type FavoriteImage } from '@/lib/db/dbService'

// Re-export components for backward compatibility
export { FavoriteButton } from './Favorites/FavoriteButton'
export { FavoritesModal } from './Favorites/FavoritesModal'

async function readFavorites(): Promise<FavoriteImage[]> {
  console.log('[v0] Loading favorites via service layer')
  return getAllFavorites()
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [togglingUrls, setTogglingUrls] = useState<Set<string>>(new Set())

  const loadFavorites = useCallback(async () => {
    setIsLoading(true)

    try {
      const loaded = await readFavorites()
      console.log('[v0] Loaded favorites:', loaded.length)
      setFavorites(loaded)
    } catch (error) {
      console.error('[v0] Error loading favorites:', error)
      setFavorites([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void readFavorites()
      .then((loaded) => {
        console.log('[v0] Loaded favorites:', loaded.length)
        if (active) setFavorites(loaded)
      })
      .catch((error) => {
        console.error('[v0] Error loading favorites:', error)
        if (active) setFavorites([])
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const toggleFavorite = async (url: string, metadata?: FavoriteImage['metadata']) => {
    if (togglingUrls.has(url)) {
      console.log('[v0] Already toggling this URL, ignoring duplicate request')
      return
    }

    setTogglingUrls(prev => new Set(prev).add(url))

    try {
      const currentFavorites = await getAllFavorites()
      const exists = currentFavorites.find(f => f.url === url)

      console.log('[v0] Toggle favorite:', { url, exists: !!exists, alreadyFavorited: !!exists })

      if (exists) {
        console.log('[v0] Removing favorite (already exists)')
        await removeFavorite(exists.id)
        setFavorites(prev => prev.filter(f => f.id !== exists.id))
      } else {
        console.log('[v0] Adding new favorite')
        const newFavorite = await addFavorite(url, metadata)
        setFavorites(prev => [newFavorite, ...prev])
      }
    } catch (error) {
      console.error('[v0] Error toggling favorite:', error)
    } finally {
      setTogglingUrls(prev => {
        const newSet = new Set(prev)
        newSet.delete(url)
        return newSet
      })
    }
  }

  const isFavorite = (url: string) => favorites.some(f => f.url === url)
  const isToggling = (url: string) => togglingUrls.has(url)

  const clearAll = async () => {
    try {
      console.log('[v0] Clearing all favorites via service layer')
      await clearAllFavorites()
      setFavorites([])
    } catch (error) {
      console.error('[v0] Error clearing favorites:', error)
    }
  }

  return { favorites, toggleFavorite, isFavorite, isToggling, clearAll, refreshFavorites: loadFavorites, isLoading }
}
