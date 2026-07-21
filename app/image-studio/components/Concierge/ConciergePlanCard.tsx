"use client"

import { Button } from '@/components/ui/button'
import { BookmarkPlus, Clapperboard, Coins, ImageIcon, ListChecks, MapPin, Sparkles, Wand2 } from 'lucide-react'
import { planCostLine, planModelLabel, type ConciergePlan } from '../../constants/concierge-tree'

const MODE_LABELS: Record<string, string> = {
  image: 'Image mode',
  video: 'Video mode',
  logo: 'Logo mode',
}

interface ConciergePlanCardProps {
  plan: ConciergePlan
  onApply: () => void
  /** Save the plan's video recipe as a reusable template (video plans only). */
  onSaveTemplate?: () => void
}

/** Plan preview inside the Concierge dialog: model + cost badges, why line, steps, apply button. */
export function ConciergePlanCard({ plan, onApply, onSaveTemplate }: ConciergePlanCardProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#c99850]/30 bg-zinc-900 p-4">
        <div className="mb-3 flex items-center gap-2 border-b border-[#c99850]/20 pb-2">
          <ListChecks className="w-4 h-4 text-[#c99850]" />
          <span className="text-sm font-bold text-white">{plan.title}</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#c99850]/15 text-[#dbb56e] border border-[#c99850]/30">
              {planModelLabel(plan)}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Coins className="w-3 h-3" />
              {planCostLine(plan)}
            </span>
          </div>
        </div>

        <p className="mb-3 text-xs leading-5 text-zinc-400">{plan.why}</p>

        <div className="mb-3 rounded-md border border-[#c99850]/25 bg-[#c99850]/5 px-3 py-2 space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-[#f0d49b]">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {plan.mode === 'video' ? (
              <>You&apos;ll start in <span className="font-bold">Video mode</span></>
            ) : (
              <>You&apos;ll start in <span className="font-bold">{MODE_LABELS[plan.mode] ?? plan.mode}</span> — the
                visuals come first, then you animate them</>
            )}
          </p>
          {plan.video && plan.mode !== 'video' && (
            <p className="flex items-center gap-1.5 text-[11px] leading-4 text-zinc-400">
              <Clapperboard className="w-3 h-3 shrink-0 text-[#dbb56e]" />
              Video is already configured ({planModelLabel(plan)}, {plan.video.duration}s
              {plan.videoPrompt ? ', motion prompt written' : ''}) — it&apos;s waiting in the Video tab for the later steps.
            </p>
          )}
          {plan.imagePrompt && (
            <p className="flex items-center gap-1.5 text-[11px] leading-4 text-zinc-400">
              <ImageIcon className="w-3 h-3 shrink-0 text-[#dbb56e]" />
              Your image prompt is pre-written — just press Generate.
            </p>
          )}
          {plan.mode === 'video' && plan.videoPrompt && (
            <p className="flex items-center gap-1.5 text-[11px] leading-4 text-zinc-400">
              <Sparkles className="w-3 h-3 shrink-0 text-[#dbb56e]" />
              Your video prompt is pre-written — review it and press Generate.
            </p>
          )}
        </div>

        <ol className="space-y-2">
          {plan.steps.map((step, index) => (
            <li
              key={step.key}
              className="flex gap-3 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#c99850] text-[11px] font-bold text-black">
                {index + 1}
              </span>
              <p className="text-sm leading-6 text-zinc-200">{step.label}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onApply}
          className="flex-1 font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850]"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Set up my studio
        </Button>
        {onSaveTemplate && plan.video && (
          <Button
            onClick={onSaveTemplate}
            variant="ghost"
            className="shrink-0 bg-zinc-800 text-[#dbb56e] hover:bg-zinc-700 px-3"
            title="Save this recipe (model, settings, prompt) as a video template without applying it"
          >
            <BookmarkPlus className="w-4 h-4" />
          </Button>
        )}
      </div>
      <p className="text-center text-[11px] leading-4 text-zinc-500">
        Switches to the right mode, prefills the settings, and pins this
        checklist while you work. Nothing generates until you press Generate.
      </p>
    </div>
  )
}
