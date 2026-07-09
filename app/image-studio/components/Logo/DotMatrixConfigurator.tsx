"use client"

/**
 * IMPORTANT: When adding new settings to this configurator, UPDATE the file:
 * app/image-studio/constants/ai-logo-knowledge.ts
 * so the AI Helper can suggest these options!
 */

import { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Sparkles, Type, Palette, Layers, Image as ImageIcon, Paintbrush } from 'lucide-react'
import { DotMatrixConfig, DEFAULT_DOT_MATRIX_CONFIG, INDUSTRY_PRESETS, ColorOption } from '../../constants/dot-matrix-config'
import { buildDotMatrixPrompt, buildDotMatrixNegativePrompt, buildPromptPreview } from '../../utils/dot-matrix-prompt-builder'

// Tab Components
import { BrandTab } from './DotMatrixConfigurator/BrandTab'
import { DotsTab } from './DotMatrixConfigurator/DotsTab'
import { ColorsTab } from './DotMatrixConfigurator/ColorsTab'
import { TypographyTab } from './DotMatrixConfigurator/TypographyTab'
import { MaterialsTab } from './DotMatrixConfigurator/MaterialsTab'
import { LayoutTab } from './DotMatrixConfigurator/LayoutTab'
import { EffectsTab } from './DotMatrixConfigurator/EffectsTab'
import { AdvancedTab } from './DotMatrixConfigurator/AdvancedTab'
import { ConfigFooter } from './DotMatrixConfigurator/ConfigFooter'

interface DotMatrixConfiguratorProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (prompt: string, negativePrompt: string) => void
  initialConfig?: Partial<DotMatrixConfig>
}

export function DotMatrixConfigurator({ isOpen, onClose, onGenerate, initialConfig }: DotMatrixConfiguratorProps) {
  const [config, setConfig] = useState<DotMatrixConfig>(DEFAULT_DOT_MATRIX_CONFIG)

  useEffect(() => {
    if (initialConfig && Object.keys(initialConfig).length > 0) {
      console.log('[DotMatrix] Applying initial config from AI Helper:', initialConfig)
      setConfig(prev => ({ ...prev, ...initialConfig }))
    }
  }, [initialConfig])

  const updateConfig = useCallback(<K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleConfig = useCallback(<K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => {
    setConfig(prev => {
      const currentVal = prev[key]
      if (currentVal && typeof currentVal === 'object' && 'value' in currentVal &&
          value && typeof value === 'object' && 'value' in value) {
        return { ...prev, [key]: (currentVal as ColorOption).value === (value as ColorOption).value ? null : value }
      }
      return { ...prev, [key]: currentVal === value ? null : value }
    })
  }, [])

  const applyIndustryPreset = useCallback((presetId: string) => {
    const preset = INDUSTRY_PRESETS.find(p => p.id === presetId)
    if (preset) setConfig(prev => ({ ...prev, ...preset.config }))
  }, [])

  const handleGenerate = () => {
    if (!config.brandName.trim()) return
    onGenerate(buildDotMatrixPrompt(config), buildDotMatrixNegativePrompt(config))
    onClose()
  }

  const handleReset = () => setConfig({ ...DEFAULT_DOT_MATRIX_CONFIG })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[960px] w-[60vw] max-h-[90vh] flex flex-col overflow-hidden bg-zinc-900 border-zinc-700 text-white p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <span className="text-xl">⚫</span>
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Dot Matrix 3D Configurator</DialogTitle>
                <p className="text-xs text-zinc-400 mt-0.5">Design your perfect halftone logo</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <Tabs defaultValue="brand" className="w-full">
            <TabsList className="w-full px-4 bg-zinc-900/50 border-b border-zinc-800 rounded-none justify-start gap-1 h-auto py-2 sticky top-0 z-10 flex-wrap">
              <TabsTrigger value="brand" className="data-[state=active]:bg-zinc-800 text-xs px-3 py-1.5 gap-1.5">
                <Type className="w-3.5 h-3.5" /> Brand
              </TabsTrigger>
              <TabsTrigger value="dots" className="data-[state=active]:bg-zinc-800 text-xs px-3 py-1.5 gap-1.5">
                <span className="text-sm">⚫</span> Dots
              </TabsTrigger>
              <TabsTrigger value="colors" className="data-[state=active]:bg-zinc-800 text-xs px-3 py-1.5 gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Colors
              </TabsTrigger>
              <TabsTrigger value="typography" className="data-[state=active]:bg-zinc-800 text-xs px-3 py-1.5 gap-1.5">
                <Type className="w-3.5 h-3.5" /> Fonts
              </TabsTrigger>
              <TabsTrigger value="materials" className="data-[state=active]:bg-zinc-800 text-xs px-3 py-1.5 gap-1.5">
                <Paintbrush className="w-3.5 h-3.5" /> Materials
              </TabsTrigger>
              <TabsTrigger value="layout" className="data-[state=active]:bg-zinc-800 text-xs px-3 py-1.5 gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Icons
              </TabsTrigger>
              <TabsTrigger value="effects" className="data-[state=active]:bg-zinc-800 text-xs px-3 py-1.5 gap-1.5">
                <Layers className="w-3.5 h-3.5" /> 3D/FX
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-zinc-800 text-xs px-3 py-1.5 gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Advanced
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <BrandTab config={config} updateConfig={updateConfig} applyIndustryPreset={applyIndustryPreset} />
              <DotsTab config={config} toggleConfig={toggleConfig} updateConfig={updateConfig} />
              <ColorsTab config={config} toggleConfig={toggleConfig} updateConfig={updateConfig} />
              <TypographyTab config={config} toggleConfig={toggleConfig} updateConfig={updateConfig} />
              <MaterialsTab config={config} updateConfig={updateConfig} />
              <LayoutTab config={config} toggleConfig={toggleConfig} updateConfig={updateConfig} />
              <EffectsTab config={config} toggleConfig={toggleConfig} updateConfig={updateConfig} />
              <AdvancedTab config={config} toggleConfig={toggleConfig} updateConfig={updateConfig} />
            </div>
          </Tabs>
        </div>

        <ConfigFooter
          previewText={buildPromptPreview(config)}
          brandName={config.brandName}
          onReset={handleReset}
          onClose={onClose}
          onGenerate={handleGenerate}
        />
      </DialogContent>
    </Dialog>
  )
}
