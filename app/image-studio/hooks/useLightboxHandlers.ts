"use client"

import { useCallback } from 'react'
import { toast } from 'sonner'
import { downloadImageAsFile } from '../utils/export-utils'
import type { GeneratedImage } from './useImageStudioState'

interface UseLightboxHandlersOptions {
  generatedImages: GeneratedImage[]
  setLightboxOpen: (open: boolean) => void
  setLightboxIndex: (index: number | ((prev: number) => number)) => void
  lightboxIndex: number
}

export interface LightboxHandlers {
  openLightbox: (index: number) => void
  closeLightbox: () => void
  navigateLightbox: (direction: 'prev' | 'next') => void
  handleDownloadFromLightbox: () => void
}

export function useLightboxHandlers({
  generatedImages,
  setLightboxOpen,
  setLightboxIndex,
  lightboxIndex,
}: UseLightboxHandlersOptions): LightboxHandlers {

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [setLightboxIndex, setLightboxOpen])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
  }, [setLightboxOpen])

  const navigateLightbox = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setLightboxIndex((prev: number) => (prev > 0 ? prev - 1 : generatedImages.length - 1))
    } else {
      setLightboxIndex((prev: number) => (prev < generatedImages.length - 1 ? prev + 1 : 0))
    }
  }, [generatedImages.length, setLightboxIndex])

  const handleDownloadFromLightbox = useCallback(async () => {
    const imageUrl = generatedImages[lightboxIndex]?.url
    if (!imageUrl) return

    try {
      await downloadImageAsFile(imageUrl, `generated-image-${lightboxIndex + 1}.png`)
      toast.success('Image downloaded')
    } catch (error) {
      console.error('[v0] Lightbox download failed:', error)
      toast.error('Download failed')
    }
  }, [generatedImages, lightboxIndex])

  return {
    openLightbox,
    closeLightbox,
    navigateLightbox,
    handleDownloadFromLightbox,
  }
}
