"use client"

/**
 * FontCategorySelector Component
 *
 * Two-step font selection for Quick Mode:
 * 1. Choose a category (6 options)
 * 2. Optionally refine by selecting a specific font within category
 *
 * In Advanced Mode, the full font list is still available via QuestionCard.
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, Sparkles } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { FONT_CATEGORIES, FontCategory } from './questions/questionnaire-data'

interface FontCategorySelectorProps {
  selectedCategory: string | undefined
  selectedFont: string | undefined
  onSelectCategory: (categoryId: string, defaultFont: string) => void
  onSelectFont: (fontId: string) => void
  isAIFilled?: boolean
}

export function FontCategorySelector({
  selectedCategory,
  selectedFont,
  onSelectCategory,
  onSelectFont,
  isAIFilled = false,
}: FontCategorySelectorProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Find the currently selected category object
  const currentCategory = FONT_CATEGORIES.find(cat => cat.id === selectedCategory)

  const handleCategoryClick = (category: FontCategory) => {
    if (selectedCategory === category.id) {
      // Toggle expansion if already selected
      setExpandedCategory(expandedCategory === category.id ? null : category.id)
    } else {
      // Select category and its default font
      onSelectCategory(category.id, category.defaultFont)
      setExpandedCategory(category.id)
    }
  }

  const handleFontClick = (fontId: string) => {
    onSelectFont(fontId)
  }

  // AI Suggested Badge
  const AIFilledBadge = () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 ml-2 text-xs bg-purple-500/20 text-purple-300 rounded-full cursor-help">
          <Sparkles className="w-3 h-3" />
          AI Suggested
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        Font category selected based on logo analysis
      </TooltipContent>
    </Tooltip>
  )

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose a Font Style
          {isAIFilled && <AIFilledBadge />}
        </h2>
        <p className="text-sm text-zinc-400">
          Select a category that matches your brand personality
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
        {FONT_CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id
          const isExpanded = expandedCategory === category.id

          return (
            <div key={category.id} className="flex flex-col">
              {/* Category Card */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleCategoryClick(category)}
                    className={`
                      relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                      ${isSelected
                        ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30'
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
                      }
                    `}
                  >
                    <span className="text-2xl mb-2">{category.emoji}</span>
                    <span className="text-sm font-medium text-white text-center">
                      {category.label}
                    </span>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-purple-400" />
                      </div>
                    )}

                    {/* Expand/collapse indicator for selected */}
                    {isSelected && (
                      <div className="mt-2 text-zinc-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="font-medium">{category.label}</p>
                  <p className="text-xs text-zinc-400">{category.description}</p>
                  <p className="text-xs text-purple-400 mt-1">
                    {category.fonts.length} fonts available
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Expanded font list */}
              {isSelected && isExpanded && (
                <div className="mt-2 p-2 bg-zinc-800/80 rounded-lg border border-zinc-700">
                  <p className="text-xs text-zinc-400 mb-2 text-center">
                    Pick a specific font:
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {category.fonts.map((fontId) => {
                      const isThisFontSelected = selectedFont === fontId
                      // Format font name for display
                      const displayName = fontId
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')

                      return (
                        <button
                          key={fontId}
                          onClick={() => handleFontClick(fontId)}
                          className={`
                            px-2 py-1 text-xs rounded transition-all
                            ${isThisFontSelected
                              ? 'bg-purple-500 text-white'
                              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                            }
                          `}
                        >
                          {displayName}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Current selection summary */}
      {currentCategory && selectedFont && (
        <div className="text-center text-sm text-zinc-400 mt-4">
          Selected:{' '}
          <span className="text-purple-400 font-medium">
            {currentCategory.label}
          </span>
          {' '}&rarr;{' '}
          <span className="text-white font-medium">
            {selectedFont
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </span>
        </div>
      )}
    </div>
  )
}
