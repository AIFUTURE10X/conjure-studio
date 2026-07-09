"use client"

/**
 * Weight Selector Component
 * Grid of font weight options
 */

import { REAL_FONTS } from '@/app/image-studio/constants/real-fonts'
import { getWeightLabel } from '@/app/image-studio/constants/brand-fonts'

interface WeightSelectorProps {
  brandFont: string
  brandWeight: number
  onWeightChange: (weight: number) => void
}

export function WeightSelector({
  brandFont,
  brandWeight,
  onWeightChange,
}: WeightSelectorProps) {
  const fontWeights = REAL_FONTS[brandFont]?.weights

  // Only show if font has multiple weights
  if (!fontWeights || fontWeights.length <= 1) {
    return null
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="text-[10px] text-zinc-300 font-normal uppercase">Weight</div>
      <div className="grid grid-cols-4 gap-1">
        {fontWeights.map((weight) => (
          <button
            key={weight}
            onClick={() => onWeightChange(weight)}
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
  )
}
