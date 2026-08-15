"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ChevronDown, ChevronRight, Loader2, Rocket } from 'lucide-react'
import { setDirectorStep, useDirectorProject } from './useDirectorProject'
import { constraintsForShot, orderedShots, plannedRenderFor } from './render-plan'
import { assembleMotionPrompt, estimateDirectorCredits } from '@/lib/video/director-assembly'
import { CAMERA_MOVE_META } from '@/lib/video/camera-moves'
import { aspectForPurpose } from '../../../constants/photo-director'
import { VIDEO_MODELS } from '@/lib/video/providers'

interface PreflightStepProps {
  onApprove: () => void
  isGenerating: boolean
}

/**
 * Step 6 — the full review before any credits are spent. The "Approve and
 * generate" button below is the ONLY action in the whole workflow that starts
 * generation and consumes credits.
 */
export function PreflightStep({ onApprove, isGenerating }: PreflightStepProps) {
  const project = useDirectorProject()
  const [showPrompts, setShowPrompts] = useState(false)
  if (!project || !project.brief) return null

  const shots = orderedShots(project)
  const concept = project.concepts?.find((item) => item.id === project.selectedConceptId)
  const drafts = shots.map((shot) => plannedRenderFor(project, shot, 'draft'))
  const estimate = estimateDirectorCredits(drafts, { includeAssembly: false })
  const aspect = aspectForPurpose(project.brief.purpose)

  const portraitAspect = aspect === '9:16'
  const orientationClash = project.photos.some((photo) =>
    !photo.isDerivedCrop && (portraitAspect ? photo.width > photo.height : photo.height > photo.width))

  const textLines = [
    project.brief.toggles.titleText && project.brief.hotelName && `Title: ${project.brief.hotelName}${project.brief.location ? ` — ${project.brief.location}` : ''}`,
    project.brief.toggles.captions && project.brief.message && `Caption: ${project.brief.message}`,
    project.brief.toggles.cta && project.brief.ctaText && `Call to action: ${project.brief.ctaText}`,
    project.brief.toggles.logo && 'Hotel logo overlay',
    project.brief.toggles.specWatermark && '"Spec Concept" watermark',
  ].filter((line): line is string => Boolean(line))

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1.5">
        <p className="text-xs font-bold text-white">Ready to generate drafts</p>
        {concept && <p className="text-xs text-zinc-300">{concept.title} — {concept.summary}</p>}
        <div className="flex items-center gap-1.5 flex-wrap">
          {project.photos.map((photo, index) => (
            <img key={photo.id} src={photo.thumbUrl} alt={photo.label || `Photo ${index + 1}`} className="h-10 rounded border border-zinc-800 object-cover" />
          ))}
        </div>
        <p className="text-[11px] text-zinc-500">
          Aspect ratio {aspect} · drafts render silent · audio {project.brief.toggles.ambient || project.brief.toggles.music ? 'added at the final/assembly stage' : 'off'}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800">
              <th className="text-left font-medium px-2 py-1.5">Shot</th>
              <th className="text-left font-medium px-2 py-1.5">Camera</th>
              <th className="text-right font-medium px-2 py-1.5">Length</th>
              <th className="text-left font-medium px-2 py-1.5">Draft model</th>
              <th className="text-right font-medium px-2 py-1.5">Credits</th>
            </tr>
          </thead>
          <tbody>
            {shots.map((shot, index) => {
              const render = drafts[index]
              const credits = estimate.perShot.find((item) => item.shotId === shot.id)?.credits ?? 0
              return (
                <tr key={shot.id} className="border-b border-zinc-800/60 last:border-0 text-zinc-300">
                  <td className="px-2 py-1.5">{index + 1}. {shot.title}{shot.endPhotoId ? ' ⇄' : ''}</td>
                  <td className="px-2 py-1.5 text-zinc-400">{CAMERA_MOVE_META[shot.cameraMove].label}</td>
                  <td className="px-2 py-1.5 text-right">{shot.durationSeconds}s</td>
                  <td className="px-2 py-1.5 text-zinc-400">{VIDEO_MODELS[render.model].label} · {render.resolution}</td>
                  <td className="px-2 py-1.5 text-right text-[#dbb56e]">{credits}</td>
                </tr>
              )
            })}
            <tr className="text-zinc-200 font-medium">
              <td className="px-2 py-1.5" colSpan={4}>Draft pass total</td>
              <td className="px-2 py-1.5 text-right text-[#dbb56e]">{estimate.total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-zinc-500 leading-4">
        Draft-first: you&rsquo;re only paying for cheap test clips now. Final-quality renders (and the
        10-credit film assembly) are separate, per-shot decisions after you&rsquo;ve approved the drafts.
      </p>

      <button onClick={() => setShowPrompts(!showPrompts)} className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white">
        {showPrompts ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Motion prompts that will be used
      </button>
      {showPrompts && (
        <div className="space-y-1.5">
          {shots.map((shot, index) => {
            let prompt = ''
            try {
              prompt = assembleMotionPrompt({
                model: drafts[index].model,
                cameraMove: shot.cameraMove,
                motionCore: shot.motionCore,
                durationSeconds: shot.durationSeconds,
                mood: shot.mood,
                constraints: constraintsForShot(project, shot),
              })
            } catch {
              prompt = '(motion description too short — edit this shot in the storyboard)'
            }
            return (
              <p key={shot.id} className="text-[10px] text-zinc-400 leading-4 bg-zinc-950 rounded-md p-2 border border-zinc-800 whitespace-pre-wrap">
                <span className="text-zinc-500 font-medium">Shot {index + 1}: </span>{prompt}
              </p>
            )
          })}
        </div>
      )}

      {textLines.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 space-y-1">
          <p className="text-[11px] font-medium text-zinc-200">Your text &amp; overlays (add in your editor — not burned into the clips)</p>
          <ul className="text-[11px] text-zinc-400 leading-4 list-disc pl-4">
            {textLines.map((line, index) => (<li key={index}>{line}</li>))}
          </ul>
        </div>
      )}

      {(orientationClash || concept?.fidelityRisk === 'high') && (
        <div className="space-y-1">
          {orientationClash && (
            <p className="flex items-start gap-1.5 text-[11px] text-amber-400/90 leading-4">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Your photos&rsquo; orientation doesn&rsquo;t match the {aspect} output — the model will crop.
              Consider &ldquo;Add detail shot&rdquo; in the storyboard to pre-crop the framing you want.
            </p>
          )}
          {concept?.fidelityRisk === 'high' && (
            <p className="flex items-start gap-1.5 text-[11px] text-amber-400/90 leading-4">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              This concept carries a high distortion risk — review the drafts carefully against the preservation list.
            </p>
          )}
        </div>
      )}

      <Button
        onClick={onApprove}
        disabled={isGenerating || shots.length === 0}
        size="sm"
        className="w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
        title="The only button that spends credits — starts the draft clips"
      >
        {isGenerating ? (
          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Starting drafts…</>
        ) : (
          <><Rocket className="w-3.5 h-3.5 mr-1.5" />Approve and generate · {estimate.total} credits</>
        )}
      </Button>
      <button onClick={() => setDirectorStep('storyboard')} className="text-[11px] text-zinc-500 hover:text-white">
        ← Back to the storyboard
      </button>
    </div>
  )
}
