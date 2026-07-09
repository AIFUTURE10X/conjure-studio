'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '../constants/types'
import { STORAGE_KEYS } from '../constants/types'
import { DEFAULT_SETTINGS } from '../constants/settings-defaults'
import { getFromStorage, saveToStorage } from '../utils/storage'

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = getFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
    // Merge with defaults to ensure new settings get default values
    setSettings({
      ui: { ...DEFAULT_SETTINGS.ui, ...stored.ui },
      features: { ...DEFAULT_SETTINGS.features, ...stored.features },
      api: { ...DEFAULT_SETTINGS.api, ...stored.api },
    })
    setIsLoading(false)
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.SETTINGS, settings)
    }
  }, [settings, isLoading])

  // Update a single setting by path (e.g., 'ui.compactMode')
  const updateSetting = useCallback(<K extends keyof AppSettings>(
    category: K,
    key: keyof AppSettings[K],
    value: AppSettings[K][keyof AppSettings[K]]
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
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
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
  const getSetting = useCallback(<K extends keyof AppSettings>(
    category: K,
    key: keyof AppSettings[K]
  ): AppSettings[K][keyof AppSettings[K]] => {
    return settings[category][key]
  }, [settings])

  return {
    settings,
    isLoading,
    updateSetting,
    updateSettings,
    resetSettings,
    getSetting,
  }
}
