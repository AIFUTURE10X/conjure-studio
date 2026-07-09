import { useState, useEffect } from 'react'
import type { CreativeDirectionState } from '../constants/creative-direction-options'

export interface GenerationParameters {
  mainPrompt: string
  aspectRatio: string
  selectedStylePreset: string
  imageCount: number
  negativePrompt: string
  selectedCameraAngle: string
  selectedCameraLens: string
  styleStrength: 'subtle' | 'moderate' | 'strong'
  analysisMode: 'fast' | 'quality'
  seed: number | null // Add seed to parameters
  imageSize?: '1K' | '2K' | '4K'
  selectedModel?: string
  creativeDirection?: CreativeDirectionState
  timestamp: number
}

const STORAGE_KEY = 'image-studio-last-parameters'

export function useParameters() {
  const [hasStoredParams, setHasStoredParams] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      setHasStoredParams(!!stored)
    }
  }, [])

  const saveParameters = (params: Omit<GenerationParameters, 'timestamp'>) => {
    if (typeof window !== 'undefined') {
      const paramsWithTimestamp: GenerationParameters = {
        ...params,
        timestamp: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(paramsWithTimestamp))
      setHasStoredParams(true)
      console.log('[v0] Saved parameters:', paramsWithTimestamp)
    }
  }

  const loadParameters = (): GenerationParameters | null => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const params = JSON.parse(stored) as GenerationParameters
          console.log('[v0] Loaded parameters:', params)
          return params
        } catch (error) {
          console.error('[v0] Failed to parse stored parameters:', error)
          return null
        }
      }
    }
    return null
  }

  const clearParameters = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      setHasStoredParams(false)
      console.log('[v0] Cleared stored parameters')
    }
  }

  return {
    saveParameters,
    loadParameters,
    clearParameters,
    hasStoredParams,
  }
}
