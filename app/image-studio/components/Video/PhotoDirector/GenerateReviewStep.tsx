"use client"

import { Button } from '@/components/ui/button'
import { Film, PartyPopper } from 'lucide-react'
import { ShotReviewRow } from './ShotReviewRow'
import { setDirectorStep, useDirectorProject } from './useDirectorProject'
import { orderedShots } from './render-plan'
import type { VideoJob } from '../useVideoGeneration'

interface GenerateReviewStepProps {
  jobs: VideoJob[]
  isGenerating: boolean
  onRegenerate: (shotId: string, options?: { reduceMovement?: boolean }) => void
  onGenerateFinal: (shotId: string) => void
  onOpenAssemble: () => void
}

/** Step 7 — review each clip against its source photo; assemble when everything is approved. */
export function GenerateReviewStep({ jobs, isGenerating, onRegenerate, onGenerateFinal, onOpenAssemble }: GenerateReviewStepProps) {
  const project = useDirectorProject()
  if (!project) return null

  const shots = orderedShots(project)
  const approvedCount = shots.filter((shot) => project.shotJobs[shot.id]?.review.status === 'approved').length
  const allApproved = shots.length > 0 && approvedCount === shots.length
  const completedClipIds = new Set(
    jobs.filter((job) => job.status === 'completed' && job.videoUrl).map((job) => job.jobId),
  )
  const approvedCompleted = shots.filter((shot) => {
    const shotJobs = project.shotJobs[shot.id]
    if (!shotJobs || shotJobs.review.status !== 'approved') return false
    return [...shotJobs.finalJobIds, ...shotJobs.draftJobIds].some((id) => completedClipIds.has(id))
  }).length

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[#f0d49b]">
        Review your clips — {approvedCount}/{shots.length} approved
      </p>
      <p className="text-[10px] text-zinc-600 leading-4">
        Compare each clip with its source photo and the preservation rules. Rejected clips are never
        assembled. Every clip is already saved to your video history and Creation Library.
      </p>

      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {shots.map((shot, index) => (
          <ShotReviewRow
            key={shot.id}
            project={project}
            shot={shot}
            index={index}
            jobs={jobs}
            isGenerating={isGenerating}
            onRegenerate={onRegenerate}
            onGenerateFinal={onGenerateFinal}
          />
        ))}
      </div>

      {shots.length >= 2 ? (
        <Button
          onClick={onOpenAssemble}
          disabled={!allApproved || approvedCompleted < 2}
          size="sm"
          title={allApproved
            ? 'Open Assemble Film — your shots are pre-selected in order'
            : 'Approve every shot first — rejected clips are never assembled'}
          className="w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
        >
          <Film className="w-3.5 h-3.5 mr-1.5" />
          Assemble the video · 10 credits
        </Button>
      ) : (
        <Button
          onClick={() => setDirectorStep('done')}
          disabled={!allApproved}
          size="sm"
          className="w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
        >
          <PartyPopper className="w-3.5 h-3.5 mr-1.5" />
          Finish — my clip is ready
        </Button>
      )}
      <p className="text-[10px] text-zinc-600 leading-4">
        Assembling opens the Film dialog with your shots pre-selected in order — add narration or
        music there. The finished film lands in the Videos list below.
      </p>
    </div>
  )
}
