'use client'

import { useState } from 'react'
import { Settings, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AppSettings } from '../../constants/types'
import { SETTING_DEFINITIONS } from '../../constants/settings-defaults'
import { SettingRow } from './SettingRow'

interface SettingsPanelProps {
  settings: AppSettings
  onUpdateSetting: <K extends keyof AppSettings>(
    category: K,
    key: keyof AppSettings[K],
    value: AppSettings[K][keyof AppSettings[K]]
  ) => void
  onResetSettings: () => void
}

type SettingsCategory = 'ui' | 'features' | 'api'

const CATEGORY_TABS: { key: SettingsCategory; label: string; icon: string }[] = [
  { key: 'ui', label: 'UI', icon: '🎨' },
  { key: 'features', label: 'Features', icon: '⚡' },
  { key: 'api', label: 'API', icon: '🔌' },
]

export function SettingsPanel({
  settings,
  onUpdateSetting,
  onResetSettings,
}: SettingsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('ui')

  const categoryDef = SETTING_DEFINITIONS[activeCategory]
  const categorySettings = categoryDef.settings

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-[#c99850]" />
          <div>
            <h2 className="text-xl font-semibold text-white">Settings</h2>
            <p className="text-sm text-zinc-400">Configure your app preferences</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetSettings}
          className="border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-4">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveCategory(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === tab.key
                ? 'bg-[#c99850] text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings List */}
      <div className="space-y-1 max-w-2xl">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">
          {categoryDef.label}
        </h3>

        {Object.entries(categorySettings).length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-sm">No settings available in this category yet.</p>
            <p className="text-xs mt-1">Settings will be added here as features are developed.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(categorySettings).map(([key, def]) => (
              <SettingRow
                key={key}
                label={def.label}
                description={def.description}
                type={def.type}
                value={settings[activeCategory][key as keyof typeof settings[typeof activeCategory]]}
                options={'options' in def ? def.options : undefined}
                onChange={(value) => onUpdateSetting(
                  activeCategory,
                  key as keyof AppSettings[typeof activeCategory],
                  value as AppSettings[typeof activeCategory][keyof AppSettings[typeof activeCategory]]
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-8 pt-4 border-t border-zinc-800 max-w-2xl">
        <p className="text-xs text-zinc-500">
          Settings are automatically saved and will persist across sessions.
        </p>
      </div>
    </div>
  )
}
