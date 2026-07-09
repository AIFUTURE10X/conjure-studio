"use client"

import { Button } from '@/components/ui/button'
import { Eraser, Loader2 } from 'lucide-react'

interface RemoveBgButtonProps {
  onRemoveBackground: () => void
  isRemovingBg: boolean
  disabled?: boolean
}

export function RemoveBgButton({ onRemoveBackground, isRemovingBg, disabled }: RemoveBgButtonProps) {
  return (
    <Button
      onClick={onRemoveBackground}
      disabled={disabled || isRemovingBg}
      variant="outline"
      className="h-9 px-3 bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isRemovingBg ? (
        <>
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          <span className="text-xs">Removing...</span>
        </>
      ) : (
        <>
          <Eraser className="w-3.5 h-3.5 mr-1.5" />
          <span className="text-xs">Remove BG</span>
        </>
      )}
    </Button>
  )
}
