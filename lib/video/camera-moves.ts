import type { VideoModelId } from './providers'

/**
 * Typed camera vocabulary for the Photo Director. Motion is always picked from
 * this enum — never free text — so every generated clip opens with a tested,
 * model-tuned camera instruction instead of "make this cinematic".
 */

export const CAMERA_MOVES = ['push-in', 'pull-back', 'lateral-drift', 'tilt-reveal', 'static-ambient'] as const

export type CameraMove = (typeof CAMERA_MOVES)[number]

export interface CameraMoveMeta {
  label: string
  description: string
  /** How likely this move is to distort real-property geometry. */
  fidelityRisk: 'low' | 'medium' | 'high'
}

export const CAMERA_MOVE_META: Record<CameraMove, CameraMoveMeta> = {
  'push-in': {
    label: 'Slow push-in',
    description: 'Camera glides forward toward a focal point — draws the eye deeper into the room.',
    fidelityRisk: 'medium',
  },
  'pull-back': {
    label: 'Slow pull-back',
    description: 'Camera retreats to reveal more of the space — good for closing establishing shots.',
    fidelityRisk: 'medium',
  },
  'lateral-drift': {
    label: 'Lateral drift',
    description: 'Camera slides gently sideways — adds life without changing what is visible.',
    fidelityRisk: 'low',
  },
  'tilt-reveal': {
    label: 'Tilt reveal',
    description: 'Camera tilts slowly to reveal a feature above or below the opening framing.',
    fidelityRisk: 'medium',
  },
  'static-ambient': {
    label: 'Static + ambient motion',
    description: 'Camera holds still; only light, curtains, and reflections move. The safest option.',
    fidelityRisk: 'low',
  },
}

/** When a reviewer asks to "reduce movement", swap the move for a calmer one. */
export const CALMER_MOVE: Record<CameraMove, CameraMove> = {
  'push-in': 'static-ambient',
  'pull-back': 'static-ambient',
  'lateral-drift': 'static-ambient',
  'tilt-reveal': 'lateral-drift',
  'static-ambient': 'static-ambient',
}

const DEFAULT_FRAGMENTS: Record<CameraMove, string> = {
  'push-in':
    'Very slow, steady cinematic camera push-in toward the focal point, constant speed, no cuts, no rotation.',
  'pull-back':
    'Very slow, steady cinematic camera pull-back revealing more of the space, constant speed, no cuts, no rotation.',
  'lateral-drift':
    'Gentle lateral camera drift to one side, level horizon, constant slow speed, no cuts, no rotation.',
  'tilt-reveal':
    'Slow, smooth camera tilt revealing the scene, fixed position, constant speed, no cuts, no roll.',
  'static-ambient':
    'Locked-off static camera, completely still framing; only ambient elements move within the scene.',
}

const KLING_FRAGMENTS: Record<CameraMove, string> = {
  'push-in': 'Slow cinematic dolly-in toward the focal point, smooth and continuous, no cuts, no rotation.',
  'pull-back': 'Slow cinematic dolly-out revealing the wider space, smooth and continuous, no cuts, no rotation.',
  'lateral-drift': 'Slow cinematic truck movement to one side, level horizon, smooth and continuous, no cuts.',
  'tilt-reveal': 'Slow cinematic tilt from a fixed position revealing the scene, smooth and continuous, no cuts.',
  'static-ambient': 'Static locked tripod shot, no camera movement at all; only ambient scene elements move.',
}

const VEO_FRAGMENTS: Record<CameraMove, string> = {
  'push-in': 'The camera pushes in very slowly toward the focal point in one continuous smooth move, no cuts, no rotation.',
  'pull-back': 'The camera pulls back very slowly to reveal the wider space in one continuous smooth move, no cuts, no rotation.',
  'lateral-drift': 'The camera drifts slowly sideways with a level horizon in one continuous smooth move, no cuts.',
  'tilt-reveal': 'The camera tilts slowly from a fixed position to reveal the scene in one continuous smooth move, no cuts.',
  'static-ambient': 'The camera is completely static on a tripod; only ambient elements within the scene move.',
}

export const CAMERA_MOVE_FRAGMENTS: Record<VideoModelId, Record<CameraMove, string>> = {
  'seedance-fast': DEFAULT_FRAGMENTS,
  'seedance-2': DEFAULT_FRAGMENTS,
  'seedance-2.5': DEFAULT_FRAGMENTS,
  'kling-3': KLING_FRAGMENTS,
  'veo-3.1': VEO_FRAGMENTS,
}

/** Model-tuned prompt fragment for a camera move; unknown models fall back to the default set. */
export function cameraFragment(model: string, move: CameraMove): string {
  const fragments = CAMERA_MOVE_FRAGMENTS[model as VideoModelId] ?? DEFAULT_FRAGMENTS
  return fragments[move]
}
