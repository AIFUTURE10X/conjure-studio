"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Loader2, Sparkles } from 'lucide-react'
import { setDirectorBrief, useDirectorProject } from './useDirectorProject'
import {
  DEFAULT_BRIEF,
  DURATION_BUCKETS,
  GOAL_OPTIONS,
  MOOD_OPTIONS,
  PURPOSE_OPTIONS,
  STRUCTURE_OPTIONS,
  TOGGLE_DEFS,
} from '../../../constants/photo-director'
import type { DirectorBrief } from '@/lib/video/photo-director-schema'

interface BriefStepProps {
  onPlanConcepts: (brief: DirectorBrief) => void
  isPlanning: boolean
}

function ChipGroup<T extends string>({ label, options, value, onChange }: {
  label: string
  options: { value: T; label: string; hint?: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-200">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            title={option.hint}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              value === option.value
                ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Step 3 — plain-language creative questions. A pure form: no AI call, no jargon. */
export function BriefStep({ onPlanConcepts, isPlanning }: BriefStepProps) {
  const project = useDirectorProject()
  const [brief, setBrief] = useState<DirectorBrief>(project?.brief ?? DEFAULT_BRIEF)

  const patch = (partial: Partial<DirectorBrief>) => setBrief((current) => ({ ...current, ...partial }))
  const patchToggle = (key: keyof DirectorBrief['toggles'], value: boolean) =>
    setBrief((current) => ({ ...current, toggles: { ...current.toggles, [key]: value } }))

  const wantsText = brief.toggles.titleText || brief.toggles.captions || brief.toggles.cta

  const handleContinue = () => {
    setDirectorBrief(brief)
    onPlanConcepts(brief)
  }

  return (
    <div className="space-y-3">
      <ChipGroup label="What is this video for?" options={PURPOSE_OPTIONS} value={brief.purpose} onChange={(purpose) => patch({ purpose })} />
      <ChipGroup label="What should it accomplish?" options={GOAL_OPTIONS} value={brief.goal} onChange={(goal) => patch({ goal })} />
      <ChipGroup label="How long should it be?" options={DURATION_BUCKETS} value={brief.durationBucket} onChange={(durationBucket) => patch({ durationBucket })} />
      <ChipGroup label="What mood?" options={MOOD_OPTIONS} value={brief.mood} onChange={(mood) => patch({ mood })} />
      <ChipGroup label="How should it be built?" options={STRUCTURE_OPTIONS} value={brief.structure} onChange={(structure) => patch({ structure })} />

      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-200">Extras</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {TOGGLE_DEFS.map((toggle) => (
            <label key={toggle.key} className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={brief.toggles[toggle.key]}
                onCheckedChange={(checked) => patchToggle(toggle.key, checked)}
                aria-label={toggle.label}
              />
              <span className="text-[11px] text-zinc-300">{toggle.label}</span>
            </label>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 leading-4">
          Text, logo, and watermark aren&rsquo;t burned into the clips yet — your wording is collected
          here and handed to you as a copy-ready list to add in your editor.
        </p>
      </div>

      {wantsText && (
        <div className="grid grid-cols-2 gap-2">
          <Input value={brief.hotelName} onChange={(e) => patch({ hotelName: e.target.value })} placeholder="Hotel name" aria-label="Hotel name"
            className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600" />
          <Input value={brief.location} onChange={(e) => patch({ location: e.target.value })} placeholder="Location — e.g. Chiang Mai" aria-label="Location"
            className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600" />
          <Input value={brief.message} onChange={(e) => patch({ message: e.target.value })} placeholder="Main message" aria-label="Main message"
            className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600" />
          <Input value={brief.ctaText} onChange={(e) => patch({ ctaText: e.target.value })} placeholder="Call to action — e.g. Book direct" aria-label="Call to action"
            className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600" />
        </div>
      )}

      <Button
        onClick={handleContinue}
        disabled={isPlanning}
        size="sm"
        className="w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
      >
        {isPlanning ? (
          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Building concepts…</>
        ) : (
          <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Show me video concepts</>
        )}
      </Button>
    </div>
  )
}
