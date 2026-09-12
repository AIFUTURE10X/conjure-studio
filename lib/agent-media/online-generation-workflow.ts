import { runOnlineGenerationStep } from './online-generation-step'

export async function onlineGenerationWorkflow(operationId: string) {
  'use workflow'

  return runOnlineGenerationStep(operationId)
}
