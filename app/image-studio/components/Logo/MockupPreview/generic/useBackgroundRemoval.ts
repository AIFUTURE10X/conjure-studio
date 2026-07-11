"use client"

/**
 * Background Removal Hook
 *
 * Handles background removal for logos and custom product images.
 * Extracted from GenericMockup to keep components under 300 lines.
 */

import { useCallback, MutableRefObject } from 'react'

interface UseBackgroundRemovalConfig {
  effectiveLogoUrl: string | undefined
  effectiveProductImageUrl: string | undefined
  isRemovingBg: boolean
  setIsRemovingBg: (isRemoving: boolean) => void
  setProcessedLogoUrl: (url: string | null) => void
  setProcessedProductUrl: (url: string | null) => void
  onProcessedLogoChangeRef: MutableRefObject<((url: string | null) => void) | undefined>
}

export function useBackgroundRemoval({
  effectiveLogoUrl,
  effectiveProductImageUrl,
  isRemovingBg,
  setIsRemovingBg,
  setProcessedLogoUrl,
  setProcessedProductUrl,
  onProcessedLogoChangeRef,
}: UseBackgroundRemovalConfig) {
  const handleRemoveBackground = useCallback(async () => {
    // Determine which image to process - logo first, then custom product
    const imageToProcess = effectiveLogoUrl || effectiveProductImageUrl
    const isProcessingProduct = !effectiveLogoUrl && !!effectiveProductImageUrl

    if (!imageToProcess || isRemovingBg) return

    setIsRemovingBg(true)
    try {
      // Fetch the image
      const response = await fetch(imageToProcess)
      const blob = await response.blob()
      const file = new File([blob], 'image.png', { type: 'image/png' })

      // fal (BiRefNet) — same method as the working BG Remover tool; the
      // server falls back to PhotoRoom automatically if FAL_KEY is unset.
      const formData = new FormData()
      formData.append('image', file)
      formData.append('bgRemovalMethod', 'fal')
      formData.append('isLogoContext', 'true') // Enable text-preserving params for logos with taglines

      const result = await fetch('/api/remove-background', {
        method: 'POST',
        body: formData,
      })

      const data = await result.json()
      if (data.success && data.image) {
        const processedUrl = data.image
        console.log('[BG Removal] SUCCESS! New URL:', processedUrl?.substring(0, 60))
        if (isProcessingProduct) {
          setProcessedProductUrl(processedUrl)
        } else {
          // Update local state first
          console.log('[BG Removal] Step 1: Setting local processedLogoUrl')
          setProcessedLogoUrl(processedUrl)

          // CRITICAL: Notify parent via ref (must happen for lightbox to work)
          // The ref is updated synchronously on each render, so it should always be current
          console.log('[BG Removal] Step 2: Checking parent callback ref...')
          console.log('[BG Removal] onProcessedLogoChangeRef.current exists?', !!onProcessedLogoChangeRef.current)

          if (onProcessedLogoChangeRef.current) {
            console.log('[BG Removal] Step 3: Calling parent callback with URL:', processedUrl?.substring(0, 50))
            try {
              onProcessedLogoChangeRef.current(processedUrl)
              console.log('[BG Removal] Step 4: Parent callback completed successfully')
            } catch (callbackErr) {
              console.error('[BG Removal] ERROR: Parent callback threw:', callbackErr)
            }
          } else {
            console.warn('[BG Removal] WARNING: Parent callback is undefined! Lightbox may show original image.')
            console.warn('[BG Removal] This happens when GenericMockup is rendered without onProcessedLogoChange prop')
          }
        }
      } else {
        console.error('[BG Removal] API returned error:', data.error)
      }
    } catch (error) {
      console.error('[GenericMockup] Background removal error:', error)
    } finally {
      setIsRemovingBg(false)
    }
  }, [effectiveLogoUrl, effectiveProductImageUrl, isRemovingBg, setIsRemovingBg, setProcessedLogoUrl, setProcessedProductUrl, onProcessedLogoChangeRef])

  return { handleRemoveBackground }
}
