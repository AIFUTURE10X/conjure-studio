"use client"

import { remapAnalysisPhotoIndices } from '@/lib/video/director-project'
import { updateProject, useDirectorProject, writeProject } from './director-store'
import type {
  ClipReview,
  DirectorBrief,
  DirectorStep,
  MultiPhotoAnalysis,
  PhotoReference,
  PlannedRender,
  PreservationConstraint,
  StoryboardShot,
  VideoConcept,
} from '@/lib/video/photo-director-schema'

/**
 * Photo Director project actions. Store internals (persistence, subscription,
 * the useDirectorProject hook) live in director-store.ts; this module is the
 * vocabulary of things the workflow can do to a project.
 */

export { useDirectorProject }
// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function startDirectorProject() {
  writeProject({
    version: 1,
    id: `dir-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    step: 'upload',
    photos: [],
    analysis: null,
    correctedObservedIds: [],
    confirmedInferredIds: [],
    rejectedInferredIds: [],
    correctionNote: '',
    constraints: [],
    brief: null,
    concepts: null,
    selectedConceptId: null,
    storyboard: [],
    renderOverrides: {},
    shotJobs: {},
    assembledJobId: null,
  })
}

export function clearDirectorProject() {
  writeProject(null)
}

export function setDirectorStep(step: DirectorStep) {
  updateProject((project) => ({ ...project, step }))
}

export function setDirectorPhotos(photos: PhotoReference[]) {
  updateProject((project) => ({ ...project, photos }))
}

/**
 * Append photos without touching the analysis: existing photo indices stay
 * valid, so prior findings survive (the new photo simply isn't analyzed yet).
 */
export function appendDirectorPhotos(photos: PhotoReference[]) {
  updateProject((project) => ({ ...project, photos: [...project.photos, ...photos] }))
}

/**
 * Move a photo. Reordering renames what "Photo 1" means but not what the AI
 * saw, so the analysis is remapped onto the new order instead of discarded.
 */
export function moveDirectorPhoto(fromIndex: number, direction: -1 | 1) {
  updateProject((project) => {
    const toIndex = fromIndex + direction
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= project.photos.length || toIndex >= project.photos.length) {
      return project
    }
    const photos = [...project.photos]
    ;[photos[fromIndex], photos[toIndex]] = [photos[toIndex], photos[fromIndex]]

    const mapping = project.photos.map((_, index) => {
      if (index === fromIndex) return toIndex
      if (index === toIndex) return fromIndex
      return index
    })
    return {
      ...project,
      photos,
      analysis: project.analysis ? remapAnalysisPhotoIndices(project.analysis, mapping) : null,
    }
  })
}

/** Changing photos after analysis invalidates everything downstream. */
export function resetDirectorAnalysis() {
  updateProject((project) => ({
    ...project,
    step: 'upload',
    analysis: null,
    correctedObservedIds: [],
    confirmedInferredIds: [],
    rejectedInferredIds: [],
    correctionNote: '',
    constraints: [],
    concepts: null,
    selectedConceptId: null,
    storyboard: [],
    renderOverrides: {},
    shotJobs: {},
    assembledJobId: null,
  }))
}

export function applyDirectorAnalysis(analysis: MultiPhotoAnalysis) {
  updateProject((project) => ({
    ...project,
    step: 'analysis',
    analysis,
    correctedObservedIds: [],
    confirmedInferredIds: [],
    rejectedInferredIds: [],
    constraints: analysis.preservation,
  }))
}

export function toggleObservedCorrection(id: string) {
  updateProject((project) => ({
    ...project,
    correctedObservedIds: project.correctedObservedIds.includes(id)
      ? project.correctedObservedIds.filter((item) => item !== id)
      : [...project.correctedObservedIds, id],
  }))
}

export function setInferredVerdict(id: string, verdict: 'confirmed' | 'rejected' | 'none') {
  updateProject((project) => ({
    ...project,
    confirmedInferredIds: verdict === 'confirmed'
      ? [...new Set([...project.confirmedInferredIds, id])]
      : project.confirmedInferredIds.filter((item) => item !== id),
    rejectedInferredIds: verdict === 'rejected'
      ? [...new Set([...project.rejectedInferredIds, id])]
      : project.rejectedInferredIds.filter((item) => item !== id),
  }))
}

export function setCorrectionNote(note: string) {
  updateProject((project) => ({ ...project, correctionNote: note }))
}

export function upsertConstraint(constraint: PreservationConstraint) {
  updateProject((project) => {
    const exists = project.constraints.some((item) => item.id === constraint.id)
    return {
      ...project,
      constraints: exists
        ? project.constraints.map((item) => (item.id === constraint.id ? constraint : item))
        : [...project.constraints, constraint],
    }
  })
}

export function removeConstraint(id: string) {
  updateProject((project) => ({
    ...project,
    constraints: project.constraints.filter((item) => item.id !== id),
  }))
}

/**
 * `expectedProjectId` guards late writes: the brief form flushes its text
 * fields when it unmounts, which must not land in a project the user just
 * started fresh.
 */
export function setDirectorBrief(brief: DirectorBrief, expectedProjectId?: string) {
  updateProject((project) => (
    expectedProjectId && project.id !== expectedProjectId ? project : { ...project, brief }
  ))
}

export function setDirectorConcepts(concepts: VideoConcept[]) {
  updateProject((project) => ({ ...project, step: 'concepts', concepts }))
}

export function selectDirectorConcept(conceptId: string) {
  updateProject((project) => ({ ...project, selectedConceptId: conceptId }))
}

export function setDirectorStoryboard(storyboard: StoryboardShot[]) {
  updateProject((project) => ({ ...project, step: 'storyboard', storyboard }))
}

export function updateDirectorShot(shotId: string, patch: Partial<StoryboardShot>) {
  updateProject((project) => ({
    ...project,
    storyboard: project.storyboard.map((shot) => (shot.id === shotId ? { ...shot, ...patch } : shot)),
  }))
}

export function removeDirectorShot(shotId: string) {
  updateProject((project) => ({
    ...project,
    storyboard: project.storyboard
      .filter((shot) => shot.id !== shotId)
      .map((shot, index) => ({ ...shot, order: index })),
  }))
}

export function moveDirectorShot(shotId: string, direction: -1 | 1) {
  updateProject((project) => {
    const shots = [...project.storyboard].sort((a, b) => a.order - b.order)
    const index = shots.findIndex((shot) => shot.id === shotId)
    const target = index + direction
    if (index === -1 || target < 0 || target >= shots.length) return project
    ;[shots[index], shots[target]] = [shots[target], shots[index]]
    return { ...project, storyboard: shots.map((shot, order) => ({ ...shot, order })) }
  })
}

export function setRenderOverride(shotId: string, patch: Partial<PlannedRender>) {
  updateProject((project) => ({
    ...project,
    renderOverrides: {
      ...project.renderOverrides,
      [shotId]: { ...project.renderOverrides[shotId], ...patch },
    },
  }))
}

const EMPTY_REVIEW: ClipReview = { status: 'none', checklist: {} }

export function recordShotJob(shotId: string, jobId: number, phase: 'draft' | 'final') {
  updateProject((project) => {
    const existing = project.shotJobs[shotId] ?? { draftJobIds: [], finalJobIds: [], review: EMPTY_REVIEW }
    return {
      ...project,
      shotJobs: {
        ...project.shotJobs,
        [shotId]: phase === 'draft'
          ? { ...existing, draftJobIds: [...existing.draftJobIds, jobId] }
          : { ...existing, finalJobIds: [...existing.finalJobIds, jobId] },
      },
    }
  })
}

export function setShotReview(shotId: string, review: ClipReview) {
  updateProject((project) => {
    const existing = project.shotJobs[shotId] ?? { draftJobIds: [], finalJobIds: [], review: EMPTY_REVIEW }
    return { ...project, shotJobs: { ...project.shotJobs, [shotId]: { ...existing, review } } }
  })
}

export function setAssembledJob(jobId: number | null) {
  updateProject((project) => ({ ...project, assembledJobId: jobId, step: jobId ? 'done' : project.step }))
}
