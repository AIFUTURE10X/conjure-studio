"use client"

/**
 * Letter Grid Component
 * Displays clickable letters for color assignment
 */

import { X } from 'lucide-react'
import { isLightColor } from '@/app/image-studio/utils/color-conversions'
import type { ColorOption, LetterColorConfig } from '@/app/image-studio/constants/color-palettes'

interface LetterGridProps {
  letters: string[]
  letterColors: LetterColorConfig[]
  selectedPosition: number | null
  onLetterClick: (position: number) => void
  onRemoveColor: (position: number, e: React.MouseEvent) => void
  getColorForPosition: (position: number) => ColorOption | undefined
}

export function LetterGrid({
  letters,
  letterColors,
  selectedPosition,
  onLetterClick,
  onRemoveColor,
  getColorForPosition,
}: LetterGridProps) {
  return (
    <div className="flex flex-wrap gap-1.5 p-3 bg-zinc-800/50 rounded-lg">
      {letters.map((letter, index) => {
        const position = index + 1
        const assignedColor = getColorForPosition(position)
        const isSelected = selectedPosition === position

        return (
          <button
            key={index}
            onClick={() => onLetterClick(position)}
            className={`relative w-10 h-10 rounded-lg font-bold text-lg transition-all ${
              isSelected
                ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-900 scale-110'
                : 'hover:scale-105'
            } ${
              assignedColor
                ? 'border-2'
                : 'border border-zinc-600 bg-zinc-700 text-white hover:border-zinc-500'
            }`}
            style={assignedColor ? {
              backgroundColor: assignedColor.hex,
              color: isLightColor(assignedColor.hex) ? '#000' : '#fff',
              borderColor: assignedColor.hex
            } : undefined}
          >
            {letter.toUpperCase()}

            {/* Position indicator */}
            <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-zinc-900 text-[9px] text-zinc-400 flex items-center justify-center border border-zinc-700">
              {position}
            </span>

            {/* Remove button for assigned colors */}
            {assignedColor && (
              <button
                onClick={(e) => onRemoveColor(position, e)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </button>
        )
      })}
    </div>
  )
}
