'use client'

import { useState } from 'react'
import { Settings, RotateCcw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageStudioSettings, SETTING_DEFINITIONS, GeneratePreset } from '../../constants/settings-defaults'
import { SettingRow } from './SettingRow'
import { PresetsPanel } from './PresetsPanel'

interface SettingsPanelProps {
  settings: ImageStudioSettings
  onUpdateSetting: <K extends keyof ImageStudioSettings>(
    category: K,
    key: keyof ImageStudioSettings[K],
    value: ImageStudioSettings[K][keyof ImageStudioSettings[K]]
  ) => void
  onResetSettings: () => void
  onBack?: () => void
  // Presets props
  presets?: GeneratePreset[]
  onLoadPreset?: (preset: GeneratePreset) => void
  onDeletePreset?: (id: string) => void
  onUpdatePreset?: (id: string, updates: { name?: string }) => void
  onClearAllPresets?: () => void
}

type SettingsCategory = 'ui' | 'features' | 'api' | 'presets'

const CATEGORY_TABS: { key: SettingsCategory; label: string; icon: string }[] = [
  { key: 'ui', label: 'UI', icon: '🎨' },
  { key: 'features', label: 'Features', icon: '⚡' },
  { key: 'api', label: 'API', icon: '🔌' },
  { key: 'presets', label: 'Presets', icon: '💾' },
]

export function SettingsPanel({
  settings,
  onUpdateSetting,
  onResetSettings,
  onBack,
  presets = [],
  onLoadPreset,
  onDeletePreset,
  onUpdatePreset,
  onClearAllPresets,
}: SettingsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('ui')

  const isPresetsTab = activeCategory === 'presets'
  const categoryDef = !isPresetsTab ? SETTING_DEFINITIONS[activeCategory] : null
  const categorySettings = categoryDef?.settings

  return (
    <div className="flex-1 p-6 overflow-auto bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-zinc-400 hover:text-white mr-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Settings className="w-6 h-6 text-[#dbb56e]" />
          <div>
            <h2 className="text-xl font-semibold text-white">Settings</h2>
            <p className="text-sm text-zinc-400">Configure your Image Studio preferences</p>
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
                ? 'bg-[#dbb56e] text-black'
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
        {isPresetsTab ? (
          <>
            <h3 className="text-sm font-medium text-zinc-300 mb-4">
              Saved Presets
            </h3>
            <PresetsPanel
              presets={presets}
              onLoadPreset={onLoadPreset || (() => {})}
              onDeletePreset={onDeletePreset || (() => {})}
              onUpdatePreset={onUpdatePreset || (() => {})}
              onClearAll={onClearAllPresets || (() => {})}
            />
          </>
        ) : (
          <>
            <h3 className="text-sm font-medium text-zinc-300 mb-4">
              {categoryDef?.label}
            </h3>

            {!categorySettings || Object.entries(categorySettings).length === 0 ? (
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
                    value={settings[activeCategory as keyof typeof settings][key as keyof typeof settings[typeof activeCategory]]}
                    options={'options' in def ? def.options : undefined}
                    onChange={(value) => onUpdateSetting(
                      activeCategory as keyof ImageStudioSettings,
                      key as keyof ImageStudioSettings[typeof activeCategory],
                      value as ImageStudioSettings[typeof activeCategory][keyof ImageStudioSettings[typeof activeCategory]]
                    )}
                  />
                ))}
              </div>
            )}
          </>
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
