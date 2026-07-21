"use client"

import { toast } from 'sonner'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { RotateCcw, Sparkles } from 'lucide-react'
import { ConciergeChatView } from './ConciergeChatView'
import { useStudioCore, useStudioMode } from '../../context/useStudio'
import { useConciergeChat } from '../../hooks/useConciergeChat'
import { startConciergePlan } from '../../hooks/useConciergePlan'
import { videoTemplateParams } from '../../constants/video-starter-templates'
import type { ConciergePlan } from '../../constants/concierge-tree'

interface ConciergeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Studio Concierge: a chat that turns "what do you want to make?" into a
 * complete studio setup. The AI (via /api/concierge) picks the model, writes
 * the prompts, and returns a plan; applying it configures mode + settings +
 * prompts in one click and pins the progress checklist.
 */
export function ConciergeDialog({ open, onOpenChange }: ConciergeDialogProps) {
  const { state, savePreset } = useStudioCore()
  const { setMode } = useStudioMode()
  const { messages, isThinking, send, reset } = useConciergeChat()

  const saveTemplate = (plan: ConciergePlan) => {
    if (!plan.video) return
    savePreset(
      plan.title,
      videoTemplateParams({
        prompt: plan.videoPrompt ?? plan.promptSeed ?? '',
        video: plan.video,
        category: 'Concierge',
      }),
      'video',
    )
    toast.success(`"${plan.title}" saved to your video templates (Concierge shelf)`)
  }

  const applyPlan = (plan: ConciergePlan) => {
    if (plan.video) state.setVideoSettings(plan.video)
    if (plan.videoPrompt) {
      state.setVideoPrompt(plan.videoPrompt)
    } else if (plan.promptSeed && !state.videoPrompt.trim()) {
      state.setVideoPrompt(plan.promptSeed)
    }
    if (plan.imagePrompt) state.setMainPrompt(plan.imagePrompt)
    if (plan.imageAspectRatio) state.setAspectRatio(plan.imageAspectRatio)
    setMode(plan.mode)
    startConciergePlan(plan.id, plan)
    const modeLabel = { image: 'Image', video: 'Video', logo: 'Logo' }[plan.mode as string] ?? plan.mode
    const firstStep = plan.steps[0]?.label
    toast.success(`${plan.title} — starting in ${modeLabel} mode`, {
      description: firstStep ? `Step 1: ${firstStep}. Your checklist is pinned bottom-right.` : 'Your checklist is pinned bottom-right.',
      duration: 7000,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden bg-zinc-950 border-zinc-800">
        <DialogTitle className="flex items-center gap-2 text-base text-white">
          <Sparkles className="w-4 h-4 text-[#dbb56e]" />
          Studio Concierge
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="ml-auto flex items-center gap-1 text-[11px] font-normal text-zinc-500 hover:text-zinc-200 transition-colors"
              title="Start a fresh conversation"
            >
              <RotateCcw className="w-3 h-3" />
              Start over
            </button>
          )}
        </DialogTitle>

        <ConciergeChatView
          messages={messages}
          isThinking={isThinking}
          onSend={send}
          onApply={applyPlan}
          onSaveTemplate={saveTemplate}
        />
      </DialogContent>
    </Dialog>
  )
}
