"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Sparkles } from 'lucide-react'

interface StylePreset {
  value: string
  label: string
  thumbnail: string
  description: string
}

interface StylePopoverProps {
  selectedStyle: string
  onStyleChange: (style: string) => void
  stylePresets: StylePreset[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onHover?: (hovered: boolean) => void
}

export function StylePopover({ selectedStyle, onStyleChange, stylePresets, open, onOpenChange, onHover }: StylePopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          className="px-6 py-3 font-medium flex items-center gap-2 bg-transparent text-zinc-400 hover:text-white"
          onMouseEnter={() => onHover?.(true)}
          onMouseLeave={() => onHover?.(false)}
        >
          <Sparkles className="w-4 h-4" />
          Style: {selectedStyle}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="center" sideOffset={12} alignOffset={0} avoidCollisions={false} className="w-[760px] bg-zinc-950 border-zinc-800 p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-zinc-400 mb-2">Style:</h3>
          <input
            type="text"
            value={selectedStyle}
            readOnly
            className="w-full px-3 py-2 bg-zinc-900 border border-[#c99850]/30 rounded text-[#c99850] text-sm focus:outline-none focus:ring-1 focus:ring-[#c99850]"
          />
        </div>

        <div className="grid grid-cols-4 gap-2 max-h-[400px] overflow-y-auto pr-1">
          {stylePresets.map((preset) => (
            <Tooltip key={preset.value} delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { onStyleChange(preset.value); onOpenChange(false) }}
                  className={`relative rounded-lg overflow-hidden transition-all min-h-[75px] ${
                    selectedStyle === preset.value
                      ? 'bg-linear-to-br from-[#c99850] to-[#b8923d] ring-2 ring-[#c99850]'
                      : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <div className={`px-3 py-3 text-left ${selectedStyle === preset.value ? 'text-black' : 'text-[#c99850]'}`}>
                    <div className="text-sm font-semibold leading-tight wrap-break-word">{preset.label}</div>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-black border-2 border-[#c99850] p-3 max-w-[280px]" sideOffset={10}>
                <div className="space-y-2">
                  <img
                    src={preset.thumbnail || `/placeholder.svg?height=90&width=120&query=${encodeURIComponent(preset.label + ' art style example')}`}
                    alt={preset.label}
                    className="w-full h-[90px] object-cover rounded border border-[#c99850]/30"
                  />
                  <div className="text-[#c99850] text-sm font-bold">{preset.label}</div>
                  {preset.description && <div className="text-zinc-300 text-xs leading-relaxed">{preset.description}</div>}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
