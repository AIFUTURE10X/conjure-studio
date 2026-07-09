"use client"

/**
 * UnifiedConfigurator Component
 *
 * A single, adaptive configurator that works with any logo preset.
 * Dynamically loads the appropriate tabs based on preset category.
 *
 * This replaces the need for 22+ separate configurator components.
 */

import { useCallback, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Type, Palette, Layers, Image as ImageIcon, Sparkles, Cpu, Crown, Leaf, UtensilsCrossed, Home, Shield, Dumbbell, Grid2X2 } from 'lucide-react'

import { LOGO_PRESETS } from '../../../constants/logo-presets'
import { INDUSTRY_PRESETS } from '../../../constants/dot-matrix-config'
import { UnifiedLogoConfig } from '../../../constants/preset-schemas'

import { useUnifiedConfig } from './hooks/useUnifiedConfig'
import { useTabDefinitions, getTabIconName } from './hooks/useTabDefinitions'
import { TabRenderer } from './TabRenderer'
import { ConfigFooter } from '../DotMatrixConfigurator/ConfigFooter'
import { SavePresetDialog } from '../CustomPresets'

interface UnifiedConfiguratorProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (prompt: string, negativePrompt: string) => void
  presetId: string
  initialConfig?: Partial<UnifiedLogoConfig>
}

// Icon mapping for dynamic icon rendering
const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'Type': Type,
  'Palette': Palette,
  'Layers': Layers,
  'Image': ImageIcon,
  'Sparkles': Sparkles,
  'Cpu': Cpu,
  'Crown': Crown,
  'Leaf': Leaf,
  'UtensilsCrossed': UtensilsCrossed,
  'Home': Home,
  'Shield': Shield,
  'Dumbbell': Dumbbell,
  'Grid': Grid2X2,
}

export function UnifiedConfigurator({
  isOpen,
  onClose,
  onGenerate,
  presetId,
  initialConfig,
}: UnifiedConfiguratorProps) {
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false)

  // Get preset info
  const preset = LOGO_PRESETS.find(p => p.id === presetId)

  // Get tab definitions for this preset
  const { tabs, categoryTab, hasCustomCategoryTab } = useTabDefinitions({ presetId })

  // Get config state and handlers
  const {
    config,
    updateConfig,
    toggleConfig,
    resetConfig,
    applyPartialConfig,
    buildPrompt,
    buildNegativePrompt,
  } = useUnifiedConfig({ presetId, initialConfig })

  // Apply an industry preset (for corporate/DotMatrix presets)
  const applyIndustryPreset = useCallback((industryPresetId: string) => {
    const industryPreset = INDUSTRY_PRESETS.find(p => p.id === industryPresetId)
    if (industryPreset) {
      applyPartialConfig(industryPreset.config as Partial<UnifiedLogoConfig>)
    }
  }, [applyPartialConfig])

  // Handle generate
  const handleGenerate = useCallback(() => {
    if (!config.brandName?.trim()) return
    onGenerate(buildPrompt(), buildNegativePrompt())
    onClose()
  }, [config.brandName, onGenerate, buildPrompt, buildNegativePrompt, onClose])

  // Handle reset
  const handleReset = useCallback(() => {
    resetConfig()
  }, [resetConfig])

  // Handle save preset
  const handleSavePreset = useCallback(() => {
    setShowSavePresetDialog(true)
  }, [])

  // Build preview text
  const previewText = buildPrompt()

  // Get icon component for a tab
  const getTabIcon = (iconName: string) => {
    const IconComponent = IconMap[iconName]
    return IconComponent ? <IconComponent className="w-3.5 h-3.5" /> : null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[960px] w-[60vw] max-h-[90vh] flex flex-col overflow-hidden bg-zinc-900 border-zinc-700 text-white p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <span className="text-xl">{preset?.icon || '⚫'}</span>
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  {preset?.name || 'Logo'} Configurator
                </DialogTitle>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {preset?.description || 'Configure your logo design'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <Tabs defaultValue="brand" className="w-full">
            <TabsList className="w-full px-4 bg-zinc-900/50 border-b border-zinc-800 rounded-none justify-start gap-1 h-auto py-2 sticky top-0 z-10 flex-wrap">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-zinc-800 text-xs px-3 py-1.5 gap-1.5"
                >
                  {getTabIcon(tab.icon)}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="p-6">
              {tabs.map((tab) => (
                <TabRenderer
                  key={tab.id}
                  tab={tab}
                  config={config}
                  updateConfig={updateConfig}
                  toggleConfig={toggleConfig}
                  applyIndustryPreset={applyIndustryPreset}
                  presetId={presetId}
                />
              ))}
            </div>
          </Tabs>
        </div>

        <ConfigFooter
          previewText={previewText}
          brandName={config.brandName || ''}
          onReset={handleReset}
          onClose={onClose}
          onGenerate={handleGenerate}
          onSavePreset={handleSavePreset}
        />
      </DialogContent>

      {/* Save Preset Dialog */}
      <SavePresetDialog
        isOpen={showSavePresetDialog}
        onClose={() => setShowSavePresetDialog(false)}
        currentConfig={config as Record<string, any>}
        basePresetId={presetId}
        basePresetName={preset?.name || 'Custom'}
      />
    </Dialog>
  )
}
