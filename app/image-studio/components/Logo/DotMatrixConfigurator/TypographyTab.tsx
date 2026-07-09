"use client"

import { TabsContent } from '@/components/ui/tabs'
import { Type } from 'lucide-react'
import { DotMatrixConfig, TEXT_WEIGHT_OPTIONS, LETTER_SPACING_OPTIONS, TEXT_CASE_OPTIONS } from '../../../constants/dot-matrix-config'
import { FancyFontGrid } from '../FancyFontGrid'
import { OptionButton } from './OptionButton'

interface TypographyTabProps {
  config: DotMatrixConfig
  toggleConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
  updateConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
}

export function TypographyTab({ config, toggleConfig, updateConfig }: TypographyTabProps) {
  return (
    <TabsContent value="typography" className="mt-0 space-y-6">
      {/* Fancy Font Grid */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Type className="w-4 h-4 text-purple-400" />
          Fancy Font Styles
        </label>
        <FancyFontGrid
          brandName={config.brandName || 'BRAND'}
          selectedFont={config.fancyFontId}
          onSelectFont={(fontId) => updateConfig('fancyFontId', fontId)}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-700 pt-4">
        <p className="text-xs text-zinc-500 mb-4">Additional Typography Options</p>
      </div>

      {/* Text Weight */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Text Weight</label>
        <div className="flex gap-2">
          {TEXT_WEIGHT_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} selected={config.textWeight === opt.value} onClick={() => toggleConfig('textWeight', opt.value)} className="px-4 py-2 text-xs">
              {opt.label}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Letter Spacing */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Letter Spacing</label>
        <div className="flex gap-2">
          {LETTER_SPACING_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} selected={config.letterSpacing === opt.value} onClick={() => toggleConfig('letterSpacing', opt.value)} className="px-4 py-2 text-xs">
              {opt.label}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Text Case */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Text Case</label>
        <div className="flex gap-2">
          {TEXT_CASE_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} selected={config.textCase === opt.value} onClick={() => toggleConfig('textCase', opt.value)}>
              <div className="text-xs font-medium">{opt.label}</div>
              <div className="text-[10px] text-zinc-500">{opt.example}</div>
            </OptionButton>
          ))}
        </div>
      </div>
    </TabsContent>
  )
}
