"use client"

/**
 * StudioResetButton
 *
 * Header control that resets the active mode back to its defaults — no
 * prompt, no uploaded/generated images, settings restored. It dispatches to
 * the reset handler each mode's panel registered via StudioResetContext, so
 * this one button adapts to whichever tab is showing. Only rendered for the
 * modes that own a reset (image, video, logo, thumbnail, translate, mockups).
 */

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useStudioMode, useStudioReset } from '../../context/useStudio'
import type { StudioMode } from '../../context/studio-types'

const RESET_LABELS: Partial<Record<StudioMode, string>> = {
  image: 'Image',
  video: 'Video',
  logo: 'Logo',
  thumbnail: 'Thumbnail',
  translate: 'Translate',
  mockups: 'Mockups',
}

export function StudioResetButton() {
  const { mode } = useStudioMode()
  const { resetMode } = useStudioReset()
  const [showConfirm, setShowConfirm] = useState(false)

  const label = RESET_LABELS[mode]
  if (!label) return null

  const handleReset = () => {
    resetMode(mode)
    setShowConfirm(false)
    toast.success(`${label} tab reset to defaults`)
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors"
        title={`Reset the ${label} tab — clear the prompt, images, and settings`}
      >
        <RotateCcw className="w-3.5 h-3.5 text-[#dbb56e]" />
        <span className="hidden sm:inline">Reset</span>
      </button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Reset the {label} tab?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              This clears the prompt, any uploaded or generated images, and restores
              the default settings for the {label} tab. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 transition-colors">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:opacity-90 transition-opacity"
            >
              Reset tab
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
