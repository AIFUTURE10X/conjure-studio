"use client"

/**
 * ExtendVideoDialog
 *
 * Collects the "what happens next" prompt for extending a finished clip.
 * Veo appends to the same file (+7s per pass); other models continue as a
 * new clip starting from the source clip's last frame.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ListPlus, Loader2 } from 'lucide-react'

interface ExtendVideoDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isNativeExtend: boolean
  modelLabel: string
  onConfirm: (extensionPrompt: string) => Promise<void>
}

export function ExtendVideoDialog({ isOpen, onOpenChange, isNativeExtend, modelLabel, onConfirm }: ExtendVideoDialogProps) {
  const [extensionPrompt, setExtensionPrompt] = useState('')
  const [isExtending, setIsExtending] = useState(false)

  const handleConfirm = async () => {
    if (!extensionPrompt.trim() || isExtending) return
    setIsExtending(true)
    try {
      await onConfirm(extensionPrompt.trim())
      onOpenChange(false)
      setExtensionPrompt('')
    } finally {
      setIsExtending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListPlus className="w-4 h-4 text-[#dbb56e]" />
            Extend video
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {isNativeExtend
              ? `${modelLabel} appends ~7 seconds to this clip in the same file. Repeat to build longer videos (up to ~2 minutes).`
              : `${modelLabel} continues from this clip's last frame as a new part. Chain parts to reach any length.`}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={extensionPrompt}
          onChange={(e) => setExtensionPrompt(e.target.value)}
          placeholder="Describe what happens next…"
          className="min-h-[80px] bg-zinc-950 border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!extensionPrompt.trim() || isExtending}
            className="bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black font-medium disabled:opacity-50"
          >
            {isExtending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Starting…
              </>
            ) : (
              'Extend'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
