"use client"

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Sparkles, RotateCcw, Wand2, Settings } from 'lucide-react'

interface LogoPanelHeaderProps {
  logoMode: 'guided' | 'expert'
  setLogoMode: (mode: 'guided' | 'expert') => void
  onClearAll: () => void
}

export function LogoPanelHeader({
  logoMode,
  setLogoMode,
  onClearAll
}: LogoPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#dbb56e]" />
        <h2 className="text-sm font-semibold text-white">Logo Generator</h2>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#c99850]/20 text-[#dbb56e] border border-[#c99850]/30">
          PNG + SVG
        </span>
        {/* Mode Toggle */}
        <div className="flex items-center bg-zinc-800 rounded-lg p-0.5 ml-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setLogoMode('guided')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
                  logoMode === 'guided'
                    ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Wand2 className="w-3 h-3" />
                Logo Wizard
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Step-by-step wizard for personalized logo suggestions
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setLogoMode('expert')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
                  logoMode === 'expert'
                    ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Settings className="w-3 h-3" />
                Expert Mode
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Full control with all presets and advanced options
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <Button
        onClick={onClearAll}
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs"
      >
        <RotateCcw className="w-3 h-3 mr-1" />
        Clear All
      </Button>
    </div>
  )
}
