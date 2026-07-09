"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, Info, Lock, Unlock } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SeedControlDropdownProps {
  seed: number | null
  onSeedChange: (seed: number | null) => void
}

export function SeedControlDropdown({ seed, onSeedChange }: SeedControlDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(seed?.toString() || '')
  const [isLocked, setIsLocked] = useState(false)

  const handleRandomize = () => {
    const randomSeed = Math.floor(Math.random() * 1000000)
    onSeedChange(randomSeed)
    setInputValue(randomSeed.toString())
    setIsLocked(false)
  }

  const handleSeedChange = (value: string) => {
    setInputValue(value)
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 0) {
      onSeedChange(numValue)
    } else if (value === '') {
      onSeedChange(null)
      setIsLocked(false)
    }
  }

  const handleToggleLock = () => {
    const newLockedState = !isLocked
    setIsLocked(newLockedState)
    
    if (newLockedState) {
      // Locking - if no seed exists, generate one
      if (seed === null) {
        const randomSeed = Math.floor(Math.random() * 1000000)
        onSeedChange(randomSeed)
        setInputValue(randomSeed.toString())
      }
    } else {
      // Unlocking - generate new random seed
      const randomSeed = Math.floor(Math.random() * 1000000)
      onSeedChange(randomSeed)
      setInputValue(randomSeed.toString())
    }
  }

  const displayValue = seed !== null ? seed.toString() : 'Random'

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-between bg-zinc-800 border-[#c99850]/50 hover:border-[#c99850] hover:bg-zinc-800 text-white min-w-[200px] h-9"
          >
            <div className="flex items-center gap-2">
              {isLocked ? (
                <Lock className="w-3.5 h-3.5 text-[#c99850]" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-white/50" />
              )}
              <span className="text-xs">Seed: {displayValue}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] bg-zinc-800 border-[#c99850]/50 p-3" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white">Seed Value</label>
              <span className="text-[10px] text-white/60 uppercase">
                {isLocked ? 'Seed is locked' : 'Seed is unlocked'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-[#c99850]/30">
              <Button
                onClick={handleToggleLock}
                size="sm"
                variant="ghost"
                className={`flex-1 h-8 text-xs ${
                  isLocked 
                    ? 'bg-[#c99850] hover:bg-[#dbb56e] text-white' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white/70'
                }`}
              >
                {isLocked ? (
                  <>
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3 mr-1" />
                    Unlocked
                  </>
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                value={inputValue}
                onChange={(e) => handleSeedChange(e.target.value)}
                placeholder="Enter seed (e.g., 38240)"
                className="flex-1 h-8 bg-zinc-900 border-[#c99850]/30 text-white text-xs"
                disabled={isLocked}
              />
              <Button
                onClick={handleRandomize}
                size="sm"
                className="bg-[#c99850] hover:bg-[#dbb56e] text-white h-8 px-3 text-xs"
              >
                Random
              </Button>
            </div>
            <p className="text-[10px] text-white/70 leading-relaxed">
              {isLocked 
                ? 'Seed is locked - same image will be generated with identical settings. Click "Locked" to unlock.'
                : 'Seed changes with each generation for unique variations. Lock a seed to reproduce exact results.'
              }
            </p>
          </div>
        </PopoverContent>
      </Popover>

      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 hover:bg-zinc-800"
            >
              <Info className="w-4 h-4 text-white/60" />
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="max-w-[280px] bg-yellow-500 text-black p-3 border-none"
          >
            <p className="text-xs leading-relaxed mb-2">
              Seeds control randomness in image generation. Using the same seed with identical settings produces the same image.
            </p>
            <p className="text-xs leading-relaxed font-medium">
              Lock a seed for reproducible results, or keep it random for creative exploration.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
