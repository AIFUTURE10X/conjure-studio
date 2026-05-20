// Image Studio Settings - Defaults and Configuration
import type { CreativeDirectionState } from './creative-direction-options'

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
    defaultModel: 'gemini-3.1-flash-image-preview',
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
          { value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash (Fast)' },
          { value: 'gpt-image-2', label: 'ChatGPT Image Generator 2' },
          { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro (Best Quality)' },
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
}

// ===== PRESETS STORAGE =====
export const PRESETS_STORAGE_KEY = 'image-studio-presets'

export type PresetSource = 'generate' | 'logo' | 'mockups' | 'bg-remover'

export interface GeneratePreset {
  id: string
  name: string
  createdAt: number
  source: PresetSource  // Which tab this preset was created from
  params: SavedGenerateParams
}
