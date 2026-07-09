"use client"

/**
 * OptionCard Component
 *
 * Individual option button within a question
 */

import { useEffect } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { QuestionOption } from './questions/questionnaire-data'

// Track loaded fonts to avoid duplicate link tags
const loadedFonts = new Set<string>()

function loadGoogleFont(fontFamily: string) {
  if (loadedFonts.has(fontFamily)) return
  loadedFonts.add(fontFamily)

  const link = document.createElement('link')
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}&display=swap`
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

interface OptionCardProps {
  option: QuestionOption
  isSelected: boolean
  isMulti: boolean
  onClick: () => void
}

export function OptionCard({ option, isSelected, isMulti, onClick }: OptionCardProps) {
  // Load Google Font when component mounts if option has googleFont
  useEffect(() => {
    if (option.googleFont) {
      loadGoogleFont(option.googleFont)
    }
  }, [option.googleFont])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`
            relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all
            ${
              isSelected
                ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
            }
          `}
        >
          {/* Selection indicator */}
          {isMulti && (
            <div
              className={`
                absolute top-1.5 right-1.5 w-4 h-4 rounded border-2 flex items-center justify-center
                ${isSelected ? 'border-purple-500 bg-purple-500' : 'border-zinc-600'}
              `}
            >
              {isSelected && (
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          )}

          {/* Emoji */}
          <span className="text-2xl">{option.emoji}</span>

          {/* Label */}
          <span className="text-xs font-medium text-white">{option.label}</span>

          {/* Description */}
          <span className="text-[9px] text-zinc-400 text-center leading-tight">
            {option.description}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs bg-zinc-800 border-zinc-700 p-3">
        <p className="font-semibold text-white">{option.label}</p>
        <p className="text-xs text-zinc-300 mb-2">{option.description}</p>
        {option.googleFont && (
          <p
            className="text-xl text-purple-300 mt-1 py-1 px-2 bg-zinc-900/50 rounded"
            style={{ fontFamily: `'${option.googleFont}', serif` }}
          >
            {option.label}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
