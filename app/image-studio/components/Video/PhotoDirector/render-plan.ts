import { recommendRender } from '@/lib/video/director-assembly'
import type {
  DirectorProject,
  PlannedRender,
  PreservationConstraint,
  RenderPhase,
  StoryboardShot,
} from '@/lib/video/photo-director-schema'

/**
 * Derives the concrete render plan for a shot: the recommendation for the
 * phase, merged with any per-shot user overrides. Drafts are always silent;
 * finals carry audio only when the brief asked for ambient sound.
 */
export function plannedRenderFor(
  project: DirectorProject,
  shot: StoryboardShot,
  phase: RenderPhase,
): PlannedRender {
  const recommendation = recommendRender(shot, phase)
  const override = phase === 'final' ? project.renderOverrides[shot.id] : undefined
  return {
    shotId: shot.id,
    model: override?.model ?? recommendation.model,
    durationSeconds: shot.durationSeconds,
    resolution: override?.resolution ?? recommendation.resolution,
    withAudio: phase === 'final' ? Boolean(project.brief?.toggles.ambient) : false,
  }
}

/**
 * The constraints a shot's prompt is assembled from: every project constraint
 * applies to every shot; marking one "must preserve" on a shot upgrades its
 * severity for that shot only.
 */
export function constraintsForShot(project: DirectorProject, shot: StoryboardShot): PreservationConstraint[] {
  return project.constraints.map((constraint) =>
    shot.mustPreserveIds.includes(constraint.id) && constraint.severity !== 'must'
      ? { ...constraint, severity: 'must' as const }
      : constraint,
  )
}

export function orderedShots(project: DirectorProject): StoryboardShot[] {
  return [...project.storyboard].sort((a, b) => a.order - b.order)
}
