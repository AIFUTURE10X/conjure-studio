"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2, RefreshCw, Scissors } from 'lucide-react'
import { StoryboardShotRow } from './StoryboardShotRow'
import { CropDialog } from './CropDialog'
import { setDirectorPhotos, setDirectorStep, setDirectorStoryboard, useDirectorProject } from './useDirectorProject'
import { orderedShots } from './render-plan'
import type { PhotoReference, StoryboardShot } from '@/lib/video/photo-director-schema'

interface StoryboardStepProps {
  onRewrite: () => void
  isRewriting: boolean
}

/** Deterministic default for a user-added detail shot (motionCore must be specific). */
const CROP_SHOT_MOTION = 'Soft ambient light plays gently across the surfaces; everything in frame stays perfectly still.'

/** Step 5 — the editable shot plan. Locked shots survive a rewrite. */
export function StoryboardStep({ onRewrite, isRewriting }: StoryboardStepProps) {
  const project = useDirectorProject()
  const [showCrop, setShowCrop] = useState(false)
  if (!project) return null

  const shots = orderedShots(project)
  const totalSeconds = shots.reduce((sum, shot) => sum + shot.durationSeconds, 0)

  const handleCropped = (crop: PhotoReference) => {
    setDirectorPhotos([...project.photos, crop])
    const detailShot: StoryboardShot = {
      id: `shot-for-${crop.id}`,
      order: shots.length,
      title: crop.label ? `Detail: ${crop.label}` : 'Close-up detail',
      sourcePhotoId: crop.id,
      endPhotoId: null,
      cameraMove: 'static-ambient',
      motionCore: CROP_SHOT_MOTION,
      durationSeconds: 4,
      mood: project.brief?.mood === 'ai-choose' ? '' : project.brief?.mood ?? '',
      mustPreserveIds: [],
      locked: true,
    }
    setDirectorStoryboard([...project.storyboard, detailShot])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-[#f0d49b] flex-1">
          {shots.length} shot{shots.length === 1 ? '' : 's'} · ~{totalSeconds}s total
        </p>
        <button
          onClick={() => setShowCrop(true)}
          title="Cut a real close-up from a photo and add it as a detail shot"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
        >
          <Scissors className="w-3 h-3" />
          Add detail shot
        </button>
        <button
          onClick={onRewrite}
          disabled={isRewriting}
          title="Rewrite the storyboard — locked shots are kept"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {isRewriting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Rewrite
        </button>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {shots.map((shot, index) => (
          <StoryboardShotRow key={shot.id} shot={shot} index={index} total={shots.length} />
        ))}
      </div>

      <Button
        onClick={() => setDirectorStep('preflight')}
        size="sm"
        className="w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850]"
      >
        Review plan &amp; cost
        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
      </Button>

      <CropDialog
        open={showCrop}
        photos={project.photos.filter((photo) => !photo.isDerivedCrop)}
        onClose={() => setShowCrop(false)}
        onCropped={handleCropped}
      />
    </div>
  )
}
