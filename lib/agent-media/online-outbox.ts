export type OnlineOperationState = 'queued' | 'generating' | 'ready' | 'needs_reconciliation'

export interface AcceptedOnlineOperation {
  operationId: string
  requestDigest: string
  state: OnlineOperationState
}

export interface LeasedOutboxEvent {
  id: string
  operationId: string
}

export interface OnlineOperationStore {
  acceptOperation(input: { operationId: string; requestDigest: string }): Promise<AcceptedOnlineOperation>
  leaseOutbox(now: Date, leaseMs: number): Promise<LeasedOutboxEvent | null>
  recordWorkflowStart(eventId: string, workflowRunId: string): Promise<void>
  releaseOutbox(eventId: string, now: Date): Promise<void>
  claimProviderDispatch(operationId: string, now: Date): Promise<'claimed' | 'already_dispatched' | 'terminal'>
  completeProviderDispatch(operationId: string, assetId: string, now: Date): Promise<void>
  markNeedsReconciliation(operationId: string, now: Date): Promise<void>
  reconcileStaleDispatch(operationId: string, now: Date, staleAfterMs: number): Promise<boolean>
}

export interface FakeProviderResult {
  assetId: string
}

export type GenerationProvider = (operationId: string) => Promise<FakeProviderResult>
export type WorkflowStarter = (operationId: string) => Promise<string>

export async function dispatchNextOutbox(
  store: OnlineOperationStore,
  startWorkflow: WorkflowStarter,
  now = new Date(),
  leaseMs = 60_000,
) {
  const event = await store.leaseOutbox(now, leaseMs)
  if (!event) return null

  try {
    const workflowRunId = await startWorkflow(event.operationId)
    await store.recordWorkflowStart(event.id, workflowRunId)
    return { operationId: event.operationId, workflowRunId }
  } catch (error) {
    await store.releaseOutbox(event.id, now)
    throw error
  }
}

export async function executeGenerationOperation(
  store: OnlineOperationStore,
  provider: GenerationProvider,
  operationId: string,
  now = new Date(),
) {
  const claim = await store.claimProviderDispatch(operationId, now)
  if (claim !== 'claimed') return { operationId, state: claim }

  try {
    const result = await provider(operationId)
    await store.completeProviderDispatch(operationId, result.assetId, now)
    return { operationId, state: 'ready' as const, assetId: result.assetId }
  } catch {
    await store.markNeedsReconciliation(operationId, now)
    return { operationId, state: 'needs_reconciliation' as const }
  }
}

export async function reconcileGenerationTimeout(
  store: OnlineOperationStore,
  operationId: string,
  now = new Date(),
  staleAfterMs = 300_000,
) {
  return store.reconcileStaleDispatch(operationId, now, staleAfterMs)
}
