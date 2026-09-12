import type { Pool, PoolClient } from 'pg'
import type { AcceptedOnlineOperation, LeasedOutboxEvent, OnlineOperationStore } from './online-outbox'

interface OperationRow {
  id: string
  request_digest: string
  state: AcceptedOnlineOperation['state']
  submitted_at: Date | null
  asset_id: string | null
}

export class PostgresOnlineOperationStore implements OnlineOperationStore {
  constructor(readonly pool: Pool, readonly ownerId: string, readonly operatorId = ownerId) {}

  async acceptOperation(input: { operationId: string; requestDigest: string }) {
    return this.transaction(async client => {
      const inserted = await client.query<OperationRow>(`
        INSERT INTO conjure_media.operations (id, operator_id, owner_id, request_digest, state)
        VALUES ($1, $2, $3, $4, 'queued')
        ON CONFLICT (id) DO NOTHING
        RETURNING id, request_digest, state, submitted_at, asset_id
      `, [input.operationId, this.operatorId, this.ownerId, input.requestDigest])
      const operation = inserted.rows[0] ?? (await client.query<OperationRow>(`
        SELECT id, request_digest, state, submitted_at, asset_id
        FROM conjure_media.operations
        WHERE id = $1 AND owner_id = $2
        FOR UPDATE
      `, [input.operationId, this.ownerId])).rows[0]
      if (!operation || operation.request_digest !== input.requestDigest) {
        throw new Error('Idempotency key cannot change its approved request')
      }
      await client.query(`
        INSERT INTO conjure_media.outbox (id, operation_id, state)
        VALUES ($1, $2, 'pending')
        ON CONFLICT (operation_id) DO NOTHING
      `, [`outbox-${input.operationId}`, input.operationId])
      return this.publicOperation(operation)
    })
  }

  async leaseOutbox(now: Date, leaseMs: number): Promise<LeasedOutboxEvent | null> {
    const leaseUntil = new Date(now.getTime() + leaseMs)
    const result = await this.pool.query<{ id: string; operation_id: string }>(`
      WITH candidate AS (
        SELECT outbox.id
        FROM conjure_media.outbox AS outbox
        JOIN conjure_media.operations AS operation ON operation.id = outbox.operation_id
        WHERE operation.owner_id = $1
          AND outbox.available_at <= $2
          AND (outbox.state = 'pending' OR (outbox.state = 'leased' AND outbox.lease_until <= $2))
        ORDER BY outbox.available_at, outbox.created_at, outbox.id
        FOR UPDATE OF outbox SKIP LOCKED
        LIMIT 1
      )
      UPDATE conjure_media.outbox AS outbox
      SET state = 'leased', lease_until = $3, updated_at = $2
      FROM candidate
      WHERE outbox.id = candidate.id
      RETURNING outbox.id, outbox.operation_id
    `, [this.ownerId, now, leaseUntil])
    const event = result.rows[0]
    return event ? { id: event.id, operationId: event.operation_id } : null
  }

  async recordWorkflowStart(eventId: string, workflowRunId: string) {
    const result = await this.pool.query(`
      UPDATE conjure_media.outbox AS outbox
      SET state = 'started', workflow_run_id = $3, lease_until = NULL, updated_at = now()
      FROM conjure_media.operations AS operation
      WHERE outbox.id = $1 AND outbox.operation_id = operation.id
        AND operation.owner_id = $2 AND outbox.state = 'leased'
    `, [eventId, this.ownerId, workflowRunId])
    if (result.rowCount !== 1) throw new Error('Outbox lease is missing or no longer owned')
  }

  async releaseOutbox(eventId: string, now: Date) {
    await this.pool.query(`
      UPDATE conjure_media.outbox AS outbox
      SET state = 'pending', available_at = $3, lease_until = NULL, updated_at = $3
      FROM conjure_media.operations AS operation
      WHERE outbox.id = $1 AND outbox.operation_id = operation.id
        AND operation.owner_id = $2 AND outbox.state = 'leased'
    `, [eventId, this.ownerId, now])
  }

  async claimProviderDispatch(operationId: string, now: Date) {
    const claimed = await this.pool.query(`
      UPDATE conjure_media.operations
      SET state = 'generating', submitted_at = $3, updated_at = $3
      WHERE id = $1 AND owner_id = $2 AND state = 'queued' AND submitted_at IS NULL
      RETURNING id
    `, [operationId, this.ownerId, now])
    if (claimed.rowCount === 1) return 'claimed' as const
    let operation = await this.readOperation(operationId)
    if (operation.state === 'generating' && operation.submitted_at) {
      const asset = await this.pool.query<{ id: string }>(`
        SELECT id FROM conjure_media.assets WHERE operation_id = $1 AND owner_id = $2
      `, [operationId, this.ownerId])
      if (asset.rows[0]) {
        await this.pool.query(`
          UPDATE conjure_media.operations SET state = 'ready', asset_id = $3, updated_at = $4
          WHERE id = $1 AND owner_id = $2 AND state = 'generating'
        `, [operationId, this.ownerId, asset.rows[0].id, now])
        operation = await this.readOperation(operationId)
      }
    }
    if (operation.state === 'ready' || operation.state === 'needs_reconciliation') return 'terminal' as const
    return 'already_dispatched' as const
  }

  async completeProviderDispatch(operationId: string, assetId: string, now: Date) {
    const completed = await this.pool.query(`
      UPDATE conjure_media.operations
      SET state = 'ready', asset_id = $3, updated_at = $4
      WHERE id = $1 AND owner_id = $2 AND state = 'generating' AND submitted_at IS NOT NULL
    `, [operationId, this.ownerId, assetId, now])
    if (completed.rowCount === 1) return
    const operation = await this.readOperation(operationId)
    if (operation.state !== 'ready' || operation.asset_id !== assetId) {
      throw new Error('Operation cannot accept this provider result')
    }
  }

  async markNeedsReconciliation(operationId: string, now: Date) {
    const result = await this.pool.query(`
      UPDATE conjure_media.operations
      SET state = 'needs_reconciliation', updated_at = $3
      WHERE id = $1 AND owner_id = $2 AND state = 'generating' AND submitted_at IS NOT NULL
    `, [operationId, this.ownerId, now])
    if (result.rowCount !== 1) {
      const operation = await this.readOperation(operationId)
      if (operation.state !== 'needs_reconciliation') throw new Error('Operation is not an ambiguous dispatch')
    }
  }

  async reconcileStaleDispatch(operationId: string, now: Date, staleAfterMs: number) {
    const cutoff = new Date(now.getTime() - staleAfterMs)
    const result = await this.pool.query(`
      UPDATE conjure_media.operations
      SET state = 'needs_reconciliation', updated_at = $3
      WHERE id = $1 AND owner_id = $2 AND state = 'generating'
        AND submitted_at IS NOT NULL AND submitted_at <= $4
    `, [operationId, this.ownerId, now, cutoff])
    return result.rowCount === 1
  }

  async readOperation(operationId: string) {
    const result = await this.pool.query<OperationRow>(`
      SELECT id, request_digest, state, submitted_at, asset_id
      FROM conjure_media.operations
      WHERE id = $1 AND owner_id = $2
    `, [operationId, this.ownerId])
    const operation = result.rows[0]
    if (!operation) throw new Error('Operation is not accessible')
    return operation
  }

  private publicOperation(operation: OperationRow): AcceptedOnlineOperation {
    return { operationId: operation.id, requestDigest: operation.request_digest, state: operation.state }
  }

  private async transaction<T>(work: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await work(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}
