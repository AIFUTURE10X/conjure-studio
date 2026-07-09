"use client"

/**
 * Color Summary Component
 * Shows assigned colors at the bottom
 */

import type { LetterColorConfig } from '@/app/image-studio/constants/color-palettes'

interface ColorSummaryProps {
  letterColors: LetterColorConfig[]
  letters: string[]
}

export function ColorSummary({ letterColors, letters }: ColorSummaryProps) {
  if (letterColors.length === 0) return null

  return (
    <div className="p-2 bg-zinc-800/30 rounded-lg">
      <div className="text-[10px] text-zinc-500 mb-1.5">Assigned Colors:</div>
      <div className="flex flex-wrap gap-1">
        {letterColors
          .sort((a, b) => a.position - b.position)
          .map((lc) => (
            <span
              key={lc.position}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
              style={{
                backgroundColor: `${lc.color.hex}33`,
                color: lc.color.hex
              }}
            >
              #{lc.position} {letters[lc.position - 1]?.toUpperCase()}: {lc.color.name}
            </span>
          ))}
      </div>
    </div>
  )
}
