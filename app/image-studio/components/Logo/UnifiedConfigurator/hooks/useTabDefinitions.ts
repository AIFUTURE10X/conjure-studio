/**
 * useTabDefinitions Hook
 *
 * Returns the tab definitions for a given preset ID.
 * Handles dynamic tab loading based on preset category.
 */

import { useMemo } from 'react'
import {
  TabDefinition,
  getTabsForPreset,
  getCategoryTab,
  BASE_TABS,
} from '../../../../constants/preset-schemas'

interface UseTabDefinitionsOptions {
  presetId: string
}

interface UseTabDefinitionsReturn {
  tabs: TabDefinition[]
  categoryTab: TabDefinition | null
  hasCustomCategoryTab: boolean
  getTabById: (tabId: string) => TabDefinition | undefined
}

export function useTabDefinitions({
  presetId,
}: UseTabDefinitionsOptions): UseTabDefinitionsReturn {
  // Get tabs for this preset
  const tabs = useMemo(() => {
    return getTabsForPreset(presetId)
  }, [presetId])

  // Get the category-specific tab (if any)
  const categoryTab = useMemo(() => {
    return getCategoryTab(presetId)
  }, [presetId])

  // Check if this preset has a custom category tab
  const hasCustomCategoryTab = useMemo(() => {
    return categoryTab !== null
  }, [categoryTab])

  // Helper to get a tab by ID
  const getTabById = useMemo(() => {
    return (tabId: string) => tabs.find(tab => tab.id === tabId)
  }, [tabs])

  return {
    tabs,
    categoryTab,
    hasCustomCategoryTab,
    getTabById,
  }
}

/**
 * Get icon component name for a tab
 * Maps tab icon strings to Lucide icon names
 */
export function getTabIconName(tab: TabDefinition): string {
  const iconMap: Record<string, string> = {
    'Type': 'Type',
    'Palette': 'Palette',
    'Image': 'Image',
    'Layers': 'Layers',
    'Sparkles': 'Sparkles',
    'Cpu': 'Cpu',
    'Crown': 'Crown',
    'Leaf': 'Leaf',
    'UtensilsCrossed': 'UtensilsCrossed',
    'Home': 'Home',
    'Shield': 'Shield',
    'Dumbbell': 'Dumbbell',
    'Grid': 'Grid',
  }

  return iconMap[tab.icon] || 'Settings'
}
