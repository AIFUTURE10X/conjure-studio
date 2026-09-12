/**
 * The units a fal video job bills on, derived from what the submit route stored
 * on its `video_history` row (issue #50). Shared by the status poller and the
 * cancel route so both finalize the pending ledger row the same way.
 */

import { operationForFalEndpoint, type Operation, type ProviderUsageUnits } from './provider-rates'

export interface FalVideoRow {
  fal_endpoint: string
  duration_seconds: number | null
  resolution: string | null
  has_audio: boolean
}

export function falUnitsForVideoRow(row: FalVideoRow): ProviderUsageUnits {
  const operation = operationForFalEndpoint(row.fal_endpoint)
  const seconds = row.duration_seconds ?? undefined
  if (operation === 'lipsync') return { input_seconds: seconds }
  if (operation === 'compose') return { compute_seconds: seconds }
  return { seconds, resolution: row.resolution ?? undefined, audio: row.has_audio }
}

export function falIdentityForVideoRow(row: FalVideoRow): { provider: 'fal'; model: string; operation: Operation } {
  return { provider: 'fal', model: row.fal_endpoint, operation: operationForFalEndpoint(row.fal_endpoint) }
}
