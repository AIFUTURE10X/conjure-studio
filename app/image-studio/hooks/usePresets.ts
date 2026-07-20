'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getUserId } from '@/lib/user-id'
import {
  GeneratePreset,
  SavedGenerateParams,
  PresetSource,
  PRESETS_STORAGE_KEY,
} from '../constants/settings-defaults'

/**
 * Presets with cross-device sync: localStorage is the instant-load cache,
 * Neon (/api/presets) is the source of truth. On mount we load the cache,
 * fetch the server list, push any local-only presets up once (migration
 * from the old localStorage-only era), then write through on every change.
 * Server errors degrade to localStorage-only behavior silently.
 */

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
    return {
      ...preset,
      params: { ...preset.params, selectedModel: MODEL_MIGRATIONS[model] },
    }
  }
  return preset
}

function loadLocalPresets(): GeneratePreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.map(migratePreset) : []
  } catch (e) {
    console.error('Failed to load presets:', e)
    return []
  }
}

async function syncCall(method: string, payload?: unknown, query = ''): Promise<Response | null> {
  try {
    return await fetch(`/api/presets${query ? `?${query}` : ''}`, {
      method,
      ...(payload ? {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      } : {}),
    })
  } catch (e) {
    console.error('[presets] Sync failed:', e)
    return null
  }
}

export function usePresets() {
  const [presets, setPresets] = useState<GeneratePreset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const syncedRef = useRef(false)

  // Load cache instantly, then reconcile with the server once.
  useEffect(() => {
    if (typeof window === 'undefined' || syncedRef.current) return
    syncedRef.current = true

    const local = loadLocalPresets()
    setPresets(local)
    setIsLoading(false)

    const userId = getUserId()
    fetch(`/api/presets?userId=${encodeURIComponent(userId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then(async (data) => {
        if (!data || !Array.isArray(data.presets)) return
        const server = (data.presets as GeneratePreset[]).map(migratePreset)
        const serverIds = new Set(server.map((preset) => preset.id))
        const localOnly = local.filter((preset) => !serverIds.has(preset.id))

        if (localOnly.length > 0) {
          await syncCall('POST', { userId, presets: localOnly })
        }
        const merged = [...localOnly, ...server]
          .sort((a, b) => b.createdAt - a.createdAt)
        setPresets(merged)
      })
      .catch((e) => console.error('[presets] Server load failed:', e))
  }, [])

  // Write-through cache
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets))
    } catch (e) {
      console.error('Failed to save presets:', e)
    }
  }, [presets, isLoading])

  const savePreset = useCallback((name: string, params: SavedGenerateParams, source: PresetSource = 'generate'): GeneratePreset => {
    const newPreset: GeneratePreset = {
      id: `preset-${Date.now()}`,
      name: name.trim() || 'Untitled Preset',
      createdAt: Date.now(),
      source,
      params,
    }
    setPresets(prev => [newPreset, ...prev])
    void syncCall('POST', { userId: getUserId(), presets: [newPreset] })
    return newPreset
  }, [])

  const updatePreset = useCallback((id: string, updates: Partial<Pick<GeneratePreset, 'name' | 'params'>>) => {
    setPresets(prev => prev.map(preset =>
      preset.id === id ? { ...preset, ...updates } : preset
    ))
    void syncCall('PATCH', { userId: getUserId(), id, ...updates })
  }, [])

  const deletePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(preset => preset.id !== id))
    void syncCall('DELETE', undefined, `userId=${encodeURIComponent(getUserId())}&id=${encodeURIComponent(id)}`)
  }, [])

  const getPreset = useCallback((id: string): GeneratePreset | undefined => {
    return presets.find(preset => preset.id === id)
  }, [presets])

  const clearAllPresets = useCallback(() => {
    setPresets([])
    void syncCall('DELETE', undefined, `userId=${encodeURIComponent(getUserId())}&all=true`)
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
