"use client"

/**
 * EndFrameDialog
 *
 * Collects the end-state prompt for a start/end frame pair: the selected
 * image becomes the video start frame, and one new image is generated from it
 * in replicate mode to serve as the matching end frame.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Film, Loader2 } from 'lucide-react'

interface EndFrameDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  sourcePreview?: string
  onConfirm: (endPrompt: string) => Promise<void>
}

export function EndFrameDialog({ isOpen, onOpenChange, sourcePreview, onConfirm }: EndFrameDialogProps) {
  const [endPrompt, setEndPrompt] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleConfirm = async () => {
    if (!endPrompt.trim() || isCreating) return
    setIsCreating(true)
    try {
      await onConfirm(endPrompt.trim())
      onOpenChange(false)
      setEndPrompt('')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="w-4 h-4 text-[#dbb56e]" />
            Generate end frame
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Describe how the scene should look at the end of the video — a
            matching end frame is generated from your start frame (shown below).
          </DialogDescription>
        </DialogHeader>
        {sourcePreview && (
          <img
            src={sourcePreview}
            alt="Start frame"
            className="max-h-40 w-auto mx-auto rounded-md border border-zinc-800"
          />
        )}
        <Textarea
          value={endPrompt}
          onChange={(e) => setEndPrompt(e.target.value)}
          placeholder="e.g. same scene, the logo fully assembled and glowing"
          className="min-h-[80px] bg-zinc-950 border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!endPrompt.trim() || isCreating}
            className="bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black font-medium disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Generating…
              </>
            ) : (
              'Generate end frame'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
