"use client"

/**
 * Brand Sidebar Component
 * Right sidebar: Brand settings (visibility, text, font, color, scale, effect, rotation)
 * Composed of smaller sub-components for maintainability
 */

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { TextEffect, TextItem } from '../../text-effects-config'
import { TextItemsList } from './TextItemsList'
import { FontSelector } from './FontSelector'
import { WeightSelector } from './WeightSelector'
import { ColorSelector } from './ColorSelector'
import { EffectSelector } from './EffectSelector'
import { RotationControls } from './RotationControls'
import { SizeControls } from './SizeControls'

interface BrandSidebarProps {
  showBrandName: boolean
  editableBrandName: string
  isEditingName: boolean
  brandFont: string
  brandColor: string
  brandScale: number
  brandEffect: TextEffect
  brandRotation: number
  brandWeight?: number
  showFontPicker: boolean
  showTextColorPicker: boolean
  showEffectPicker: boolean
  onToggleBrandName: () => void
  onEditableBrandNameChange: (value: string) => void
  onStartEditingName: () => void
  onStopEditingName: () => void
  onBrandFontChange: (font: string) => void
  onBrandColorChange: (color: string) => void
  onBrandScaleIncrease: () => void
  onBrandScaleDecrease: () => void
  onBrandScaleChange?: (scale: number) => void
  onBrandEffectChange: (effect: TextEffect) => void
  onBrandRotationChange: (rotation: number) => void
  onBrandWeightChange?: (weight: number) => void
  onToggleFontPicker: () => void
  onToggleTextColorPicker: () => void
  onToggleEffectPicker: () => void
  // Multiple text support
  textItems?: TextItem[]
  selectedTextId?: string | null
  onAddText?: () => void
  onRemoveText?: (id: string) => void
  onSelectText?: (id: string) => void
  onUpdateTextContent?: (id: string, content: string) => void
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

  const handleFontDropdownToggle = () => {
    setIsFontDropdownOpen(!isFontDropdownOpen)
    setIsColorDropdownOpen(false)
  }

  const handleColorDropdownToggle = () => {
    setIsColorDropdownOpen(!isColorDropdownOpen)
    setIsFontDropdownOpen(false)
  }

  const handleFontChange = (font: string) => {
    onBrandFontChange(font)
    setIsFontDropdownOpen(false)
  }

  return (
    <div className="flex flex-col gap-3 w-52 shrink-0 p-3 items-center justify-start max-h-[720px] overflow-y-auto scrollbar-hide">
      <div className="text-[11px] text-zinc-200 font-medium uppercase tracking-wider text-center w-full py-1 bg-zinc-800/50 rounded-md border border-zinc-700/50">Brand Settings</div>

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
          {/* Text Items List */}
          <TextItemsList
            textItems={textItems}
            selectedTextId={selectedTextId}
            onAddText={onAddText}
            onRemoveText={onRemoveText}
            onSelectText={onSelectText}
            onUpdateTextContent={onUpdateTextContent}
          />

          {/* Current Text Edit */}
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

          {/* Font Selector */}
          <FontSelector
            brandFont={brandFont}
            showFontPicker={showFontPicker}
            isOpen={isFontDropdownOpen}
            onToggleOpen={handleFontDropdownToggle}
            onFontChange={handleFontChange}
            onToggleShowMore={onToggleFontPicker}
          />

          {/* Weight Selector */}
          {onBrandWeightChange && (
            <WeightSelector
              brandFont={brandFont}
              brandWeight={brandWeight}
              onWeightChange={onBrandWeightChange}
            />
          )}

          {/* Color Selector */}
          <ColorSelector
            brandColor={brandColor}
            isOpen={isColorDropdownOpen}
            onToggleOpen={handleColorDropdownToggle}
            onColorChange={onBrandColorChange}
          />

          {/* Effect Selector */}
          <EffectSelector
            brandEffect={brandEffect}
            onEffectChange={onBrandEffectChange}
          />

          {/* Rotation Controls */}
          <RotationControls
            brandRotation={brandRotation}
            onRotationChange={onBrandRotationChange}
          />

          {/* Size Controls */}
          <SizeControls
            brandScale={brandScale}
            onScaleIncrease={onBrandScaleIncrease}
            onScaleDecrease={onBrandScaleDecrease}
            onScaleChange={onBrandScaleChange}
          />
        </>
      )}
    </div>
  )
}
