import { start } from 'workflow/api'

async function fakeGenerationStep(operationId: string) {
  'use step'

  if (process.env.AGENT_MEDIA_M0_FAKE_GENERATION !== '1') {
    return { operationId, state: 'disabled' as const }
  }

  return { operationId, state: 'fake_ready' as const, assetId: `fake-${operationId}` }
}

export async function fakeGenerationWorkflow(operationId: string) {
  'use workflow'

  return fakeGenerationStep(operationId)
}

export async function startFakeGenerationWorkflow(operationId: string) {
  const run = await start(fakeGenerationWorkflow, [operationId])
  return run.runId
}
