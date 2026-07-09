"use client"

/**
 * Brand Sidebar Component
 *
 * Right sidebar with brand text settings: visibility, content, font, color,
 * effects, rotation, and size controls. Supports multiple text items.
 * Refactored to use extracted sub-components to stay under 300 lines.
 */

import { useState } from 'react'
import { Eye, EyeOff, ZoomIn, ZoomOut } from 'lucide-react'
import { REAL_FONTS } from '@/app/image-studio/constants/real-fonts'
import { TEXT_EFFECTS, ROTATION_PRESETS, type TextEffect, type TextItem } from '../text-effects-config'
import { TextColorPicker } from './TextColorPicker'
import { FontDropdown } from './FontDropdown'
import { TextItemsList } from './TextItemsList'

interface BrandSidebarProps {
  showBrandName: boolean
  editableBrandName: string
  brandFont: string
  brandColor: string
  brandScale: number
  brandEffect: TextEffect
  brandRotation: number
  brandWeight?: number
  showFontPicker: boolean
  onToggleBrandName: () => void
  onEditableBrandNameChange: (value: string) => void
  onBrandFontChange: (font: string) => void
  onBrandColorChange: (color: string) => void
  onBrandScaleIncrease: () => void
  onBrandScaleDecrease: () => void
  onBrandScaleChange?: (scale: number) => void
  onBrandEffectChange: (effect: TextEffect) => void
  onBrandRotationChange: (rotation: number) => void
  onBrandWeightChange?: (weight: number) => void
  onToggleFontPicker: () => void
  // Multiple text support
  textItems?: TextItem[]
  selectedTextId?: string | null
  onAddText?: () => void
  onRemoveText?: (id: string) => void
  onSelectText?: (id: string) => void
  onUpdateTextContent?: (id: string, content: string) => void
}

// Font weight options with labels
const WEIGHT_OPTIONS = [
  { value: 300, label: 'Fine' },
  { value: 400, label: 'Normal' },
  { value: 600, label: 'Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'X-Bold' },
]

function getWeightLabel(weight: number): string {
  const option = WEIGHT_OPTIONS.find(o => o.value === weight)
  return option?.label || `${weight}`
}

export function BrandSidebar({
  showBrandName,
  editableBrandName,
  brandFont,
  brandColor,
  brandScale,
  brandEffect,
  brandRotation,
  brandWeight = 400,
  showFontPicker,
  onToggleBrandName,
  onEditableBrandNameChange,
  onBrandFontChange,
  onBrandColorChange,
  onBrandScaleIncrease,
  onBrandScaleDecrease,
  onBrandScaleChange,
  onBrandEffectChange,
  onBrandRotationChange,
  onBrandWeightChange,
  onToggleFontPicker,
  textItems,
  selectedTextId,
  onAddText,
  onRemoveText,
  onSelectText,
  onUpdateTextContent,
}: BrandSidebarProps) {
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false)
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3 w-52 shrink-0 p-3 items-center justify-start max-h-[720px] overflow-y-auto overflow-x-hidden scrollbar-hide">
      <div className="text-[11px] text-zinc-200 font-medium uppercase tracking-wider text-center w-full py-1 bg-zinc-800/50 rounded-md border border-zinc-700/50">
        Brand Settings
      </div>

      {/* Show/Hide Toggle */}
      <button
        onClick={onToggleBrandName}
        className={`flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border text-xs font-extralight transition-all ${
          showBrandName
            ? 'text-purple-400 bg-purple-500/10 border-purple-500/30'
            : 'text-zinc-400 bg-zinc-800/50 border-zinc-700/50 hover:text-white hover:bg-zinc-700/50'
        }`}
      >
        {showBrandName ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        <span>{showBrandName ? 'On' : 'Off'}</span>
      </button>

      {showBrandName && (
        <>
          {/* Text Items List - Extracted Component */}
          {textItems && onAddText && onRemoveText && onSelectText && onUpdateTextContent && (
            <TextItemsList
              textItems={textItems}
              selectedTextId={selectedTextId ?? null}
              onAddText={onAddText}
              onRemoveText={onRemoveText}
              onSelectText={onSelectText}
              onUpdateTextContent={onUpdateTextContent}
            />
          )}

          {/* Text Content */}
          <div className="w-full space-y-1.5">
            <div className="text-[10px] text-zinc-300 font-normal uppercase">Text Content</div>
            <input
              type="text"
              value={editableBrandName}
              onChange={(e) => onEditableBrandNameChange(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-xs text-white font-extralight focus:outline-none focus:border-purple-500/50"
              placeholder="Enter text..."
            />
          </div>

          {/* Font Dropdown - Extracted Component */}
          <FontDropdown
            brandFont={brandFont}
            isOpen={isFontDropdownOpen}
            showAllFonts={showFontPicker}
            onToggle={() => { setIsFontDropdownOpen(!isFontDropdownOpen); setIsColorDropdownOpen(false) }}
            onFontChange={(font) => { onBrandFontChange(font); setIsFontDropdownOpen(false) }}
            onToggleShowAllFonts={onToggleFontPicker}
          />

          {/* Font Weight Selector - only show if font has multiple weights */}
          {REAL_FONTS[brandFont]?.weights && REAL_FONTS[brandFont].weights.length > 1 && onBrandWeightChange && (
            <div className="w-full space-y-1.5">
              <div className="text-[10px] text-zinc-300 font-normal uppercase">Weight</div>
              <div className="grid grid-cols-4 gap-1">
                {REAL_FONTS[brandFont].weights.map((weight) => (
                  <button
                    key={weight}
                    onClick={() => onBrandWeightChange(weight)}
                    className={`px-2 py-1.5 rounded-md text-[9px] font-extralight transition-all ${
                      brandWeight === weight
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
                    }`}
                  >
                    {getWeightLabel(weight)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Picker */}
          <TextColorPicker
            brandColor={brandColor}
            isOpen={isColorDropdownOpen}
            onToggle={() => { setIsColorDropdownOpen(!isColorDropdownOpen); setIsFontDropdownOpen(false) }}
            onColorChange={onBrandColorChange}
          />

          {/* Effect Grid */}
          <div className="w-full space-y-1.5">
            <div className="text-[10px] text-zinc-300 font-normal uppercase">Effect</div>
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(TEXT_EFFECTS) as TextEffect[]).map((effectKey) => (
                <button
                  key={effectKey}
                  onClick={() => onBrandEffectChange(effectKey)}
                  className={`px-2 py-1.5 rounded-md text-[9px] font-extralight transition-all ${
                    brandEffect === effectKey
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
                  }`}
                >
                  {TEXT_EFFECTS[effectKey].label}
                </button>
              ))}
            </div>
          </div>

          {/* Rotation Presets + Slider */}
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-300 font-normal uppercase">Rotation</span>
              <span className="text-[10px] text-zinc-300 font-normal">{brandRotation}°</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {ROTATION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onBrandRotationChange(preset.value)}
                  className={`px-1 py-1.5 rounded-md text-[9px] font-extralight transition-all ${
                    brandRotation === preset.value
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size Controls */}
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-300 font-normal uppercase">Size</span>
              <span className="text-[10px] text-zinc-300 font-normal">{Math.round(brandScale * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onBrandScaleDecrease}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-md border border-zinc-700/50"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="10"
                max="300"
                value={Math.round(brandScale * 100)}
                onChange={(e) => onBrandScaleChange?.(parseInt(e.target.value) / 100)}
                className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <button
                onClick={onBrandScaleIncrease}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-md border border-zinc-700/50"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
