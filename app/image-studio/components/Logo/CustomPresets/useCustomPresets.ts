"use client"

/**
 * useCustomPresets Hook
 *
 * Manages custom logo presets in localStorage with CRUD operations
 * Max 20 presets, includes import/export functionality
 */

import { useState, useEffect, useCallback } from 'react'

export interface CustomPreset {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  basePresetId: string       // Which preset it's based on
  config: Record<string, any>
  icon: string               // User-chosen emoji
  description?: string
}

interface CustomPresetsState {
  presets: CustomPreset[]
  isLoading: boolean
  error: string | null
}

const STORAGE_KEY = 'logo-custom-presets'
const MAX_PRESETS = 20

export function useCustomPresets() {
  const [state, setState] = useState<CustomPresetsState>({
    presets: [],
    isLoading: true,
    error: null
  })

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setState({
          presets: Array.isArray(parsed) ? parsed : [],
          isLoading: false,
          error: null
        })
      } else {
        setState({ presets: [], isLoading: false, error: null })
      }
    } catch (err) {
      console.error('Failed to load custom presets:', err)
      setState({ presets: [], isLoading: false, error: 'Failed to load presets' })
    }
  }, [])

  // Save to localStorage whenever presets change
  const saveToStorage = useCallback((presets: CustomPreset[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
    } catch (err) {
      console.error('Failed to save custom presets:', err)
    }
  }, [])

  // Add a new preset
  const addPreset = useCallback((
    name: string,
    basePresetId: string,
    config: Record<string, any>,
    icon: string = '⭐',
    description?: string
  ): { success: boolean; error?: string; preset?: CustomPreset } => {
    if (state.presets.length >= MAX_PRESETS) {
      return {
        success: false,
        error: `Maximum ${MAX_PRESETS} presets reached. Delete some to add more.`
      }
    }

    if (!name.trim()) {
      return { success: false, error: 'Preset name is required' }
    }

    // Check for duplicate names
    if (state.presets.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: 'A preset with this name already exists' }
    }

    const newPreset: CustomPreset = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      basePresetId,
      config,
      icon,
      description
    }

    const updatedPresets = [newPreset, ...state.presets]
    setState(prev => ({ ...prev, presets: updatedPresets }))
    saveToStorage(updatedPresets)

    return { success: true, preset: newPreset }
  }, [state.presets, saveToStorage])

  // Update an existing preset
  const updatePreset = useCallback((
    id: string,
    updates: Partial<Omit<CustomPreset, 'id' | 'createdAt'>>
  ): { success: boolean; error?: string } => {
    const presetIndex = state.presets.findIndex(p => p.id === id)
    if (presetIndex === -1) {
      return { success: false, error: 'Preset not found' }
    }

    // Check for duplicate names if name is being updated
    if (updates.name) {
      const duplicateName = state.presets.some(
        p => p.id !== id && p.name.toLowerCase() === updates.name!.toLowerCase()
      )
      if (duplicateName) {
        return { success: false, error: 'A preset with this name already exists' }
      }
    }

    const updatedPresets = [...state.presets]
    updatedPresets[presetIndex] = {
      ...updatedPresets[presetIndex],
      ...updates,
      updatedAt: Date.now()
    }

    setState(prev => ({ ...prev, presets: updatedPresets }))
    saveToStorage(updatedPresets)

    return { success: true }
  }, [state.presets, saveToStorage])

  // Delete a preset
  const deletePreset = useCallback((id: string): { success: boolean } => {
    const updatedPresets = state.presets.filter(p => p.id !== id)
    setState(prev => ({ ...prev, presets: updatedPresets }))
    saveToStorage(updatedPresets)
    return { success: true }
  }, [state.presets, saveToStorage])

  // Duplicate a preset
  const duplicatePreset = useCallback((id: string): { success: boolean; error?: string; preset?: CustomPreset } => {
    const original = state.presets.find(p => p.id === id)
    if (!original) {
      return { success: false, error: 'Preset not found' }
    }

    return addPreset(
      `${original.name} (Copy)`,
      original.basePresetId,
      { ...original.config },
      original.icon,
      original.description
    )
  }, [state.presets, addPreset])

  // Export presets as JSON
  const exportPresets = useCallback((): string => {
    return JSON.stringify(state.presets, null, 2)
  }, [state.presets])

  // Import presets from JSON
  const importPresets = useCallback((jsonString: string, mode: 'merge' | 'replace' = 'merge'): {
    success: boolean;
    error?: string;
    imported?: number
  } => {
    try {
      const imported = JSON.parse(jsonString)

      if (!Array.isArray(imported)) {
        return { success: false, error: 'Invalid format: expected an array' }
      }

      // Validate each preset
      const validPresets: CustomPreset[] = imported.filter(p =>
        p &&
        typeof p.name === 'string' &&
        typeof p.basePresetId === 'string' &&
        typeof p.config === 'object'
      ).map(p => ({
        ...p,
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: p.createdAt || Date.now(),
        updatedAt: Date.now(),
        icon: p.icon || '⭐'
      }))

      if (validPresets.length === 0) {
        return { success: false, error: 'No valid presets found in import' }
      }

      let updatedPresets: CustomPreset[]
      if (mode === 'replace') {
        updatedPresets = validPresets.slice(0, MAX_PRESETS)
      } else {
        // Merge mode: add new presets, skip duplicates by name
        const existingNames = new Set(state.presets.map(p => p.name.toLowerCase()))
        const newPresets = validPresets.filter(p => !existingNames.has(p.name.toLowerCase()))
        const spaceAvailable = MAX_PRESETS - state.presets.length
        updatedPresets = [...state.presets, ...newPresets.slice(0, spaceAvailable)]
      }

      setState(prev => ({ ...prev, presets: updatedPresets }))
      saveToStorage(updatedPresets)

      return {
        success: true,
        imported: mode === 'replace' ? validPresets.length : updatedPresets.length - state.presets.length
      }
    } catch (err) {
      return { success: false, error: 'Invalid JSON format' }
    }
  }, [state.presets, saveToStorage])

  // Clear all presets
  const clearAllPresets = useCallback(() => {
    setState(prev => ({ ...prev, presets: [] }))
    saveToStorage([])
  }, [saveToStorage])

  // Get a preset by ID
  const getPresetById = useCallback((id: string): CustomPreset | undefined => {
    return state.presets.find(p => p.id === id)
  }, [state.presets])

  return {
    presets: state.presets,
    isLoading: state.isLoading,
    error: state.error,
    presetsCount: state.presets.length,
    maxPresets: MAX_PRESETS,
    canAddMore: state.presets.length < MAX_PRESETS,

    // CRUD operations
    addPreset,
    updatePreset,
    deletePreset,
    duplicatePreset,
    getPresetById,

    // Import/Export
    exportPresets,
    importPresets,
    clearAllPresets
  }
}
