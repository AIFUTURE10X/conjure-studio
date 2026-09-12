import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { dispatchNextOutbox, executeGenerationOperation, reconcileGenerationTimeout } from './online-outbox'
import { PostgresOnlineOperationStore } from './online-postgres-store'

const connectionString = process.env.POPCORN_TEST_DATABASE_URL

test('Postgres outbox atomically survives concurrent workers and ambiguous delivery', {
  skip: connectionString ? false : 'POPCORN_TEST_DATABASE_URL is required for the Neon integration',
}, async t => {
  const pool = new Pool({ connectionString, max: 8 })
  const owner = `test-${randomUUID()}`
  const first = new PostgresOnlineOperationStore(pool, owner)
  const second = new PostgresOnlineOperationStore(pool, owner)
  const operationId = randomUUID(), requestDigest = 'a'.repeat(64)
  t.after(async () => {
    await pool.query('DELETE FROM conjure_media.operations WHERE owner_id = $1', [owner])
    await pool.end()
  })

  await Promise.all(Array.from({ length: 12 }, () => first.acceptOperation({ operationId, requestDigest })))
  const counts = await pool.query(`
    SELECT
      (SELECT count(*)::int FROM conjure_media.operations WHERE owner_id = $1) AS operations,
      (SELECT count(*)::int FROM conjure_media.outbox AS outbox
        JOIN conjure_media.operations AS operation ON operation.id = outbox.operation_id
        WHERE operation.owner_id = $1) AS outbox
  `, [owner])
  assert.deepEqual(counts.rows[0], { operations: 1, outbox: 1 })

  let receiptFails = true, workflowStarts = 0
  const flakyStore = new Proxy(first, { get(target, property, receiver) {
    if (property === 'recordWorkflowStart') return async (...args: [string, string]) => {
      if (receiptFails) { receiptFails = false; throw new Error('lost workflow receipt') }
      return target.recordWorkflowStart(...args)
    }
    const value = Reflect.get(target, property, receiver)
    return typeof value === 'function' ? value.bind(target) : value
  } })
  const startWorkflow = async () => `run-${++workflowStarts}`
  await assert.rejects(dispatchNextOutbox(flakyStore, startWorkflow), /lost workflow receipt/)
  await dispatchNextOutbox(second, startWorkflow)
  assert.equal(workflowStarts, 2, 'a lost receipt may start two harmless workflow runs')

  let providerCalls = 0
  const provider = async () => {
    providerCalls += 1
    await new Promise(resolve => setTimeout(resolve, 25))
    return { assetId: `asset-${operationId}` }
  }
  await Promise.all([
    executeGenerationOperation(first, provider, operationId),
    executeGenerationOperation(second, provider, operationId),
  ])
  assert.equal(providerCalls, 1)
  assert.equal((await first.readOperation(operationId)).state, 'ready')

  const ambiguousId = randomUUID(), startedAt = new Date('2026-09-12T10:00:00.000Z')
  await first.acceptOperation({ operationId: ambiguousId, requestDigest: 'b'.repeat(64) })
  assert.equal(await first.claimProviderDispatch(ambiguousId, startedAt), 'claimed')
  let replacementCalls = 0
  const duplicate = await executeGenerationOperation(second, async () => {
    replacementCalls += 1
    return { assetId: 'must-not-exist' }
  }, ambiguousId, new Date('2026-09-12T10:01:00.000Z'))
  assert.equal(duplicate.state, 'already_dispatched')
  assert.equal(replacementCalls, 0)
  assert.equal(await reconcileGenerationTimeout(second, ambiguousId,
    new Date('2026-09-12T10:06:00.000Z')), true)
  assert.equal((await second.readOperation(ambiguousId)).state, 'needs_reconciliation')
})
