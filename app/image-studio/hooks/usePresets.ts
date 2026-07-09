'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  GeneratePreset,
  SavedGenerateParams,
  PresetSource,
  PRESETS_STORAGE_KEY,
} from '../constants/settings-defaults'

// Migrate old model names to new ones
const MODEL_MIGRATIONS: Record<string, string> = {
  'gemini-2.5-flash-preview-image': 'gpt-image-2',
  'gemini-2.5-flash-image': 'gpt-image-2',
  'gemini-3.1-flash-image-preview': 'gpt-image-2',
  'gemini-3-pro-image': 'gpt-image-2',
  'gemini-3-pro-image-preview': 'gpt-image-2',
  'gemini-2.0-flash-exp': 'gpt-image-2',
  'chatgpt-image-generator-2': 'gpt-image-2',
  'chatgpt-image-latest': 'gpt-image-2',
}

function migratePreset(preset: GeneratePreset): GeneratePreset {
  const model = preset.params?.selectedModel
  if (model && MODEL_MIGRATIONS[model]) {
    const selectedModel = MODEL_MIGRATIONS[model]
    return {
      ...preset,
      params: {
        ...preset.params,
        selectedModel,
      },
    }
  }
  return preset
}

export function usePresets() {
  const [presets, setPresets] = useState<GeneratePreset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load presets from localStorage on mount (with migration)
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          // Migrate old model names
          const migrated = parsed.map(migratePreset)
          setPresets(migrated)
        }
      }
    } catch (e) {
      console.error('Failed to load presets:', e)
    }
    setIsLoading(false)
  }, [])

  // Save presets to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return

    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets))
    } catch (e) {
      console.error('Failed to save presets:', e)
    }
  }, [presets, isLoading])

  // Save a new preset
  const savePreset = useCallback((name: string, params: SavedGenerateParams, source: PresetSource = 'generate'): GeneratePreset => {
    const newPreset: GeneratePreset = {
      id: `preset-${Date.now()}`,
      name: name.trim() || 'Untitled Preset',
      createdAt: Date.now(),
      source,
      params,
    }

    setPresets(prev => [newPreset, ...prev])
    return newPreset
  }, [])

  // Update an existing preset
  const updatePreset = useCallback((id: string, updates: Partial<Pick<GeneratePreset, 'name' | 'params'>>) => {
    setPresets(prev => prev.map(preset =>
      preset.id === id
        ? { ...preset, ...updates }
        : preset
    ))
  }, [])

  // Delete a preset
  const deletePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(preset => preset.id !== id))
  }, [])

  // Get a preset by ID
  const getPreset = useCallback((id: string): GeneratePreset | undefined => {
    return presets.find(preset => preset.id === id)
  }, [presets])

  // Clear all presets
  const clearAllPresets = useCallback(() => {
    setPresets([])
  }, [])

  return {
    presets,
    isLoading,
    savePreset,
    updatePreset,
    deletePreset,
    getPreset,
    clearAllPresets,
  }
}
