import { start } from 'workflow/api'
import { loadOnlinePolicy, onlinePool } from './online-runtime'
import { onlineGenerationWorkflow } from './online-generation-workflow'

export async function startOnlineGenerationWorkflow(operationId: string) {
  return (await start(onlineGenerationWorkflow, [operationId])).runId
}

export async function dispatchNextOnlineWorkflow() {
  const policy = loadOnlinePolicy(), now = new Date(), leaseUntil = new Date(now.getTime() + 60_000)
  const leased = await onlinePool.query<{ id: string; operation_id: string }>(`
    WITH candidate AS (
      SELECT outbox.id FROM conjure_media.outbox AS outbox
      JOIN conjure_media.operations AS operation ON operation.id = outbox.operation_id
      WHERE operation.operator_id = $1 AND outbox.available_at <= $2
        AND (outbox.state = 'pending' OR (outbox.state = 'leased' AND outbox.lease_until <= $2))
      ORDER BY outbox.available_at, outbox.created_at, outbox.id
      FOR UPDATE OF outbox SKIP LOCKED LIMIT 1
    )
    UPDATE conjure_media.outbox AS outbox SET state = 'leased', lease_until = $3, updated_at = $2
    FROM candidate WHERE outbox.id = candidate.id RETURNING outbox.id, outbox.operation_id
  `, [policy.operatorId, now, leaseUntil])
  const event = leased.rows[0]
  if (!event) return null
  try {
    const workflowRunId = await startOnlineGenerationWorkflow(event.operation_id)
    await onlinePool.query(`UPDATE conjure_media.outbox SET state = 'started', workflow_run_id = $2,
      lease_until = NULL, updated_at = now() WHERE id = $1`, [event.id, workflowRunId])
    return { operationId: event.operation_id, workflowRunId }
  } catch (error) {
    await onlinePool.query(`UPDATE conjure_media.outbox SET state = 'pending', lease_until = NULL,
      available_at = now(), updated_at = now() WHERE id = $1`, [event.id])
    throw error
  }
}
