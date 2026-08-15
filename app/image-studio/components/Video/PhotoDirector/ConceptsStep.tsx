"use client"

import { Button } from '@/components/ui/button'
import { Ban, Clapperboard, Loader2, RefreshCw } from 'lucide-react'
import { setDirectorStep, useDirectorProject } from './useDirectorProject'
import { estimateDirectorCredits, gateConcepts, recommendRender } from '@/lib/video/director-assembly'
import { CAMERA_MOVE_META } from '@/lib/video/camera-moves'
import type { VideoConcept } from '@/lib/video/photo-director-schema'

interface ConceptsStepProps {
  onChooseConcept: (concept: VideoConcept) => void
  onReplan: () => void
  isPlanningStoryboard: boolean
  isPlanningConcepts: boolean
}

const RISK_STYLES = {
  low: 'bg-emerald-600/20 text-emerald-400',
  medium: 'bg-amber-600/20 text-amber-400',
  high: 'bg-red-600/20 text-red-400',
} as const

/** Draft-pass estimate for a concept (~6s shots on the recommended draft models). */
function conceptDraftCredits(concept: VideoConcept): number {
  const perShotSeconds = Math.max(4, Math.min(8, Math.round(concept.durationSeconds / concept.shotCount)))
  const renders = Array.from({ length: concept.shotCount }, (_, index) => {
    const usesEndFrame = concept.structure === 'continuous-transition'
    const rec = recommendRender({ endPhotoId: usesEndFrame ? 'end' : null }, 'draft')
    return {
      shotId: `est-${index}`,
      model: rec.model,
      durationSeconds: perShotSeconds,
      resolution: rec.resolution,
      withAudio: false,
    }
  })
  return estimateDirectorCredits(renders, { includeAssembly: false }).total
}

/** Step 4 — 3-5 concept cards; unsafe continuous transitions arrive disabled. */
export function ConceptsStep({ onChooseConcept, onReplan, isPlanningStoryboard, isPlanningConcepts }: ConceptsStepProps) {
  const project = useDirectorProject()
  if (!project?.concepts || !project.analysis) return null

  // Re-gate at render time so constraint/continuity corrections made after
  // planning still disable unsafe concepts (idempotent over the server's gate).
  const concepts = gateConcepts(project.concepts, project.analysis.continuity)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-[#f0d49b] flex-1">
          {concepts.length} concept{concepts.length === 1 ? '' : 's'} — pick the one that fits
        </p>
        <button
          onClick={onReplan}
          disabled={isPlanningConcepts}
          title="Ask for a fresh set of concepts"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {isPlanningConcepts ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          New ideas
        </button>
      </div>

      {concepts.map((concept) => (
        <div
          key={concept.id}
          className={`rounded-lg border p-3 space-y-1.5 ${
            concept.disabled ? 'border-zinc-800 bg-zinc-950 opacity-70' : 'border-zinc-800 bg-zinc-950'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold text-white">{concept.title}</p>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${RISK_STYLES[concept.fidelityRisk]}`}>
              {concept.fidelityRisk} risk
            </span>
            <span className="text-[10px] text-zinc-500 ml-auto">
              ~{concept.durationSeconds}s · {concept.shotCount} shot{concept.shotCount === 1 ? '' : 's'} · ~{conceptDraftCredits(concept)} credits in drafts
            </span>
          </div>
          <p className="text-[11px] text-zinc-300 leading-4">{concept.summary}</p>
          <p className="text-[10px] text-zinc-500 leading-4">
            {concept.cameraMoves.map((move) => CAMERA_MOVE_META[move].label).join(' · ')}
            {concept.platformFit.length > 0 && ` · best for ${concept.platformFit.join(', ')}`}
          </p>
          <p className="text-[10px] text-zinc-500 leading-4 italic">Why: {concept.rationale}</p>
          {concept.disabled ? (
            <p className="flex items-start gap-1.5 text-[11px] text-amber-400/90 leading-4">
              <Ban className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {concept.disabledReason}
            </p>
          ) : (
            <Button
              onClick={() => onChooseConcept(concept)}
              disabled={isPlanningStoryboard}
              size="sm"
              className="w-full h-7 font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
            >
              {isPlanningStoryboard ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Writing the storyboard…</>
              ) : (
                <><Clapperboard className="w-3.5 h-3.5 mr-1.5" />Choose this concept</>
              )}
            </Button>
          )}
        </div>
      ))}

      <button
        onClick={() => setDirectorStep('brief')}
        className="text-[11px] text-zinc-500 hover:text-white"
      >
        ← Change my answers
      </button>
    </div>
  )
}
