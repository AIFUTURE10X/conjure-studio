'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ImageStudioSettings,
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  SAVED_PARAMS_KEY,
  SavedGenerateParams,
} from '../constants/settings-defaults'

export function useAppSettings() {
  const [settings, setSettings] = useState<ImageStudioSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to ensure new settings get default values
        // Also filter out old settings that no longer exist
        setSettings({
          ui: {
            defaultTab: parsed.ui?.defaultTab ?? DEFAULT_SETTINGS.ui.defaultTab,
          },
          features: {
            autoSaveParams: parsed.features?.autoSaveParams ?? DEFAULT_SETTINGS.features.autoSaveParams,
            showAdvancedOptions: parsed.features?.showAdvancedOptions ?? DEFAULT_SETTINGS.features.showAdvancedOptions,
          },
          api: {
            defaultModel: parsed.api?.defaultModel ?? DEFAULT_SETTINGS.api.defaultModel,
          },
        })
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
    setIsLoading(false)
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }, [settings, isLoading])

  // Update a single setting by category and key
  const updateSetting = useCallback(<K extends keyof ImageStudioSettings>(
    category: K,
    key: keyof ImageStudioSettings[K],
    value: ImageStudioSettings[K][keyof ImageStudioSettings[K]]
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
  }, [])

  // Update multiple settings at once
  const updateSettings = useCallback((updates: Partial<ImageStudioSettings>) => {
    setSettings(prev => ({
      ui: { ...prev.ui, ...updates.ui },
      features: { ...prev.features, ...updates.features },
      api: { ...prev.api, ...updates.api },
    }))
  }, [])

  // Reset all settings to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  // Get a specific setting value
  const getSetting = useCallback(<K extends keyof ImageStudioSettings>(
    category: K,
    key: keyof ImageStudioSettings[K]
  ): ImageStudioSettings[K][keyof ImageStudioSettings[K]] => {
    return settings[category][key]
  }, [settings])

  // ===== AUTO-SAVE PARAMETERS =====

  // Save generation parameters (only if autoSaveParams is enabled)
  const saveGenerateParams = useCallback((params: SavedGenerateParams) => {
    if (!settings.features.autoSaveParams) return
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(SAVED_PARAMS_KEY, JSON.stringify(params))
    } catch (e) {
      console.error('Failed to save generate params:', e)
    }
  }, [settings.features.autoSaveParams])

  // Load saved generation parameters
  const loadSavedParams = useCallback((): SavedGenerateParams | null => {
    if (!settings.features.autoSaveParams) return null
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(SAVED_PARAMS_KEY)
      if (stored) {
        return JSON.parse(stored) as SavedGenerateParams
      }
    } catch (e) {
      console.error('Failed to load saved params:', e)
    }
    return null
  }, [settings.features.autoSaveParams])

  // Clear saved parameters
  const clearSavedParams = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(SAVED_PARAMS_KEY)
    } catch (e) {
      console.error('Failed to clear saved params:', e)
    }
  }, [])

  return {
    settings,
    isLoading,
    updateSetting,
    updateSettings,
    resetSettings,
    getSetting,
    // Auto-save params
    saveGenerateParams,
    loadSavedParams,
    clearSavedParams,
  }
}
