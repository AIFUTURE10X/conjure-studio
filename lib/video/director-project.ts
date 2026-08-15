import type { DirectorProject, DirectorStep, MultiPhotoAnalysis } from './photo-director-schema'

/**
 * Pure helpers over a DirectorProject. Navigation between steps is driven by
 * what the project actually HOLDS, not by how far the user has walked: every
 * step whose data exists stays reachable in both directions, so stepping back
 * to the photos never strands the analysis (or anything downstream of it).
 */

export const DIRECTOR_STEP_SEQUENCE: DirectorStep[] = [
  'upload', 'analysis', 'brief', 'concepts', 'storyboard', 'preflight', 'generate', 'done',
]

/** True when this step has the data it needs to render something real. */
export function isDirectorStepReachable(project: DirectorProject, step: DirectorStep): boolean {
  // Never strand the user on a step they can't navigate away from.
  if (step === project.step) return true
  switch (step) {
    case 'upload':
      return true
    case 'analysis':
    case 'brief':
      return project.analysis !== null
    case 'concepts':
      return project.concepts !== null
    case 'storyboard':
      return project.storyboard.length > 0
    case 'preflight':
      return project.storyboard.length > 0 && project.brief !== null
    case 'generate':
      return Object.keys(project.shotJobs).length > 0
    case 'done':
      return project.assembledJobId !== null
  }
}

export function reachableDirectorSteps(project: DirectorProject): DirectorStep[] {
  return DIRECTOR_STEP_SEQUENCE.filter((step) => isDirectorStepReachable(project, step))
}

/**
 * Rewrite the analysis's photo-index references after a reorder.
 * `mapping[oldIndex] = newIndex`. Reordering photos changes what "Photo 1"
 * means but not what the AI saw, so the analysis is remapped rather than
 * thrown away.
 */
export function remapAnalysisPhotoIndices(
  analysis: MultiPhotoAnalysis,
  mapping: number[],
): MultiPhotoAnalysis {
  const remap = (index: number) => (mapping[index] === undefined ? index : mapping[index])
  const remapObservations = <T extends { photoIndices: number[] }>(items: T[]): T[] =>
    items.map((item) => ({
      ...item,
      photoIndices: [...new Set(item.photoIndices.map(remap))].sort((a, b) => a - b),
    }))

  return {
    ...analysis,
    observed: remapObservations(analysis.observed),
    inferred: remapObservations(analysis.inferred),
    bestOpeningPhotoIndex: remap(analysis.bestOpeningPhotoIndex),
    bestClosingPhotoIndex: remap(analysis.bestClosingPhotoIndex),
  }
}
