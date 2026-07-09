"use client"

/**
 * TShirt Controls Component
 *
 * Controls bar for T-shirt mockup: full color picker, brand name, reset, export
 * Color utilities extracted to tshirt-color-utils.ts
 */

import { useState, useEffect } from 'react'
import { RotateCcw, Download, ChevronDown, Eye, EyeOff, Type, Pipette } from 'lucide-react'
import { RgbaColorPicker, type RgbaColor } from 'react-colorful'
import { TSHIRT_COLORS, type TShirtColor } from './tshirt-assets'
import { hexToRgba, rgbaToHex, getTextColor, COLORFUL_PICKER_STYLES } from './tshirt-color-utils'

interface TShirtControlsProps {
  selectedColor: TShirtColor
  onColorChange: (color: TShirtColor) => void
  showColorPicker: boolean
  onToggleColorPicker: (show: boolean) => void
  showBrandName: boolean
  onToggleBrandName: (show: boolean) => void
  editableBrandName: string
  onBrandNameChange: (name: string) => void
  isEditingName: boolean
  onEditingNameChange: (editing: boolean) => void
  onReset: () => void
  showExportMenu: boolean
  onToggleExportMenu: (show: boolean) => void
  onExport: (format: 'png' | 'svg' | 'pdf') => void
}

export function TShirtControls({
  selectedColor,
  onColorChange,
  showColorPicker,
  onToggleColorPicker,
  showBrandName,
  onToggleBrandName,
  editableBrandName,
  onBrandNameChange,
  isEditingName,
  onEditingNameChange,
  onReset,
  showExportMenu,
  onToggleExportMenu,
  onExport,
}: TShirtControlsProps) {
  const [rgbaColor, setRgbaColor] = useState<RgbaColor>(hexToRgba(selectedColor.hex))
  const [hexInput, setHexInput] = useState({ r: '255', g: '255', b: '255' })

  // Sync RGBA color when selectedColor changes
  useEffect(() => {
    const rgba = hexToRgba(selectedColor.hex)
    setRgbaColor(rgba)
    setHexInput({ r: rgba.r.toString(), g: rgba.g.toString(), b: rgba.b.toString() })
  }, [selectedColor.hex])

  const handleRgbaChange = (color: RgbaColor) => {
    setRgbaColor(color)
    setHexInput({ r: color.r.toString(), g: color.g.toString(), b: color.b.toString() })
    const hex = rgbaToHex(color)
    const textColor = getTextColor(hex)
    onColorChange({ id: 'custom', name: 'Custom', hex, textColor })
  }

  const handleRgbInputChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const numValue = Math.max(0, Math.min(255, parseInt(value) || 0))
    setHexInput({ ...hexInput, [channel]: value })

    if (value !== '' && !isNaN(parseInt(value))) {
      const newRgba = { ...rgbaColor, [channel]: numValue }
      setRgbaColor(newRgba)
      const hex = rgbaToHex(newRgba)
      const textColor = getTextColor(hex)
      onColorChange({ id: 'custom', name: 'Custom', hex, textColor })
    }
  }

  const handlePresetClick = (color: TShirtColor) => {
    onColorChange(color)
    setRgbaColor(hexToRgba(color.hex))
    setHexInput({
      r: hexToRgba(color.hex).r.toString(),
      g: hexToRgba(color.hex).g.toString(),
      b: hexToRgba(color.hex).b.toString()
    })
  }

  return (
    <div className="flex items-center justify-between mt-3 gap-2">
      {/* Color Picker */}
      <div className="relative">
        <button
          onClick={() => onToggleColorPicker(!showColorPicker)}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 border border-zinc-700"
        >
          <div className="w-4 h-4 rounded-full border border-zinc-500" style={{ backgroundColor: selectedColor.hex }} />
          <span className="hidden sm:inline">{selectedColor.name}</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showColorPicker && (
          <div className="absolute bottom-full mb-2 left-0 p-3 bg-zinc-800 rounded-lg border border-zinc-700 shadow-xl z-10 w-[280px]">
            {/* Full Color Picker */}
            <div className="space-y-3">
              {/* Saturation/Brightness Square + Hue Slider */}
              <div className="custom-color-picker">
                <RgbaColorPicker color={rgbaColor} onChange={handleRgbaChange} />
              </div>

              {/* RGB Inputs */}
              <div className="flex items-center gap-2">
                <Pipette className="w-4 h-4 text-zinc-500" />
                <div className="flex gap-1 flex-1">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={hexInput.r}
                      onChange={(e) => handleRgbInputChange('r', e.target.value)}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-center text-white text-sm"
                      maxLength={3}
                    />
                    <div className="text-[10px] text-zinc-500 text-center mt-0.5">R</div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={hexInput.g}
                      onChange={(e) => handleRgbInputChange('g', e.target.value)}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-center text-white text-sm"
                      maxLength={3}
                    />
                    <div className="text-[10px] text-zinc-500 text-center mt-0.5">G</div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={hexInput.b}
                      onChange={(e) => handleRgbInputChange('b', e.target.value)}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-center text-white text-sm"
                      maxLength={3}
                    />
                    <div className="text-[10px] text-zinc-500 text-center mt-0.5">B</div>
                  </div>
                </div>
              </div>

              {/* Preset Colors */}
              <div className="pt-2 border-t border-zinc-700">
                <div className="text-[10px] text-zinc-500 mb-1.5">Presets</div>
                <div className="grid grid-cols-9 gap-1">
                  {TSHIRT_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => handlePresetClick(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        selectedColor.id === color.id ? 'border-purple-500 scale-110' : 'border-zinc-600'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Brand Name Controls */}
      <div className="flex items-center gap-1">
        {/* Toggle visibility */}
        <button
          onClick={() => onToggleBrandName(!showBrandName)}
          className={`p-1.5 rounded-lg border transition-colors ${
            showBrandName
              ? 'text-purple-400 bg-purple-500/20 border-purple-500/30'
              : 'text-zinc-400 bg-zinc-800 border-zinc-700 hover:text-white hover:bg-zinc-700'
          }`}
          title={showBrandName ? 'Hide brand name' : 'Show brand name'}
        >
          {showBrandName ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        {/* Edit brand name */}
        {showBrandName && (
          isEditingName ? (
            <input
              type="text"
              value={editableBrandName}
              onChange={(e) => onBrandNameChange(e.target.value)}
              onBlur={() => onEditingNameChange(false)}
              onKeyDown={(e) => e.key === 'Enter' && onEditingNameChange(false)}
              autoFocus
              className="w-28 px-2 py-1 bg-zinc-900 border border-purple-500/50 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Brand name..."
            />
          ) : (
            <button
              onClick={() => onEditingNameChange(true)}
              className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 border border-zinc-700"
              title="Edit brand name"
            >
              <Type className="w-3 h-3" />
              <span className="max-w-20 truncate">{editableBrandName || 'Add text'}</span>
            </button>
          )
        )}
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700"
        title="Reset logo position & size"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Export Dropdown */}
      <div className="relative">
        <button
          onClick={() => onToggleExportMenu(!showExportMenu)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-purple-500 to-pink-500 hover:opacity-90 rounded-lg text-sm text-white font-medium"
        >
          <Download className="w-4 h-4" />
          Export
          <ChevronDown className="w-3 h-3" />
        </button>

        {showExportMenu && (
          <div className="absolute bottom-full mb-2 right-0 bg-zinc-800 rounded-lg border border-zinc-700 shadow-xl z-10 overflow-hidden min-w-[120px]">
            <button onClick={() => onExport('png')} className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700">
              PNG (Image)
            </button>
            <button onClick={() => onExport('svg')} className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700">
              SVG (Vector)
            </button>
            <button onClick={() => onExport('pdf')} className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700">
              PDF (Print)
            </button>
          </div>
        )}
      </div>

      {/* Custom styles for react-colorful */}
      <style jsx global>{COLORFUL_PICKER_STYLES}</style>
    </div>
  )
}
