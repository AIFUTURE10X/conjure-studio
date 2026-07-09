"use client"

import { Button } from '@/components/ui/button'
import { Sparkles, Save } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { GOLD_GRADIENT } from '../../../constants/logo-constants'

interface ConfigFooterProps {
  previewText: string
  brandName: string
  onReset: () => void
  onClose: () => void
  onGenerate: () => void
  onSavePreset?: () => void
}

export function ConfigFooter({
  previewText,
  brandName,
  onReset,
  onClose,
  onGenerate,
  onSavePreset
}: ConfigFooterProps) {
  return (
    <div className="border-t border-zinc-800 px-6 py-4 bg-zinc-900/80 shrink-0">
      {/* Settings Preview */}
      <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg">
        <div className="text-[10px] text-zinc-500 mb-1">Preview Summary</div>
        <div className="text-xs text-zinc-300">{previewText}</div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-zinc-400 hover:text-white"
          >
            Reset to Defaults
          </Button>
          {onSavePreset && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSavePreset}
                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save Preset
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Save these settings as a custom preset for quick access
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={onGenerate}
            disabled={!brandName.trim()}
            className="px-6 font-semibold text-black disabled:opacity-50"
            style={{ background: GOLD_GRADIENT }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Logo
          </Button>
        </div>
      </div>
    </div>
  )
}
