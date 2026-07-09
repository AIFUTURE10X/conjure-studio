"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Lock, Unlock, RefreshCw } from 'lucide-react'

interface SeedControlProps {
  seed: number | null
  onSeedChange: (seed: number | null) => void
}

export function SeedControl({ seed, onSeedChange }: SeedControlProps) {
  const [isLocked, setIsLocked] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const generateRandomSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000000)
    setInputValue(newSeed.toString())
    onSeedChange(newSeed)
  }

  const toggleLock = () => {
    if (!isLocked) {
      // Locking - use current value or generate new
      const seedValue = inputValue ? parseInt(inputValue) : Math.floor(Math.random() * 1000000000)
      setInputValue(seedValue.toString())
      onSeedChange(seedValue)
      setIsLocked(true)
    } else {
      // Unlocking - clear seed
      setIsLocked(false)
      onSeedChange(null)
    }
  }

  const handleInputChange = (value: string) => {
    // Only allow numbers
    const sanitized = value.replace(/[^0-9]/g, '')
    setInputValue(sanitized)
    if (sanitized) {
      onSeedChange(parseInt(sanitized))
    }
  }

  return (
    <Card className="bg-zinc-800 border-[#c99850]/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-white">Seed Control</label>
        <Button
          onClick={toggleLock}
          size="sm"
          variant="ghost"
          className={`h-7 px-2 ${
            isLocked 
              ? 'bg-[#c99850]/20 text-[#c99850]' 
              : 'bg-zinc-700 text-zinc-400'
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
              Random
            </>
          )}
        </Button>
      </div>

      {isLocked && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter seed number"
            className="flex-1 px-3 py-2 rounded-lg text-xs bg-zinc-900 text-white placeholder:text-white/50 border border-[#c99850]/30 focus:outline-none focus:ring-2 focus:ring-[#c99850]/50"
          />
          <Button
            onClick={generateRandomSeed}
            size="sm"
            variant="ghost"
            className="h-9 px-3 bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850]"
            title="Generate random seed"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      )}

      <p className="text-[10px] text-white/60 mt-2">
        {isLocked 
          ? 'Locked seed produces reproducible results' 
          : 'Random seed generates unique variations'}
      </p>
    </Card>
  )
}
