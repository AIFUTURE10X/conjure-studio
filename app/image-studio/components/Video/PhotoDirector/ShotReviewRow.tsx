"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check, Download, Flag, Loader2, RefreshCw, Waves, X } from 'lucide-react'
import { setShotReview, setRenderOverride, updateDirectorShot } from './useDirectorProject'
import { plannedRenderFor } from './render-plan'
import { downloadClip } from '../video-clip-utils'
import { CLIP_CHECKLIST } from '../../../constants/photo-director'
import { estimateDirectorCredits } from '@/lib/video/director-assembly'
import { VIDEO_MODELS, VIDEO_MODEL_IDS, type VideoModelId } from '@/lib/video/providers'
import type { DirectorProject, StoryboardShot } from '@/lib/video/photo-director-schema'
import type { VideoJob } from '../useVideoGeneration'

interface ShotReviewRowProps {
  project: DirectorProject
  shot: StoryboardShot
  index: number
  jobs: VideoJob[]
  isGenerating: boolean
  onRegenerate: (shotId: string, options?: { reduceMovement?: boolean }) => void
  onGenerateFinal: (shotId: string) => void
}

/** Review one shot: draft playback beside its source photo, checklist, verdict, and the final upgrade. */
export function ShotReviewRow({ project, shot, index, jobs, isGenerating, onRegenerate, onGenerateFinal }: ShotReviewRowProps) {
  const [editingMotion, setEditingMotion] = useState(false)
  const shotJobs = project.shotJobs[shot.id] ?? { draftJobIds: [], finalJobIds: [], review: { status: 'none' as const, checklist: {} } }
  const review = shotJobs.review

  const latestJob = (ids: number[]) => jobs
    .filter((job) => ids.includes(job.jobId))
    .sort((a, b) => b.jobId - a.jobId)[0]
  const draft = latestJob(shotJobs.draftJobIds)
  const final = latestJob(shotJobs.finalJobIds)
  const shown = final ?? draft

  const source = project.photos.find((photo) => photo.id === shot.sourcePhotoId)
  const finalRender = plannedRenderFor(project, shot, 'final')
  const finalCredits = estimateDirectorCredits([finalRender], { includeAssembly: false }).total
  const finalModels = VIDEO_MODEL_IDS.filter((id) =>
    VIDEO_MODELS[id].tier === 'final' && (!shot.endPhotoId || VIDEO_MODELS[id].capabilities.endFrame))

  const setChecklist = (key: string, value: boolean) =>
    setShotReview(shot.id, { ...review, checklist: { ...review.checklist, [key]: value } })

  return (
    <div className={`rounded-lg border p-2.5 space-y-2 ${
      review.status === 'approved' ? 'border-emerald-700/50' : review.status === 'rejected' ? 'border-red-800/50' : 'border-zinc-800'
    } bg-zinc-950`}>
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold text-white flex-1 min-w-0 truncate">Shot {index + 1} — {shot.title}</p>
        {final && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#c99850]/20 text-[#dbb56e]">final</span>}
        {review.status !== 'none' && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
            review.status === 'approved' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'
          }`}>
            {review.status}
          </span>
        )}
      </div>

      <div className="flex gap-2 items-start">
        <div className="w-24 shrink-0 space-y-1">
          {source && <img src={source.thumbUrl} alt="Source photo" className="w-full rounded border border-zinc-800 object-cover" />}
          <p className="text-[9px] text-zinc-600 text-center">source photo</p>
        </div>
        <div className="flex-1 min-w-0">
          {!shown && <p className="text-[11px] text-zinc-500">No clip yet.</p>}
          {shown?.status === 'pending' && (
            <p className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />Generating — usually a few minutes…
            </p>
          )}
          {shown?.status === 'failed' && (
            <p className="text-[11px] text-red-400">{shown.error || 'Generation failed'} — credits were refunded.</p>
          )}
          {shown?.status === 'completed' && shown.videoUrl && (
            <video src={shown.videoUrl} controls playsInline crossOrigin="anonymous" className="w-full max-h-56 rounded-md bg-black" />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {CLIP_CHECKLIST.map((item) => (
          <label key={item.key} className="flex items-center gap-1 cursor-pointer text-[10px] text-zinc-400">
            <input
              type="checkbox"
              checked={review.checklist[item.key] ?? false}
              onChange={(e) => setChecklist(item.key, e.target.checked)}
              aria-label={item.label}
              className="w-3 h-3 accent-[#dbb56e]"
            />
            {item.label}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          onClick={() => setShotReview(shot.id, { ...review, status: 'approved' })}
          disabled={shown?.status !== 'completed'}
          size="sm"
          className="h-6 px-2 text-[10px] bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          <Check className="w-3 h-3 mr-1" />Approve
        </Button>
        <Button
          onClick={() => setShotReview(shot.id, { ...review, status: 'rejected' })}
          disabled={!shown}
          size="sm"
          className="h-6 px-2 text-[10px] bg-zinc-800 text-zinc-300 hover:bg-red-900/60 disabled:opacity-50"
        >
          <X className="w-3 h-3 mr-1" />Reject
        </Button>
        <Button
          onClick={() => setShotReview(shot.id, { status: 'rejected', checklist: review.checklist, note: 'Property distortion flagged' })}
          disabled={!shown}
          size="sm"
          title="Reject and flag that the room/property was distorted"
          className="h-6 px-2 text-[10px] bg-zinc-800 text-zinc-300 hover:bg-red-900/60 disabled:opacity-50"
        >
          <Flag className="w-3 h-3 mr-1" />Distorted
        </Button>
        <Button
          onClick={() => onRegenerate(shot.id)}
          disabled={isGenerating}
          size="sm"
          title="Generate another draft of this shot (charges draft credits again)"
          className="h-6 px-2 text-[10px] bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
        >
          <RefreshCw className="w-3 h-3 mr-1" />Regenerate
        </Button>
        <Button
          onClick={() => onRegenerate(shot.id, { reduceMovement: true })}
          disabled={isGenerating}
          size="sm"
          title="Swap to a calmer camera move and regenerate"
          className="h-6 px-2 text-[10px] bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
        >
          <Waves className="w-3 h-3 mr-1" />Reduce movement
        </Button>
        <button
          onClick={() => setEditingMotion(!editingMotion)}
          className="text-[10px] text-zinc-500 hover:text-white px-1"
        >
          Edit motion
        </button>
        {shown?.status === 'completed' && shown.videoUrl && (
          <button
            onClick={() => void downloadClip(shown.videoUrl as string, shown.jobId)}
            title="Download this clip as MP4"
            className="ml-auto p-1 rounded text-zinc-500 hover:text-white"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {editingMotion && (
        <Textarea
          value={shot.motionCore}
          onChange={(e) => updateDirectorShot(shot.id, { motionCore: e.target.value })}
          aria-label={`Shot ${index + 1} motion description`}
          className="min-h-[40px] bg-zinc-900 border-zinc-800 text-[11px] text-zinc-200 resize-y"
        />
      )}

      {review.status === 'approved' && !final && (
        <div className="flex items-center gap-2 rounded-md bg-zinc-900 border border-[#c99850]/30 p-2">
          <p className="text-[10px] text-zinc-400 flex-1">
            Draft approved — render the final version?
          </p>
          <select
            value={finalRender.model}
            onChange={(e) => setRenderOverride(shot.id, { model: e.target.value as VideoModelId })}
            aria-label="Final render model"
            className="h-6 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 px-1"
          >
            {finalModels.map((id) => (
              <option key={id} value={id}>{VIDEO_MODELS[id].label}</option>
            ))}
          </select>
          <Button
            onClick={() => onGenerateFinal(shot.id)}
            disabled={isGenerating}
            size="sm"
            title="Charges the shown credits for a final-quality render of this shot"
            className="h-6 px-2 text-[10px] font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
          >
            Render final · {finalCredits} cr
          </Button>
        </div>
      )}
    </div>
  )
}
