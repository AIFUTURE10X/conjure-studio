"use client"

import { useSyncExternalStore } from 'react'
import type {
  ClipReview,
  DirectorBrief,
  DirectorProject,
  DirectorStep,
  MultiPhotoAnalysis,
  PhotoReference,
  PlannedRender,
  PreservationConstraint,
  StoryboardShot,
  VideoConcept,
} from '@/lib/video/photo-director-schema'

/**
 * Photo Director project store: module-level, localStorage-backed, observed via
 * useSyncExternalStore (the Concierge-plan pattern). Survives mode switches and
 * refresh without providers or prop threading. Generated clips are NOT stored
 * here — only job ids; live status joins from useVideoGeneration's jobs.
 */

const STORAGE_KEY = 'conjure-director-project'
/** Stay under the ~5MB origin quota shared with presets/concierge keys. */
const MAX_PERSIST_CHARS = 3_500_000

let current: DirectorProject | null | undefined
const listeners = new Set<() => void>()

function read(): DirectorProject | null {
  if (current !== undefined) return current
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as DirectorProject) : null
    current = parsed && parsed.version === 1 ? parsed : null
  } catch {
    current = null
  }
  return current
}

function write(next: DirectorProject | null) {
  current = next
  try {
    if (!next) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      let serialized = JSON.stringify(next)
      if (serialized.length > MAX_PERSIST_CHARS) {
        // Too big for the quota: persist thumbnails only. Full-res stays in
        // `current` for this session; after a reload the upload step offers
        // re-attach for photos whose dataUrl is ''.
        serialized = JSON.stringify({
          ...next,
          photos: next.photos.map((photo) => ({ ...photo, dataUrl: '' })),
        })
      }
      localStorage.setItem(STORAGE_KEY, serialized)
    }
  } catch {
    // Storage unavailable (private mode / quota) — the project still works for the session.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function update(mutate: (project: DirectorProject) => DirectorProject) {
  const project = read()
  if (!project) return
  write(mutate(project))
}

export function useDirectorProject(): DirectorProject | null {
  return useSyncExternalStore(subscribe, read, () => null)
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function startDirectorProject() {
  write({
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
  write(null)
}

export function setDirectorStep(step: DirectorStep) {
  update((project) => ({ ...project, step }))
}

export function setDirectorPhotos(photos: PhotoReference[]) {
  update((project) => ({ ...project, photos }))
}

/** Changing photos after analysis invalidates everything downstream. */
export function resetDirectorAnalysis() {
  update((project) => ({
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
  update((project) => ({
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
  update((project) => ({
    ...project,
    correctedObservedIds: project.correctedObservedIds.includes(id)
      ? project.correctedObservedIds.filter((item) => item !== id)
      : [...project.correctedObservedIds, id],
  }))
}

export function setInferredVerdict(id: string, verdict: 'confirmed' | 'rejected' | 'none') {
  update((project) => ({
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
  update((project) => ({ ...project, correctionNote: note }))
}

export function upsertConstraint(constraint: PreservationConstraint) {
  update((project) => {
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
  update((project) => ({
    ...project,
    constraints: project.constraints.filter((item) => item.id !== id),
  }))
}

export function setDirectorBrief(brief: DirectorBrief) {
  update((project) => ({ ...project, brief }))
}

export function setDirectorConcepts(concepts: VideoConcept[]) {
  update((project) => ({ ...project, step: 'concepts', concepts }))
}

export function selectDirectorConcept(conceptId: string) {
  update((project) => ({ ...project, selectedConceptId: conceptId }))
}

export function setDirectorStoryboard(storyboard: StoryboardShot[]) {
  update((project) => ({ ...project, step: 'storyboard', storyboard }))
}

export function updateDirectorShot(shotId: string, patch: Partial<StoryboardShot>) {
  update((project) => ({
    ...project,
    storyboard: project.storyboard.map((shot) => (shot.id === shotId ? { ...shot, ...patch } : shot)),
  }))
}

export function removeDirectorShot(shotId: string) {
  update((project) => ({
    ...project,
    storyboard: project.storyboard
      .filter((shot) => shot.id !== shotId)
      .map((shot, index) => ({ ...shot, order: index })),
  }))
}

export function moveDirectorShot(shotId: string, direction: -1 | 1) {
  update((project) => {
    const shots = [...project.storyboard].sort((a, b) => a.order - b.order)
    const index = shots.findIndex((shot) => shot.id === shotId)
    const target = index + direction
    if (index === -1 || target < 0 || target >= shots.length) return project
    ;[shots[index], shots[target]] = [shots[target], shots[index]]
    return { ...project, storyboard: shots.map((shot, order) => ({ ...shot, order })) }
  })
}

export function setRenderOverride(shotId: string, patch: Partial<PlannedRender>) {
  update((project) => ({
    ...project,
    renderOverrides: {
      ...project.renderOverrides,
      [shotId]: { ...project.renderOverrides[shotId], ...patch },
    },
  }))
}

const EMPTY_REVIEW: ClipReview = { status: 'none', checklist: {} }

export function recordShotJob(shotId: string, jobId: number, phase: 'draft' | 'final') {
  update((project) => {
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
  update((project) => {
    const existing = project.shotJobs[shotId] ?? { draftJobIds: [], finalJobIds: [], review: EMPTY_REVIEW }
    return { ...project, shotJobs: { ...project.shotJobs, [shotId]: { ...existing, review } } }
  })
}

export function setAssembledJob(jobId: number | null) {
  update((project) => ({ ...project, assembledJobId: jobId, step: jobId ? 'done' : project.step }))
}
