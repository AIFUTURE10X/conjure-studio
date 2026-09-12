import { start } from 'workflow/api'
import type { Pool } from 'pg'
import { loadOnlinePolicy, onlinePool } from './online-runtime'
import { onlineGenerationWorkflow } from './online-generation-workflow'

export async function reconcileStaleOnlineOperations(
  pool: Pool,
  operatorId: string,
  now = new Date(),
  staleAfterMs = 300_000,
  limit = 20,
) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new Error('Reconciliation limit is invalid')
  const cutoff = new Date(now.getTime() - staleAfterMs), client = await pool.connect()
  try {
    await client.query('BEGIN')
    const candidates = await client.query<{ id: string }>(`
      SELECT id FROM conjure_media.operations
      WHERE operator_id = $1 AND state = 'generating' AND submitted_at IS NOT NULL AND submitted_at <= $2
      ORDER BY submitted_at, id FOR UPDATE SKIP LOCKED LIMIT $3
    `, [operatorId, cutoff, limit])
    const ids = candidates.rows.map(row => row.id)
    if (!ids.length) {
      await client.query('COMMIT')
      return { recovered: 0, needsReconciliation: 0 }
    }
    const recovered = await client.query(`
      UPDATE conjure_media.operations AS operation
      SET state = 'ready', asset_id = asset.id, updated_at = $2
      FROM conjure_media.assets AS asset
      WHERE operation.id = ANY($1::text[]) AND operation.state = 'generating'
        AND asset.operation_id = operation.id AND asset.owner_id = operation.owner_id
    `, [ids, now])
    const ambiguous = await client.query(`
      UPDATE conjure_media.operations AS operation
      SET state = 'needs_reconciliation', updated_at = $2
      WHERE operation.id = ANY($1::text[]) AND operation.state = 'generating'
        AND NOT EXISTS (SELECT 1 FROM conjure_media.assets AS asset
          WHERE asset.operation_id = operation.id AND asset.owner_id = operation.owner_id)
    `, [ids, now])
    await client.query('COMMIT')
    return { recovered: recovered.rowCount ?? 0, needsReconciliation: ambiguous.rowCount ?? 0 }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

export async function startOnlineGenerationWorkflow(operationId: string) {
  return (await start(onlineGenerationWorkflow, [operationId])).runId
}

export async function dispatchNextOnlineWorkflow() {
  const policy = loadOnlinePolicy(), now = new Date(), leaseUntil = new Date(now.getTime() + 60_000)
  await reconcileStaleOnlineOperations(onlinePool, policy.operatorId, now)
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
