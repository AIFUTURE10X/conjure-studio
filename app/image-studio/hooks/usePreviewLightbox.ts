"use client"

/**
 * Shared state for opening the studio's ImageLightbox from a grid of
 * thumbnails (Favorites, History). Keeps index/navigation/download logic in
 * one place so each panel only wires clicks.
 */

import { useCallback, useState } from 'react'

export interface PreviewImage {
  url: string
  prompt?: string
}

export function usePreviewLightbox(images: PreviewImage[]) {
  const [index, setIndex] = useState<number | null>(null)

  const open = useCallback((imageIndex: number) => setIndex(imageIndex), [])
  const close = useCallback(() => setIndex(null), [])

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      setIndex((current) => {
        if (current === null || images.length === 0) return current
        return direction === 'prev'
          ? (current - 1 + images.length) % images.length
          : (current + 1) % images.length
      })
    },
    [images.length],
  )

  const download = useCallback(async () => {
    if (index === null) return
    const image = images[index]
    if (!image?.url) return
    try {
      const response = await fetch(image.url, { mode: 'cors', cache: 'no-cache' })
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `image-${index + 1}-${Date.now()}.png`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      }, 100)
    } catch (error) {
      console.error('[v0] Lightbox download failed:', error)
    }
  }, [index, images])

  return { index, isOpen: index !== null, open, close, navigate, download }
}
