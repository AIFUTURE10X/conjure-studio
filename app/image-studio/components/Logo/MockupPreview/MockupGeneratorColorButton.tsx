"use client"

/**
 * Color button component for MockupPhotoGenerator
 */

import { Loader2, Check, X } from 'lucide-react'
import { COLOR_HEX_MAP, LIGHT_COLORS, type GenerationStatus } from './mockup-generator-constants'

interface ColorButtonProps {
  productId: string
  color: string
  status: GenerationStatus
  isGeneratingAll: boolean
  onGenerate: (product: string, color: string, skipExisting: boolean) => void
}

// Get base color name (strips -back and -side suffixes)
const getBaseColor = (color: string) => color.replace('-back', '').replace('-side', '')

// Render a color swatch circle
function ColorSwatch({ color }: { color: string }) {
  const baseColor = getBaseColor(color)
  const hexColor = COLOR_HEX_MAP[baseColor] || '#6b7280'
  const isWhiteOrLight = LIGHT_COLORS.includes(baseColor)

  return (
    <span
      className={`w-4 h-4 rounded-full flex-shrink-0 ${isWhiteOrLight ? 'border border-zinc-500' : ''}`}
      style={{
        backgroundColor: hexColor === 'transparent' ? 'transparent' : hexColor,
        background: hexColor === 'transparent'
          ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
          : hexColor,
        backgroundSize: hexColor === 'transparent' ? '8px 8px' : undefined,
        backgroundPosition: hexColor === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
      }}
    />
  )
}

export function MockupGeneratorColorButton({ productId, color, status, isGeneratingAll, onGenerate }: ColorButtonProps) {
  const key = `${productId}-${color}`
  const currentStatus = status[key]
  const isGenerating = currentStatus === 'generating'

  const renderIcon = () => {
    if (currentStatus === 'generating') {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
    }
    if (currentStatus === 'success') {
      return <Check className="w-4 h-4 text-green-400" />
    }
    if (currentStatus === 'skipped') {
      return <Check className="w-4 h-4 text-yellow-400" />
    }
    if (currentStatus === 'error') {
      return <X className="w-4 h-4 text-red-400" />
    }
    return <ColorSwatch color={color} />
  }

  return (
    <button
      onClick={() => onGenerate(productId, color, false)}
      disabled={isGenerating || isGeneratingAll}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
        currentStatus === 'success'
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : currentStatus === 'skipped'
          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          : currentStatus === 'error'
          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
          : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 border border-zinc-600'
      } disabled:opacity-50`}
      title={currentStatus === 'skipped' ? 'Already exists - click to regenerate' : undefined}
    >
      {renderIcon()}
      <span className="capitalize">{color.replace('-back', ' ↩').replace('-side', ' →')}</span>
    </button>
  )
}
