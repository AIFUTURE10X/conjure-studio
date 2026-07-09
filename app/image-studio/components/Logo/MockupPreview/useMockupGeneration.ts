"use client"

/**
 * Hook for mockup photo generation logic
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { GenerationStatus } from './mockup-generator-constants'
import { CLOTHING_WITH_VIEWS, HATS_CATEGORY, OTHER_PRODUCTS } from './mockup-generator-constants'

export function useMockupGeneration() {
  const [status, setStatus] = useState<GenerationStatus>({})
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({})
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({})

  const getKey = (product: string, color: string) => `${product}-${color}`

  const toggleProduct = useCallback((productId: string) => {
    setExpandedProducts(prev => ({ ...prev, [productId]: !prev[productId] }))
  }, [])

  const generatePhoto = useCallback(async (product: string, color: string, skipExisting = true) => {
    const key = getKey(product, color)
    setStatus(prev => ({ ...prev, [key]: 'generating' }))

    try {
      const response = await fetch('/api/generate-mockup-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, color, saveToFile: true, skipExisting }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate')
      }

      // Check if it was skipped (already exists)
      if (data.skipped) {
        setStatus(prev => ({ ...prev, [key]: 'skipped' }))
        toast.info(`Skipped ${product} - ${color} (already exists)`)
        return true
      }

      setStatus(prev => ({ ...prev, [key]: 'success' }))
      setGeneratedImages(prev => ({ ...prev, [key]: data.dataUrl }))
      toast.success(`Generated ${product} - ${color}`)
      return true
    } catch (error) {
      setStatus(prev => ({ ...prev, [key]: 'error' }))
      toast.error(`Failed: ${product} - ${color}`)
      return false
    }
  }, [])

  const generateAll = useCallback(async () => {
    setIsGeneratingAll(true)
    let successCount = 0
    let totalCount = 0

    // Generate clothing with views
    for (const product of CLOTHING_WITH_VIEWS) {
      for (const color of product.colors) {
        // Front
        totalCount++
        if (await generatePhoto(product.id, color)) successCount++
        await new Promise(r => setTimeout(r, 1000))
        // Back
        totalCount++
        if (await generatePhoto(product.id, `${color}-back`)) successCount++
        await new Promise(r => setTimeout(r, 1000))
        // Side
        totalCount++
        if (await generatePhoto(product.id, `${color}-side`)) successCount++
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    // Generate hats (caps and beanies)
    for (const hatItem of HATS_CATEGORY.items) {
      for (const color of hatItem.colors) {
        totalCount++
        if (await generatePhoto(hatItem.id, color)) successCount++
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    // Generate other products
    for (const product of OTHER_PRODUCTS) {
      for (const color of product.colors) {
        totalCount++
        if (await generatePhoto(product.id, color)) successCount++
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    setIsGeneratingAll(false)
    toast.success(`Generated ${successCount}/${totalCount} photos`)
  }, [generatePhoto])

  return {
    status,
    isGeneratingAll,
    generatedImages,
    expandedProducts,
    toggleProduct,
    generatePhoto,
    generateAll,
  }
}
