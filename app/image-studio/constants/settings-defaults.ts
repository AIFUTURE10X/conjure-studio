// Image Studio Settings - Defaults and Configuration
import type { CreativeDirectionState } from './creative-direction-options'
import type { VideoSettingsValue } from './video-settings-defaults'

// ===== APP SETTINGS TYPE =====
export interface ImageStudioSettings {
  ui: {
    defaultTab: 'generate' | 'logo' | 'mockups' | 'bg-remover'
  }
  features: {
    autoSaveParams: boolean
    showAdvancedOptions: boolean
  }
  api: {
    defaultModel: string
  }
}

// ===== DEFAULT SETTINGS =====
export const DEFAULT_SETTINGS: ImageStudioSettings = {
  ui: {
    defaultTab: 'generate',
  },
  features: {
    autoSaveParams: false,  // Off by default, user can enable
    showAdvancedOptions: true,  // Show advanced by default
  },
  api: {
    defaultModel: 'gpt-image-2',
  },
}

// ===== STORAGE KEY =====
export const SETTINGS_STORAGE_KEY = 'image-studio-settings'

// ===== SETTING METADATA (for rendering the settings UI) =====
export const SETTING_DEFINITIONS = {
  ui: {
    label: 'UI Preferences',
    icon: '🎨',
    settings: {
      defaultTab: {
        label: 'Default Tab',
        description: 'Which tab opens when you load Image Studio',
        type: 'select' as const,
        options: [
          { value: 'generate', label: 'Generate' },
          { value: 'logo', label: 'Logo' },
          { value: 'mockups', label: 'Mockups' },
          { value: 'bg-remover', label: 'BG Remover' },
        ],
      },
    },
  },
  features: {
    label: 'Generate Tab',
    icon: '⚡',
    settings: {
      autoSaveParams: {
        label: 'Auto-Save Parameters',
        description: 'Remember your prompt, style, and settings when you return',
        type: 'toggle' as const,
      },
      showAdvancedOptions: {
        label: 'Show Advanced Options',
        description: 'Show seed, negative prompt, model selector, and reference image controls',
        type: 'toggle' as const,
      },
    },
  },
  api: {
    label: 'Defaults',
    icon: '🔌',
    settings: {
      defaultModel: {
        label: 'Default AI Model',
        description: 'Which model to use for image generation',
        type: 'select' as const,
        options: [
          { value: 'gpt-image-2', label: 'ChatGPT Images 2.0' },
        ],
      },
    },
  },
} as const

// ===== AUTO-SAVE PARAMETERS STORAGE =====
export const SAVED_PARAMS_KEY = 'image-studio-saved-params'

export interface SavedGenerateParams {
  mainPrompt: string
  negativePrompt: string
  aspectRatio: string
  selectedStylePreset: string
  selectedCameraAngle: string
  selectedCameraLens: string
  styleStrength: 'subtle' | 'moderate' | 'strong'
  imageSize: '1K' | '2K' | '4K'
  selectedModel: string
  generationMode?: 'fast' | 'quality'
  creativeDirection?: CreativeDirectionState
  /** Present on presets saved from the video panel (source 'video'). */
  video?: VideoSettingsValue
  /** User-defined template shelf (e.g. "Product Ads"). Lives in params so it syncs without a DB migration. */
  category?: string
  /** Template thumbnail (usually the clip's start frame). */
  thumbnailUrl?: string
}

// ===== PRESETS STORAGE =====
export const PRESETS_STORAGE_KEY = 'image-studio-presets'

export type PresetSource = 'generate' | 'logo' | 'mockups' | 'bg-remover' | 'video'

export interface GeneratePreset {
  id: string
  name: string
  createdAt: number
  source: PresetSource  // Which tab this preset was created from
  params: SavedGenerateParams
}
