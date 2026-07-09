/**
 * useUnifiedConfig Hook
 *
 * Manages the configuration state for the UnifiedConfigurator.
 * Supports any preset type through the unified config system.
 */

import { useState, useCallback, useEffect } from 'react'
import {
  UnifiedLogoConfig,
  getDefaultConfigForPreset,
  getSchemaForPreset,
} from '../../../../constants/preset-schemas'
import { ColorOption } from '../../../../constants/dot-matrix-config'

interface UseUnifiedConfigOptions {
  presetId: string
  initialConfig?: Partial<UnifiedLogoConfig>
}

interface UseUnifiedConfigReturn {
  config: UnifiedLogoConfig
  updateConfig: <K extends keyof UnifiedLogoConfig>(key: K, value: UnifiedLogoConfig[K]) => void
  toggleConfig: <K extends keyof UnifiedLogoConfig>(key: K, value: UnifiedLogoConfig[K]) => void
  resetConfig: () => void
  applyPartialConfig: (partial: Partial<UnifiedLogoConfig>) => void
  buildPrompt: () => string
  buildNegativePrompt: () => string
}

export function useUnifiedConfig({
  presetId,
  initialConfig,
}: UseUnifiedConfigOptions): UseUnifiedConfigReturn {
  // Get defaults for this preset
  const defaults = getDefaultConfigForPreset(presetId) as UnifiedLogoConfig
  const schema = getSchemaForPreset(presetId)

  // Initialize state with defaults merged with any initial config
  const [config, setConfig] = useState<UnifiedLogoConfig>(() => ({
    ...defaults,
    ...initialConfig,
  }))

  // Update when presetId changes
  useEffect(() => {
    const newDefaults = getDefaultConfigForPreset(presetId) as UnifiedLogoConfig
    setConfig(prev => ({
      ...newDefaults,
      // Preserve brand name and tagline when switching presets
      brandName: prev.brandName,
      tagline: prev.tagline,
      ...initialConfig,
    }))
  }, [presetId])

  // Apply initial config when it changes (e.g., from AI Helper)
  useEffect(() => {
    if (initialConfig && Object.keys(initialConfig).length > 0) {
      setConfig(prev => ({ ...prev, ...initialConfig }))
    }
  }, [initialConfig])

  // Update a single config value
  const updateConfig = useCallback(<K extends keyof UnifiedLogoConfig>(
    key: K,
    value: UnifiedLogoConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }, [])

  // Toggle a config value (for buttons that can be deselected)
  const toggleConfig = useCallback(<K extends keyof UnifiedLogoConfig>(
    key: K,
    value: UnifiedLogoConfig[K]
  ) => {
    setConfig(prev => {
      const currentVal = prev[key]

      // Handle ColorOption comparisons
      if (currentVal && typeof currentVal === 'object' && 'value' in currentVal &&
          value && typeof value === 'object' && 'value' in value) {
        return {
          ...prev,
          [key]: (currentVal as ColorOption).value === (value as ColorOption).value ? null : value
        }
      }

      // Handle simple value comparisons
      return { ...prev, [key]: currentVal === value ? null : value }
    })
  }, [])

  // Reset to defaults
  const resetConfig = useCallback(() => {
    const newDefaults = getDefaultConfigForPreset(presetId) as UnifiedLogoConfig
    setConfig(newDefaults)
  }, [presetId])

  // Apply a partial config (e.g., from questionnaire answers)
  const applyPartialConfig = useCallback((partial: Partial<UnifiedLogoConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }))
  }, [])

  // Build the main prompt
  const buildPrompt = useCallback((): string => {
    const segments: string[] = []

    // Brand name with text placement
    if (config.brandName) {
      const brandName = config.brandName.trim()
      const textPlacement = (config as any).textPlacement || 'center'

      if (textPlacement && textPlacement !== 'center') {
        const textPlacementMap: Record<string, string> = {
          'left': `brand name "${brandName}" positioned to the LEFT side of the icon/symbol`,
          'right': `brand name "${brandName}" positioned to the RIGHT side of the icon/symbol`,
          'stacked': `icon/symbol on top with brand name "${brandName}" below`,
          'inline': `brand name "${brandName}" inline horizontally with icon/symbol`,
        }
        if (textPlacementMap[textPlacement]) {
          segments.push(textPlacementMap[textPlacement])
        } else {
          segments.push(`"${brandName}"`)
        }
      } else {
        segments.push(`"${brandName}"`)
      }
    }

    // Tagline with expanded position options
    if (config.tagline) {
      const taglinePositionMap: Record<string, string> = {
        'below': 'with tagline below the brand name',
        'above': 'with tagline above the brand name',
        'right': 'with tagline to the right of the brand name',
        'left': 'with tagline to the LEFT of the brand name',
        'inline': 'with tagline inline with the brand name',
        'integrated': 'with tagline integrated into the logo design',
      }
      // Check both taglinePlacement (from wizard) and taglinePosition (from schema)
      const taglinePos = (config as any).taglinePlacement || config.taglinePosition || 'below'
      segments.push(`${taglinePositionMap[taglinePos] || 'with tagline'}: "${config.tagline}"`)
    }

    // Category-specific prompt segment
    if (schema?.buildPromptSegment) {
      const categorySegment = schema.buildPromptSegment(config)
      if (categorySegment) {
        segments.push(categorySegment)
      }
    }

    // 3D depth
    if (config.depthLevel !== 'flat') {
      const depthMap = {
        'flat': '',
        'subtle': 'subtle 3D depth',
        'medium': 'medium 3D extrusion',
        'deep': 'deep 3D extrusion',
        'extreme': 'extreme dramatic 3D depth',
      }
      segments.push(depthMap[config.depthLevel])
    }

    // Metallic finish
    if (config.metallicFinish) {
      segments.push(`${config.metallicFinish} metallic finish`)
    }

    // Lighting
    if (config.lightingDirection !== 'top-left') {
      segments.push(`lighting from ${config.lightingDirection}`)
    }

    // Sparkle
    if (config.sparkleIntensity !== 'none') {
      segments.push(`${config.sparkleIntensity} sparkle accents`)
    }

    // Background
    const bgMap: Record<string, string> = {
      'dark-navy': 'dark navy blue background',
      'black': 'pure black background',
      'dark-gray': 'dark gray background',
      'gradient': 'gradient background',
      'transparent': 'transparent background',
      'white': 'white background',
      'light-gray': 'light gray background',
    }
    if (config.backgroundColor && bgMap[config.backgroundColor]) {
      segments.push(bgMap[config.backgroundColor])
    }

    // Professional quality
    segments.push('Professional premium quality corporate branding')

    return segments.filter(Boolean).join(' ')
  }, [config, schema])

  // Build negative prompt
  const buildNegativePrompt = useCallback((): string => {
    const negatives: string[] = [
      'blurry',
      'low quality',
      'amateur',
      'distorted text',
      'misspelled',
      'watermark',
      'signature',
    ]

    // Add depth-specific negatives
    if (config.depthLevel === 'flat') {
      negatives.push('3D', 'depth', 'extrusion', 'shadow')
    }

    return negatives.join(', ')
  }, [config])

  return {
    config,
    updateConfig,
    toggleConfig,
    resetConfig,
    applyPartialConfig,
    buildPrompt,
    buildNegativePrompt,
  }
}
