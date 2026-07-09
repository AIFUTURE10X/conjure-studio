"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ImageIcon, Check } from 'lucide-react'
import { ASPECT_RATIO_OPTIONS, getAspectRatioDimensions } from '../../constants/toolbar-options'

interface AspectRatioPopoverProps {
  aspectRatio: string
  onAspectRatioChange: (ratio: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AspectRatioPopover({ aspectRatio, onAspectRatioChange, open, onOpenChange }: AspectRatioPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button className="px-6 py-3 font-medium flex items-center gap-2 bg-transparent text-zinc-400 hover:text-white">
          <ImageIcon className="w-4 h-4" />
          Ratios: {aspectRatio}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="center" sideOffset={12} avoidCollisions={false} className="w-[600px] bg-zinc-900 border-zinc-800 p-3">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-[#c99850]">Aspect Ratios:</h3>
          <p className="text-xs text-white/60 mt-1">Current: {aspectRatio}</p>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {ASPECT_RATIO_OPTIONS.map((ratio) => {
            const dims = getAspectRatioDimensions(ratio.value)
            return (
              <button
                key={ratio.value}
                onClick={() => { onAspectRatioChange(ratio.value); onOpenChange(false) }}
                className={`relative group rounded-lg overflow-hidden border transition-all p-3 ${
                  aspectRatio === ratio.value
                    ? 'border-[#c99850] bg-[#c99850]/10 border-2'
                    : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center justify-center mb-1.5">
                  <div
                    className={`border-2 ${aspectRatio === ratio.value ? 'border-[#c99850]' : 'border-white/30'}`}
                    style={{ width: dims.width, height: dims.height }}
                  />
                </div>
                <div className={`text-xs font-bold mb-0.5 ${aspectRatio === ratio.value ? 'text-[#c99850]' : 'text-white'}`}>
                  {ratio.label}
                </div>
                <div className="text-[10px] text-white/50">{ratio.description}</div>
                {aspectRatio === ratio.value && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#c99850] flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-black" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
