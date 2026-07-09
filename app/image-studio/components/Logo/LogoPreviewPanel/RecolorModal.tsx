"use client"

/**
 * RecolorModal Component
 *
 * Modal for AI-powered logo recoloring with up to 4 color pickers.
 * Uses FLUX Kontext to intelligently recolor logos while preserving structure.
 */

import { useState, useEffect } from 'react'
import { X, Loader2, Palette, Sparkles, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

// Predefined color palette for quick selection
const QUICK_COLORS = [
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Black', hex: '#1A1A1A' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Bronze', hex: '#CD7F32' },
  { name: 'Copper', hex: '#B87333' },
  { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Platinum', hex: '#E5E4E2' },
]

// Find closest matching color name from QUICK_COLORS palette
function findClosestColorName(hex: string): string {
  if (!hex) return ''

  // Check exact match first (case-insensitive)
  const exact = QUICK_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase())
  if (exact) return exact.name

  // Convert hex to RGB for comparison
  const hexToRgb = (h: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  const targetRgb = hexToRgb(hex)
  if (!targetRgb) return hex

  // Find closest color by Euclidean distance
  let closestName = hex
  let minDistance = Infinity

  for (const color of QUICK_COLORS) {
    const colorRgb = hexToRgb(color.hex)
    if (!colorRgb) continue

    const distance = Math.sqrt(
      Math.pow(targetRgb.r - colorRgb.r, 2) +
      Math.pow(targetRgb.g - colorRgb.g, 2) +
      Math.pow(targetRgb.b - colorRgb.b, 2)
    )

    if (distance < minDistance) {
      minDistance = distance
      closestName = color.name
    }
  }

  // If distance is too large (> 100), use "Custom" prefix
  if (minDistance > 100) {
    return `Custom ${closestName}`
  }

  return closestName
}

interface RecolorModalProps {
  isOpen: boolean
  onClose: () => void
  logoUrl: string
  onRecolored: (newUrl: string) => void
}

// Default colors for modal
const DEFAULT_COLORS = ['#D4AF37', '#1E3A5F', '', '']
const DEFAULT_NAMES = ['Gold', 'Navy', '', '']

export function RecolorModal({ isOpen, onClose, logoUrl, onRecolored }: RecolorModalProps) {
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS)
  const [colorNames, setColorNames] = useState<string[]>(DEFAULT_NAMES)
  const [isLoading, setIsLoading] = useState(false)
  const [preserveMetallic, setPreserveMetallic] = useState(true)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setColors([...DEFAULT_COLORS])
      setColorNames([...DEFAULT_NAMES])
      setPreserveMetallic(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleColorChange = (index: number, hex: string, name?: string) => {
    const newColors = [...colors]
    const newNames = [...colorNames]
    newColors[index] = hex
    // If no name provided, find the closest matching color name
    newNames[index] = name || findClosestColorName(hex)
    setColors(newColors)
    setColorNames(newNames)
  }

  const handleQuickColor = (index: number, color: typeof QUICK_COLORS[0]) => {
    handleColorChange(index, color.hex, color.name)
  }

  const handleClearColor = (index: number) => {
    handleColorChange(index, '', '')
  }

  const activeColors = colors.filter(c => c)

  const handleRecolor = async () => {
    if (activeColors.length === 0) {
      toast.error('Please select at least one color')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/recolor-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: logoUrl,
          colors: colorNames.filter(c => c),
          preserveMetallic,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to recolor logo')
      }

      toast.success('Logo recolored successfully!')
      onRecolored(data.image)
      onClose()
    } catch (error) {
      console.error('Recolor error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to recolor logo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Recolor Logo</h2>
              <p className="text-xs text-zinc-400">Select up to 4 colors for your logo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
              <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Color Pickers */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">Colors (select 1-4)</label>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-zinc-600 cursor-pointer relative overflow-hidden"
                      style={{ backgroundColor: colors[index] || '#27272a' }}
                    >
                      {!colors[index] && (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                          <Plus className="w-5 h-5" />
                        </div>
                      )}
                      <input
                        type="color"
                        value={colors[index] || '#D4AF37'}
                        onChange={(e) => handleColorChange(index, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={colorNames[index]}
                        onChange={(e) => handleColorChange(index, colors[index], e.target.value)}
                        placeholder={`Color ${index + 1}`}
                        className="w-full px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded text-white placeholder:text-zinc-500"
                      />
                    </div>
                    {colors[index] && (
                      <button
                        onClick={() => handleClearColor(index)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Colors */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Quick Colors</label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    // Add to first empty slot or replace last
                    const emptyIndex = colors.findIndex(c => !c)
                    const targetIndex = emptyIndex !== -1 ? emptyIndex : 3
                    handleQuickColor(targetIndex, color)
                  }}
                  className="w-7 h-7 rounded-md border border-zinc-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="preserveMetallic"
              checked={preserveMetallic}
              onChange={(e) => setPreserveMetallic(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500"
            />
            <label htmlFor="preserveMetallic" className="text-sm text-zinc-300">
              Preserve metallic/3D qualities
            </label>
          </div>

          {/* Selected Colors Summary */}
          {activeColors.length > 0 && (
            <div className="p-3 bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-400 mb-2">Will recolor to:</p>
              <div className="flex items-center gap-2 flex-wrap">
                {colorNames.filter(c => c).map((name, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-zinc-700 text-white rounded">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRecolor}
            disabled={isLoading || activeColors.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Recoloring...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Recolor Logo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
