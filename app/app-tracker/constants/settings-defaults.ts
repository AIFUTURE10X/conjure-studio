// App Tracker Settings - Defaults and Configuration

import type { AppSettings } from './types'

// ===== DEFAULT SETTINGS =====
export const DEFAULT_SETTINGS: AppSettings = {
  ui: {
    compactMode: false,
    defaultView: 'tasks',
    showProgressBars: true,
  },
  features: {
    autoExpandCategories: false,
    confirmBeforeDelete: true,
    showCompletedTasks: true,
  },
  api: {
    // Placeholder for future API integrations
  },
}

// ===== STORAGE KEY =====
export const SETTINGS_STORAGE_KEY = 'app-tracker-settings'

// ===== SETTING METADATA (for rendering the settings UI) =====
export const SETTING_DEFINITIONS = {
  ui: {
    label: 'UI Preferences',
    icon: '🎨',
    settings: {
      compactMode: {
        label: 'Compact Mode',
        description: 'Reduce padding and spacing throughout the app',
        type: 'toggle' as const,
      },
      defaultView: {
        label: 'Default View',
        description: 'Which view to show when selecting a feature',
        type: 'select' as const,
        options: [
          { value: 'tasks', label: 'Tasks' },
          { value: 'tests', label: 'Tests' },
        ],
      },
      showProgressBars: {
        label: 'Show Progress Bars',
        description: 'Display progress indicators on projects and features',
        type: 'toggle' as const,
      },
    },
  },
  features: {
    label: 'Features',
    icon: '⚡',
    settings: {
      autoExpandCategories: {
        label: 'Auto-Expand Test Categories',
        description: 'Automatically expand all test categories when viewing tests',
        type: 'toggle' as const,
      },
      confirmBeforeDelete: {
        label: 'Confirm Before Delete',
        description: 'Show confirmation dialog before deleting items',
        type: 'toggle' as const,
      },
      showCompletedTasks: {
        label: 'Show Completed Tasks',
        description: 'Show tasks marked as done in the task list',
        type: 'toggle' as const,
      },
    },
  },
  api: {
    label: 'API & Integration',
    icon: '🔌',
    settings: {
      // Placeholder for future settings
    },
  },
} as const
