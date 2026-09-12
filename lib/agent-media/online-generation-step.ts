export async function runOnlineGenerationStep(operationId: string) {
  'use step'

  const { processOnlineGeneration } = await import('./online-generation')
  return processOnlineGeneration(operationId)
}
