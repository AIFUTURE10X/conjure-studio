"use client"

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, ArrowRight, Check, Eye, HelpCircle, Lightbulb, X } from 'lucide-react'
import { ConstraintEditor } from './ConstraintEditor'
import {
  setCorrectionNote,
  setDirectorStep,
  setInferredVerdict,
  toggleObservedCorrection,
  useDirectorProject,
} from './useDirectorProject'
import type { ContinuityAssessment } from '@/lib/video/photo-director-schema'

/** Plain-language verdict for "do these photos show the same place?". */
function sameLocationVerdict(continuity: ContinuityAssessment): { label: string; tone: string } {
  if (continuity.viewpointRelation === 'different-rooms') return { label: 'No — these look like different rooms', tone: 'text-red-400' }
  if (continuity.sameLocationConfidence >= 0.85) return { label: 'Yes — same location', tone: 'text-emerald-400' }
  if (continuity.sameLocationConfidence >= 0.6) return { label: 'Probably the same location', tone: 'text-[#dbb56e]' }
  return { label: 'Unclear — hard to tell from these photos', tone: 'text-amber-400' }
}

const RISK_LABELS = { low: 'Low', medium: 'Medium', high: 'High' } as const

/** Step 2 — "Here's what I found": tiered analysis with user corrections. */
export function AnalysisReviewStep() {
  const project = useDirectorProject()
  const analysis = project?.analysis
  if (!project || !analysis) return null

  const { continuity } = analysis
  const verdict = sameLocationVerdict(continuity)
  const photoLabel = (index: number) => `Photo ${index + 1}`
  const strongest = [...analysis.observed].sort((a, b) => b.confidence - a.confidence)[0]

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1.5">
        <p className="text-xs font-bold text-white">Here&rsquo;s what I found</p>
        <p className="text-xs leading-5"><span className="text-zinc-500">Same location: </span><span className={verdict.tone}>{verdict.label}</span></p>
        {strongest && (
          <p className="text-xs leading-5"><span className="text-zinc-500">Strongest feature: </span><span className="text-zinc-200">{strongest.label}</span></p>
        )}
        <p className="text-xs leading-5">
          <span className="text-zinc-500">Recommended framing: </span>
          <span className="text-zinc-200">open on {photoLabel(analysis.bestOpeningPhotoIndex)}, close on {photoLabel(analysis.bestClosingPhotoIndex)}</span>
          {analysis.framingRationale && <span className="text-zinc-500"> — {analysis.framingRationale}</span>}
        </p>
        <p className="text-xs leading-5">
          <span className="text-zinc-500">Continuity risk for one continuous camera move: </span>
          <span className={continuity.riskLevel === 'high' ? 'text-red-400' : continuity.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'}>
            {RISK_LABELS[continuity.riskLevel]}
          </span>
          {continuity.recommendSeparateShots && <span className="text-zinc-400"> — separate shots are safer here</span>}
        </p>
        {continuity.riskReasons.length > 0 && (
          <ul className="text-[11px] text-zinc-500 leading-4 list-disc pl-4">
            {continuity.riskReasons.map((reason, index) => (<li key={index}>{reason}</li>))}
          </ul>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-[#dbb56e]" />
          <p className="text-xs font-medium text-zinc-200">What the AI can see</p>
          <span className="text-[10px] text-zinc-500">click ✕ on anything it got wrong</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {analysis.observed.map((item) => {
            const removed = project.correctedObservedIds.includes(item.id)
            return (
              <button
                key={item.id}
                onClick={() => toggleObservedCorrection(item.id)}
                title={removed ? `Marked wrong — click to restore. ${item.detail}` : `${item.detail || item.label} (seen in ${item.photoIndices.map((i) => i + 1).join(', ')})`}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-colors ${
                  removed
                    ? 'bg-zinc-900 text-zinc-600 line-through'
                    : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                }`}
              >
                {item.label}
                <X className="w-2.5 h-2.5 opacity-60" />
              </button>
            )
          })}
        </div>
      </div>

      {analysis.inferred.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <p className="text-xs font-medium text-zinc-200">Likely, but not certain — confirm?</p>
          </div>
          <div className="space-y-1">
            {analysis.inferred.map((item) => {
              const confirmed = project.confirmedInferredIds.includes(item.id)
              const rejected = project.rejectedInferredIds.includes(item.id)
              return (
                <div key={item.id} className="flex items-center gap-2 px-2 py-1 rounded-md bg-zinc-950 border border-zinc-800">
                  <p className={`flex-1 text-[11px] leading-4 ${rejected ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>{item.label}</p>
                  <button
                    onClick={() => setInferredVerdict(item.id, confirmed ? 'none' : 'confirmed')}
                    title="Yes, this is right"
                    className={`p-1 rounded ${confirmed ? 'bg-emerald-600/30 text-emerald-400' : 'text-zinc-600 hover:text-emerald-400'}`}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setInferredVerdict(item.id, rejected ? 'none' : 'rejected')}
                    title="No, this is wrong"
                    className={`p-1 rounded ${rejected ? 'bg-red-600/30 text-red-400' : 'text-zinc-600 hover:text-red-400'}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {analysis.suggested.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-zinc-400" />
            <p className="text-xs font-medium text-zinc-200">Video opportunities the AI spotted</p>
          </div>
          <ul className="text-[11px] text-zinc-400 leading-4 list-disc pl-4">
            {analysis.suggested.map((item) => (<li key={item.id}>{item.idea}</li>))}
          </ul>
        </div>
      )}

      <ConstraintEditor constraints={project.constraints} />

      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-200">Anything the AI misunderstood?</p>
        <Textarea
          value={project.correctionNote}
          onChange={(e) => setCorrectionNote(e.target.value)}
          placeholder='Optional — e.g. "The balcony looks directly toward a temple. Do not change the temple or balcony."'
          className="min-h-[52px] bg-zinc-950 border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 resize-y"
        />
      </div>

      {continuity.riskLevel === 'high' && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-400/90 leading-4">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          A single continuous camera move between these photos would likely distort the real room, so
          that option will be disabled in the concepts — separately animated shots stay available.
        </p>
      )}

      <Button
        onClick={() => setDirectorStep('brief')}
        size="sm"
        className="w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850]"
      >
        Looks right — continue
        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
      </Button>
    </div>
  )
}
