"use client"

/**
 * Hook for mockup photo generation logic
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { GenerationStatus } from './mockup-generator-constants'

export type MockupGenerationResult = {
  status: 'generating' | 'success' | 'error'
  product: string
  color: string
  message: string
  imageUrl?: string
}

const getKey = (product: string, color: string) => `${product}-${color}`

export function useMockupGeneration() {
  const [status, setStatus] = useState<GenerationStatus>({})
  const [lastResult, setLastResult] = useState<MockupGenerationResult | null>(null)
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({})

  const toggleProduct = useCallback((productId: string) => {
    setExpandedProducts(prev => ({ ...prev, [productId]: !prev[productId] }))
  }, [])

  const generatePhoto = useCallback(async (product: string, color: string) => {
    const key = getKey(product, color)
    setStatus(prev => ({ ...prev, [key]: 'generating' }))
    setLastResult({
      status: 'generating',
      product,
      color,
      message: `Creating the ${color} ${product} photo — usually 30–90 seconds.`,
    })

    try {
      const response = await fetch('/api/generate-mockup-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, color }),
      })

      const data = (await response.json()) as { success?: boolean; dataUrl?: string; error?: string }

      if (!response.ok || !data.success || !data.dataUrl) {
        throw new Error(data.error || 'Failed to generate')
      }

      setStatus(prev => ({ ...prev, [key]: 'success' }))
      setLastResult({
        status: 'success',
        product,
        color,
        imageUrl: data.dataUrl,
        message: `${color} ${product} photo is ready.`,
      })
      toast.success(`Generated ${product} - ${color}`)
      return true
    } catch (error) {
      setStatus(prev => ({ ...prev, [key]: 'error' }))
      const message = error instanceof Error ? error.message : 'Generation failed'
      setLastResult({
        status: 'error',
        product,
        color,
        message: `Could not create the ${color} ${product} photo: ${message}`,
      })
      toast.error(`Failed: ${product} - ${color}`)
      return false
    }
  }, [])

  return {
    status,
    lastResult,
    expandedProducts,
    toggleProduct,
    generatePhoto,
  }
}
