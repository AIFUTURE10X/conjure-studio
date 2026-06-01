/**
 * useBatchGeneration Hook
 *
 * Manages parallel logo generation with 4 different seeds
 */

import { useState, useCallback } from 'react'
import { GeneratedLogo, LogoAspectRatio, LogoStyle, BgRemovalMethod, LogoTextMode } from './useLogoGeneration'

export interface BatchItem {
  id: string
  status: 'pending' | 'generating' | 'completed' | 'error'
  logo: GeneratedLogo | null
  error: string | null
  seed: number
}

export interface BatchGenerationOptions {
  prompt: string
  negativePrompt?: string
  style: LogoStyle
  bgRemovalMethod?: BgRemovalMethod
  aspectRatio?: LogoAspectRatio
  textMode?: LogoTextMode
  resolution?: '1K' | '2K' | '4K'
  baseSeed?: number // Optional base seed for variation
}

export function useBatchGeneration() {
  const [items, setItems] = useState<BatchItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Generate a random seed
  const generateSeed = () => Math.floor(Math.random() * 2147483647)

  // Generate 4 seeds with variation
  const generateSeeds = (baseSeed?: number): number[] => {
    if (baseSeed) {
      // Create variations from base seed
      return [
        baseSeed,
        baseSeed + 1000,
        baseSeed + 2000,
        baseSeed + 3000,
      ]
    }
    // Generate 4 random seeds
    return Array.from({ length: 4 }, () => generateSeed())
  }

  // Single logo generation
  const generateSingleLogo = async (
    options: BatchGenerationOptions,
    seed: number
  ): Promise<GeneratedLogo> => {
    const formData = new FormData()
    formData.append('prompt', options.prompt)
    formData.append('style', options.style)
    formData.append('bgRemovalMethod', options.bgRemovalMethod || 'replicate')
    formData.append('aspectRatio', options.aspectRatio || '1:1')
    formData.append('textMode', options.textMode || 'ai-text')
    formData.append('resolution', options.resolution || '1K')
    formData.append('seed', seed.toString())
    formData.append('skipBgRemoval', 'true')

    if (options.negativePrompt) {
      formData.append('negativePrompt', options.negativePrompt)
    }

    const response = await fetch('/api/generate-logo', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `Failed to generate logo (${response.status})`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    if (!data.image) {
      throw new Error('No logo returned from API')
    }

    return {
      url: data.image,
      prompt: options.prompt,
      style: options.style,
      aspectRatio: data.aspectRatio || options.aspectRatio || '1:1',
      textMode: data.textMode || options.textMode || 'ai-text',
      bgRemovalMethod: options.bgRemovalMethod || 'replicate',
      timestamp: Date.now(),
      seed: data.seed || seed,
    }
  }

  // Generate batch of 4 logos in parallel
  const generateBatch = useCallback(async (options: BatchGenerationOptions) => {
    setIsGenerating(true)

    const seeds = generateSeeds(options.baseSeed)

    // Initialize batch items
    const initialItems: BatchItem[] = seeds.map((seed, index) => ({
      id: `batch-${Date.now()}-${index}`,
      status: 'pending',
      logo: null,
      error: null,
      seed,
    }))

    setItems(initialItems)

    // Start all generations in parallel
    const promises = initialItems.map(async (item, index) => {
      // Update status to generating
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'generating' } : i))
      )

      try {
        const logo = await generateSingleLogo(options, item.seed)

        // Update with completed logo
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'completed', logo } : i
          )
        )

        return { success: true, id: item.id, logo }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Generation failed'

        // Update with error
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'error', error: errorMessage } : i
          )
        )

        return { success: false, id: item.id, error: errorMessage }
      }
    })

    // Wait for all to complete
    await Promise.allSettled(promises)
    setIsGenerating(false)
  }, [])

  // Retry a failed item
  const retryItem = useCallback(async (itemId: string, options: BatchGenerationOptions) => {
    const item = items.find((i) => i.id === itemId)
    // Prevent duplicate retries - check if item exists and isn't already generating
    if (!item || item.status === 'generating') return

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: 'generating', error: null } : i))
    )

    try {
      const logo = await generateSingleLogo(options, item.seed)
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: 'completed', logo } : i))
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed'
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: 'error', error: errorMessage } : i))
      )
    }
  }, [items])

  // Clear all items
  const clearBatch = useCallback(() => {
    setItems([])
    setIsGenerating(false)
  }, [])

  return {
    items,
    isGenerating,
    generateBatch,
    retryItem,
    clearBatch,
  }
}
