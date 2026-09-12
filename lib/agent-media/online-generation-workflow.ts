import { processOnlineGeneration } from './online-generation'

export async function onlineGenerationWorkflow(operationId: string) {
  'use workflow'

  return processOnlineGeneration(operationId)
}
