"use client"

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { ArrowDown, ArrowUp, ArrowRightLeft, ChevronDown, ChevronRight, Lock, LockOpen, X } from 'lucide-react'
import { moveDirectorShot, removeDirectorShot, updateDirectorShot, useDirectorProject } from './useDirectorProject'
import { constraintsForShot, plannedRenderFor } from './render-plan'
import { assembleMotionPrompt } from '@/lib/video/director-assembly'
import { CAMERA_MOVES, CAMERA_MOVE_META } from '@/lib/video/camera-moves'
import type { StoryboardShot } from '@/lib/video/photo-director-schema'

const DURATIONS = [4, 5, 6, 7, 8]

interface StoryboardShotRowProps {
  shot: StoryboardShot
  index: number
  total: number
}

/** One editable storyboard shot: motion, camera, duration, source, locks, and the live prompt preview. */
export function StoryboardShotRow({ shot, index, total }: StoryboardShotRowProps) {
  const project = useDirectorProject()
  const [showPrompt, setShowPrompt] = useState(false)
  if (!project) return null

  const photoById = (id: string | null | undefined) => project.photos.find((photo) => photo.id === id)
  const source = photoById(shot.sourcePhotoId)
  const end = photoById(shot.endPhotoId)
  const startSeconds = project.storyboard
    .filter((item) => item.order < shot.order)
    .reduce((sum, item) => sum + item.durationSeconds, 0)

  let promptPreview = ''
  try {
    promptPreview = assembleMotionPrompt({
      model: plannedRenderFor(project, shot, 'draft').model,
      cameraMove: shot.cameraMove,
      motionCore: shot.motionCore,
      durationSeconds: shot.durationSeconds,
      mood: shot.mood,
      constraints: constraintsForShot(project, shot),
    })
  } catch {
    promptPreview = 'Write a longer motion description to see the full prompt.'
  }

  return (
    <div className={`rounded-lg border p-2.5 space-y-2 ${shot.locked ? 'border-[#c99850]/40 bg-zinc-950' : 'border-zinc-800 bg-zinc-950'}`}>
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold text-white flex-1 min-w-0 truncate">
          Shot {index + 1} · {startSeconds}–{startSeconds + shot.durationSeconds}s — {shot.title}
        </p>
        <button onClick={() => moveDirectorShot(shot.id, -1)} disabled={index === 0} title="Move earlier"
          className="p-1 rounded text-zinc-600 hover:text-white disabled:opacity-30">
          <ArrowUp className="w-3 h-3" />
        </button>
        <button onClick={() => moveDirectorShot(shot.id, 1)} disabled={index === total - 1} title="Move later"
          className="p-1 rounded text-zinc-600 hover:text-white disabled:opacity-30">
          <ArrowDown className="w-3 h-3" />
        </button>
        <button
          onClick={() => updateDirectorShot(shot.id, { locked: !shot.locked })}
          title={shot.locked ? 'Locked — a storyboard rewrite keeps this shot. Click to unlock' : 'Unlocked — a storyboard rewrite may replace this shot. Click to lock'}
          className={`p-1 rounded ${shot.locked ? 'text-[#dbb56e]' : 'text-zinc-600 hover:text-white'}`}
        >
          {shot.locked ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
        </button>
        <button onClick={() => removeDirectorShot(shot.id)} disabled={total <= 1} title="Remove this shot"
          className="p-1 rounded text-zinc-600 hover:text-red-400 disabled:opacity-30">
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {source && <img src={source.thumbUrl} alt={`Source: ${source.label || 'photo'}`} className="h-12 rounded border border-zinc-700 object-cover" />}
        {end && (
          <>
            <ArrowRightLeft className="w-3 h-3 text-[#dbb56e]" aria-label="Transitions to" />
            <img src={end.thumbUrl} alt={`End: ${end.label || 'photo'}`} className="h-12 rounded border border-zinc-700 object-cover" />
          </>
        )}
        <select
          value={shot.sourcePhotoId}
          onChange={(e) => updateDirectorShot(shot.id, { sourcePhotoId: e.target.value })}
          aria-label="Source photo"
          className="h-7 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 px-1.5"
        >
          {project.photos.map((photo, photoIndex) => (
            <option key={photo.id} value={photo.id}>
              {photo.label || (photo.isDerivedCrop ? `crop ${photoIndex + 1}` : `Photo ${photoIndex + 1}`)}
            </option>
          ))}
        </select>
        {end && <span className="text-[10px] text-zinc-500">transition shot</span>}
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {CAMERA_MOVES.map((move) => (
          <button
            key={move}
            onClick={() => updateDirectorShot(shot.id, { cameraMove: move })}
            title={CAMERA_MOVE_META[move].description}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              shot.cameraMove === move
                ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {CAMERA_MOVE_META[move].label}
          </button>
        ))}
        <span className="mx-1 text-zinc-700">·</span>
        {DURATIONS.map((seconds) => (
          <button
            key={seconds}
            onClick={() => updateDirectorShot(shot.id, { durationSeconds: seconds })}
            title={`${seconds} seconds`}
            className={`w-6 h-6 rounded text-[10px] font-bold ${
              shot.durationSeconds === seconds
                ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {seconds}
          </button>
        ))}
      </div>

      <Textarea
        value={shot.motionCore}
        onChange={(e) => updateDirectorShot(shot.id, { motionCore: e.target.value })}
        aria-label={`Shot ${index + 1} motion description`}
        placeholder="What moves in this shot — light, curtains, reflections…"
        className="min-h-[44px] bg-zinc-900 border-zinc-800 text-[11px] text-zinc-200 placeholder:text-zinc-600 resize-y"
      />

      {project.constraints.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-zinc-500">Emphasize:</span>
          {project.constraints.map((constraint) => {
            const marked = shot.mustPreserveIds.includes(constraint.id)
            return (
              <button
                key={constraint.id}
                onClick={() => updateDirectorShot(shot.id, {
                  mustPreserveIds: marked
                    ? shot.mustPreserveIds.filter((id) => id !== constraint.id)
                    : [...shot.mustPreserveIds, constraint.id],
                })}
                title={marked ? 'Marked must-preserve for this shot' : 'Mark as must-preserve for this shot'}
                className={`px-1.5 py-0.5 rounded text-[9px] ${
                  marked ? 'bg-[#c99850]/20 text-[#dbb56e]' : 'bg-zinc-800 text-zinc-500 hover:text-white'
                }`}
              >
                {constraint.subject}
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setShowPrompt(!showPrompt)}
        className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white"
      >
        {showPrompt ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Full motion prompt this shot will use
      </button>
      {showPrompt && (
        <p className="text-[10px] text-zinc-400 leading-4 bg-zinc-900 rounded-md p-2 border border-zinc-800 whitespace-pre-wrap">
          {promptPreview}
        </p>
      )}
    </div>
  )
}
