import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('online workflow imports only a minimal step whose heavy implementation loads inside the step', () => {
  const workflow = readFileSync(new URL('./online-generation-workflow.ts', import.meta.url), 'utf8')
  const step = readFileSync(new URL('./online-generation-step.ts', import.meta.url), 'utf8')
  const implementation = readFileSync(new URL('./online-generation.ts', import.meta.url), 'utf8')
  assert.match(workflow, /from '\.\/online-generation-step'/)
  assert.doesNotMatch(workflow, /from '\.\/online-generation'/)
  assert.match(step, /'use step'/)
  assert.match(step, /await import\('\.\/online-generation'\)/)
  assert.doesNotMatch(step, /from ['"](?:sharp|node:|pg)/)
  assert.doesNotMatch(implementation, /'use step'/)
})
