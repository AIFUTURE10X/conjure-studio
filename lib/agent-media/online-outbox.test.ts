import test from 'node:test'
import assert from 'node:assert/strict'
import {
  dispatchNextOutbox,
  executeGenerationOperation,
  reconcileGenerationTimeout,
  type AcceptedOnlineOperation,
  type LeasedOutboxEvent,
  type OnlineOperationState,
  type OnlineOperationStore,
} from './online-outbox'

interface StoredOperation extends AcceptedOnlineOperation {
  submittedAt: Date | null
  assetId: string | null
}

interface StoredOutbox extends LeasedOutboxEvent {
  state: 'pending' | 'leased' | 'started'
  leaseUntil: Date | null
  workflowRunId: string | null
}

class MemoryProofStore implements OnlineOperationStore {
  operations = new Map<string, StoredOperation>()
  outbox = new Map<string, StoredOutbox>()
  failWorkflowReceiptOnce = false

  async acceptOperation(input: { operationId: string; requestDigest: string }) {
    const existing = this.operations.get(input.operationId)
    if (existing) {
      assert.equal(existing.requestDigest, input.requestDigest, 'idempotency key cannot change its approved request')
      return existing
    }
    const operation: StoredOperation = { ...input, state: 'queued', submittedAt: null, assetId: null }
    this.operations.set(input.operationId, operation)
    this.outbox.set(`outbox-${input.operationId}`, {
      id: `outbox-${input.operationId}`,
      operationId: input.operationId,
      state: 'pending',
      leaseUntil: null,
      workflowRunId: null,
    })
    return operation
  }

  async leaseOutbox(now: Date, leaseMs: number) {
    const event = [...this.outbox.values()].find(candidate =>
      candidate.state === 'pending' || (candidate.state === 'leased' && candidate.leaseUntil !== null && candidate.leaseUntil <= now),
    )
    if (!event) return null
    event.state = 'leased'
    event.leaseUntil = new Date(now.getTime() + leaseMs)
    return { id: event.id, operationId: event.operationId }
  }

  async recordWorkflowStart(eventId: string, workflowRunId: string) {
    if (this.failWorkflowReceiptOnce) {
      this.failWorkflowReceiptOnce = false
      throw new Error('synthetic database failure after workflow start')
    }
    const event = this.requiredEvent(eventId)
    event.state = 'started'
    event.workflowRunId = workflowRunId
  }

  async releaseOutbox(eventId: string, now: Date) {
    const event = this.requiredEvent(eventId)
    event.state = 'leased'
    event.leaseUntil = now
  }

  async claimProviderDispatch(operationId: string, now: Date) {
    const operation = this.requiredOperation(operationId)
    if (operation.state === 'ready' || operation.state === 'needs_reconciliation') return 'terminal' as const
    if (operation.submittedAt) return 'already_dispatched' as const
    operation.state = 'generating'
    operation.submittedAt = now
    return 'claimed' as const
  }

  async completeProviderDispatch(operationId: string, assetId: string) {
    const operation = this.requiredOperation(operationId)
    operation.state = 'ready'
    operation.assetId = assetId
  }

  async markNeedsReconciliation(operationId: string) {
    this.requiredOperation(operationId).state = 'needs_reconciliation'
  }

  async reconcileStaleDispatch(operationId: string, now: Date, staleAfterMs: number) {
    const operation = this.requiredOperation(operationId)
    if (operation.state !== 'generating' || !operation.submittedAt) return false
    if (now.getTime() - operation.submittedAt.getTime() < staleAfterMs) return false
    operation.state = 'needs_reconciliation'
    return true
  }

  state(operationId: string): OnlineOperationState {
    return this.requiredOperation(operationId).state
  }

  private requiredOperation(operationId: string) {
    const operation = this.operations.get(operationId)
    assert.ok(operation)
    return operation
  }

  private requiredEvent(eventId: string) {
    const event = this.outbox.get(eventId)
    assert.ok(event)
    return event
  }
}

test('acceptance transaction records one operation and one outbox event', async () => {
  const store = new MemoryProofStore()
  await store.acceptOperation({ operationId: 'operation-one', requestDigest: 'digest-one' })
  await store.acceptOperation({ operationId: 'operation-one', requestDigest: 'digest-one' })

  assert.equal(store.operations.size, 1)
  assert.equal(store.outbox.size, 1)
  await assert.rejects(
    store.acceptOperation({ operationId: 'operation-one', requestDigest: 'changed-digest' }),
    /cannot change/,
  )
})

test('dispatcher recovers acceptance before workflow start', async () => {
  const store = new MemoryProofStore()
  await store.acceptOperation({ operationId: 'operation-two', requestDigest: 'digest-two' })
  let starts = 0

  const result = await dispatchNextOutbox(store, async operationId => {
    starts += 1
    return `run-${operationId}`
  })

  assert.deepEqual(result, { operationId: 'operation-two', workflowRunId: 'run-operation-two' })
  assert.equal(starts, 1)
})

test('duplicate workflow starts still permit at most one provider dispatch', async () => {
  const store = new MemoryProofStore()
  await store.acceptOperation({ operationId: 'operation-three', requestDigest: 'digest-three' })
  store.failWorkflowReceiptOnce = true
  const workflowRuns: string[] = []
  const startWorkflow = async () => {
    const runId = `run-${workflowRuns.length + 1}`
    workflowRuns.push(runId)
    return runId
  }

  await assert.rejects(dispatchNextOutbox(store, startWorkflow), /database failure/)
  await dispatchNextOutbox(store, startWorkflow)
  assert.equal(workflowRuns.length, 2, 'ambiguous start may create two harmless workflow runs')

  let providerCalls = 0
  const provider = async () => {
    providerCalls += 1
    return { assetId: 'asset-three' }
  }
  const results = await Promise.all([
    executeGenerationOperation(store, provider, 'operation-three'),
    executeGenerationOperation(store, provider, 'operation-three'),
  ])

  assert.equal(providerCalls, 1)
  assert.equal(store.state('operation-three'), 'ready')
  assert.ok(results.some(result => result.state === 'ready'))
})

test('crash after the dispatch marker never repurchases and becomes reconciliation work', async () => {
  const store = new MemoryProofStore()
  await store.acceptOperation({ operationId: 'operation-four', requestDigest: 'digest-four' })
  const startedAt = new Date('2026-09-12T06:00:00.000Z')
  assert.equal(await store.claimProviderDispatch('operation-four', startedAt), 'claimed')

  let providerCalls = 0
  const result = await executeGenerationOperation(store, async () => {
    providerCalls += 1
    return { assetId: 'must-not-exist' }
  }, 'operation-four', new Date('2026-09-12T06:01:00.000Z'))

  assert.equal(result.state, 'already_dispatched')
  assert.equal(providerCalls, 0)
  assert.equal(await reconcileGenerationTimeout(store, 'operation-four', new Date('2026-09-12T06:06:00.000Z')), true)
  assert.equal(store.state('operation-four'), 'needs_reconciliation')
})
