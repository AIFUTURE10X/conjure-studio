"use client"

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { buildAnalysisSummary } from './analysis-summary'
import {
  selectDirectorConcept,
  setDirectorConcepts,
  setDirectorStoryboard,
  useDirectorProject,
} from './useDirectorProject'
import {
  llmShotSchema,
  videoConceptSchema,
  type DirectorBrief,
  type StoryboardShot,
  type VideoConcept,
} from '@/lib/video/photo-director-schema'

const conceptsResponse = z.object({ concepts: z.array(videoConceptSchema) })
const shotsResponse = z.object({ shots: z.array(llmShotSchema) })

async function postPlan(body: unknown): Promise<unknown> {
  const response = await fetch('/api/plan-photo-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error((data as { error?: string }).error || `Planning failed (${response.status})`)
  return data
}

/** Concepts + storyboard planning calls (text-only — photos never re-sent). */
export function useDirectorPlanning() {
  const project = useDirectorProject()
  const [isPlanningConcepts, setIsPlanningConcepts] = useState(false)
  const [isPlanningStoryboard, setIsPlanningStoryboard] = useState(false)

  const planConcepts = useCallback(async (brief: DirectorBrief): Promise<boolean> => {
    if (!project?.analysis) return false
    setIsPlanningConcepts(true)
    try {
      const data = await postPlan({
        stage: 'concepts',
        analysisSummary: buildAnalysisSummary(project),
        continuity: project.analysis.continuity,
        brief,
      })
      setDirectorConcepts(conceptsResponse.parse(data).concepts)
      return true
    } catch (error) {
      console.error('[photo-director] Concepts failed:', error)
      toast.error(error instanceof Error ? error.message : 'Could not build concepts')
      return false
    } finally {
      setIsPlanningConcepts(false)
    }
  }, [project])

  const planStoryboard = useCallback(async (concept: VideoConcept): Promise<boolean> => {
    if (!project?.analysis || !project.brief) return false
    setIsPlanningStoryboard(true)
    try {
      const data = await postPlan({
        stage: 'storyboard',
        analysisSummary: buildAnalysisSummary(project),
        brief: project.brief,
        concept,
        photoCatalog: project.photos.map((photo, index) => ({
          index,
          label: photo.label || (photo.isDerivedCrop ? 'close-up crop' : `photo ${index + 1}`),
          isDerivedCrop: photo.isDerivedCrop,
        })),
        constraintSubjects: project.constraints.map((constraint) => constraint.subject),
      })
      const { shots } = shotsResponse.parse(data)
      const fresh: StoryboardShot[] = shots.map((shot, index) => ({
        id: `shot-${Date.now().toString(36)}-${index}`,
        order: index,
        title: shot.title,
        sourcePhotoId: project.photos[shot.sourcePhotoIndex]?.id ?? project.photos[0].id,
        endPhotoId: typeof shot.endPhotoIndex === 'number' ? project.photos[shot.endPhotoIndex]?.id ?? null : null,
        cameraMove: shot.cameraMove,
        motionCore: shot.motionCore,
        durationSeconds: shot.durationSeconds,
        mood: shot.mood,
        mustPreserveIds: [],
        locked: false,
      }))
      // A rewrite keeps locked shots at their positions; fresh shots fill the rest.
      const existing = [...project.storyboard].sort((a, b) => a.order - b.order)
      const queue = [...fresh]
      const merged: StoryboardShot[] = []
      const slots = Math.max(existing.length, queue.length)
      for (let index = 0; index < slots; index++) {
        const locked = existing.find((shot) => shot.order === index && shot.locked)
        if (locked) merged.push(locked)
        else if (queue.length > 0) merged.push(queue.shift() as StoryboardShot)
      }
      merged.push(...queue)
      selectDirectorConcept(concept.id)
      setDirectorStoryboard(merged.map((shot, order) => ({ ...shot, order })))
      return true
    } catch (error) {
      console.error('[photo-director] Storyboard failed:', error)
      toast.error(error instanceof Error ? error.message : 'Could not build the storyboard')
      return false
    } finally {
      setIsPlanningStoryboard(false)
    }
  }, [project])

  return { planConcepts, planStoryboard, isPlanningConcepts, isPlanningStoryboard }
}
