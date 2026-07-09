"use client"

/**
 * QuestionCard Component
 *
 * Renders a single question with its options.
 * Displays AI-suggested badge when the answer was auto-filled.
 */

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { WizardQuestion } from './questions/questionnaire-data'
import { OptionCard } from './OptionCard'
import { DepthSlider, TiltSlider } from './QuestionSliders'

interface QuestionCardProps {
  question: WizardQuestion
  answer: string | string[] | number | undefined
  onAnswer: (value: string | string[] | undefined) => void
  onToggleMulti: (optionId: string) => void
  extrusionDepth?: number
  onExtrusionChange?: (value: number) => void
  tiltAngle?: number
  onTiltAngleChange?: (value: number) => void
  isAIFilled?: boolean
}

export function QuestionCard({
  question,
  answer,
  onAnswer,
  onToggleMulti,
  extrusionDepth,
  onExtrusionChange,
  tiltAngle,
  onTiltAngleChange,
  isAIFilled = false,
}: QuestionCardProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)

  // AI Enhance handler
  const handleAIEnhance = async () => {
    const currentText = (answer as string) || ''
    if (!currentText.trim()) return

    setIsEnhancing(true)
    try {
      const response = await fetch('/api/enhance-logo-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentText }),
      })
      const data = await response.json()
      if (data.enhancedPrompt) {
        onAnswer(data.enhancedPrompt)
      }
    } catch (error) {
      console.error('Failed to enhance prompt:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  // Text input question
  if (question.type === 'text') {
    const useTextarea = question.hasAIEnhance || question.id === 'logoImagePrompt'

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{question.title}</h2>
          <p className="text-sm text-zinc-400">{question.subtitle}</p>
        </div>

        <div className="max-w-md mx-auto space-y-3">
          {useTextarea ? (
            <textarea
              value={(answer as string) || ''}
              onChange={(e) => onAnswer(e.target.value)}
              placeholder={question.placeholder}
              rows={4}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-base placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={(answer as string) || ''}
              onChange={(e) => onAnswer(e.target.value)}
              placeholder={question.placeholder}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-lg placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              autoFocus
            />
          )}

          {question.hasAIEnhance && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleAIEnhance}
                  disabled={isEnhancing || !((answer as string) || '').trim()}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI Enhance Prompt
                    </>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Improve your description with AI suggestions
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    )
  }

  // Single or multi-select question
  const isMulti = question.type === 'multi'
  const selectedIds = Array.isArray(answer) ? answer : answer ? [answer] : []

  // Check if this question has many options (needs scrollable container)
  const hasManyOptions = (question.options?.length || 0) > 8

  // Map depth card selection to slider value
  const getSliderValueFromCard = (cardId: string): number => {
    switch (cardId) {
      case 'flat': return 0
      case 'subtle': return 35
      case 'medium': return 65
      case 'dramatic': return 100
      default: return 50
    }
  }

  // Map tilt card selection to angle value
  const getTiltAngleFromCard = (cardId: string): number => {
    switch (cardId) {
      case 'no-tilt': return 0
      case 'slight-left': return -10
      case 'slight-right': return 10
      case 'dynamic-left': return -20
      case 'dynamic-right': return 20
      default: return 0
    }
  }

  // Handle card click for depth question
  const handleDepthCardClick = (optionId: string) => {
    onAnswer(optionId)
    if (onExtrusionChange) {
      onExtrusionChange(getSliderValueFromCard(optionId))
    }
  }

  // Handle card click for tilt question
  const handleTiltCardClick = (optionId: string) => {
    onAnswer(optionId)
    if (onTiltAngleChange) {
      onTiltAngleChange(getTiltAngleFromCard(optionId))
    }
  }

  // AI Suggested Badge Component
  const AIFilledBadge = () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 ml-2 text-xs bg-purple-500/20 text-purple-300 rounded-full cursor-help">
          <Sparkles className="w-3 h-3" />
          AI Suggested
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        This was auto-filled based on logo analysis. Click any option to change it.
      </TooltipContent>
    </Tooltip>
  )

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">
          {question.title}
          {isAIFilled && <AIFilledBadge />}
        </h2>
        <p className="text-sm text-zinc-400">
          {question.subtitle}
          {isMulti && question.maxSelections && (
            <span className="ml-1 text-purple-400">
              (Select up to {question.maxSelections})
            </span>
          )}
        </p>
      </div>

      <TooltipProvider delayDuration={300}>
        <div
          className={`
            ${hasManyOptions ? 'max-h-[300px] overflow-y-auto scrollbar-hide' : ''}
          `}
          style={hasManyOptions ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : {}}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl mx-auto">
            {question.options?.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                isSelected={selectedIds.includes(option.id)}
                isMulti={isMulti}
                onClick={() => {
                  if (isMulti) {
                    onToggleMulti(option.id)
                  } else if (question.id === 'depth') {
                    handleDepthCardClick(option.id)
                  } else if (question.id === 'logoTilt') {
                    handleTiltCardClick(option.id)
                  } else {
                    // For non-required single-select, allow toggle (deselect by clicking again)
                    if (!question.required && selectedIds.includes(option.id)) {
                      onAnswer(undefined)
                    } else {
                      onAnswer(option.id)
                    }
                  }
                }}
              />
            ))}
          </div>
        </div>
      </TooltipProvider>

      {/* 3D Intensity Slider for depth question */}
      {question.id === 'depth' && onExtrusionChange && (
        <DepthSlider
          extrusionDepth={extrusionDepth ?? 50}
          onExtrusionChange={onExtrusionChange}
        />
      )}

      {/* Tilt Angle Slider for logoTilt question */}
      {question.id === 'logoTilt' && onTiltAngleChange && (
        <TiltSlider
          tiltAngle={tiltAngle ?? 0}
          onTiltAngleChange={onTiltAngleChange}
        />
      )}
    </div>
  )
}
