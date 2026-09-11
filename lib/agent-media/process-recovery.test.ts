import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type MediaConfig, hash } from './contracts'
import { MediaService } from './service'

test('killed submitter retains exposure; operator CLI refuses a live lock and recovers without repurchase', async t => {
  const root = mkdtempSync(join(tmpdir(), 'conjure-process-recovery-'))
  const checkout = fileURLToPath(new URL('../..', import.meta.url))
  const configPath = join(root, 'config.json')
  const now = Date.now()
  const config: MediaConfig = { owner: 'process-fixture', brands: ['sample'], dataRoot: join(root, 'store'), allowPaid: true,
    dailyLimitMicros: 300000, totalLimitMicros: 300000, policyExpiresAt: new Date(now + 86400000).toISOString(),
    pricing: { currency: 'USD', source: 'https://example.com/synthetic-only', reviewedBy: 'Fixture', checkedAt: new Date(now - 60000).toISOString(),
      expiresAt: new Date(now + 86400000).toISOString(), reserves: { low: 50000, medium: 100000, high: 200000 }, referenceExtraMicros: 0 } }
  writeFileSync(configPath, JSON.stringify(config))
  let unexpectedCalls = 0
  const service = new MediaService(() => config, { async generate() { unexpectedCalls++; throw new Error('Unexpected purchase attempt') } })
  const quote = await service.quote({ brand: 'sample', prompt: 'Synthetic process recovery', model: 'gpt-image-2', aspectRatio: '1:1', quality: 'medium' })
  await service.approve(quote.id, hash(quote), 'Synthetic operator')
  const args = { quoteId: quote.id, inputHash: quote.inputHash, idempotencyKey: 'killed-submit' }
  const id = service.store.operationId(args.idempotencyKey)
  const worker = `
    import { MediaService } from ${JSON.stringify(new URL('./service.ts', import.meta.url).href)};
    globalThis.fetch = async () => { throw Error('Network disabled'); };
    const service = new MediaService(() => (${JSON.stringify(config)}), { async generate() {
      setInterval(() => {}, 1000);
      process.stdout.write('provider-entered\\n');
      return await new Promise(() => {});
    }});
    await service.generate(${JSON.stringify(args)});
  `
  const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', worker], { cwd: checkout, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stderr.resume()
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) { const exited = once(child, 'exit'); child.kill('SIGKILL'); await exited }
    rmSync(root, { recursive: true, force: true, maxRetries: 3 })
  })
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Synthetic provider did not start')), 15000)
    child.once('error', error => { clearTimeout(timer); reject(error) })
    child.once('exit', () => { clearTimeout(timer); reject(new Error('Worker exited before submission')) })
    child.stdout.on('data', chunk => { if (chunk.toString().includes('provider-entered')) { clearTimeout(timer); resolve() } })
  })
  const lockPath = join(config.dataRoot, 'writer.lock')
  const lockBytes = readFileSync(lockPath)
  const lock = JSON.parse(lockBytes.toString()) as { pid: number; token: string; host: string }
  assert.equal(lock.pid, child.pid)
  assert.ok(existsSync(join(config.dataRoot, id, 'submitted.json')))
  const operator = (command: string, ...values: string[]) => spawnSync(process.execPath,
    ['--import', 'tsx', 'scripts/conjure-mcp.ts', command, configPath, ...values], { cwd: checkout, encoding: 'utf8', timeout: 15000 })
  assert.equal(operator('unlock', lock.token).status, 1, 'A live writer must not be unlocked')
  assert.deepEqual(readFileSync(lockPath), lockBytes)
  await assert.rejects(service.generate(args), /locked/)

  const exited = once(child, 'exit')
  assert.equal(child.kill('SIGKILL'), true)
  await exited
  assert.deepEqual(readFileSync(lockPath), lockBytes, 'A killed process leaves the durable lock intact')
  assert.equal(operator('unlock', 'wrong-token').status, 1)
  writeFileSync(lockPath, JSON.stringify({ ...lock, host: 'different-fixture-host' }))
  assert.equal(operator('unlock', lock.token).status, 1)
  writeFileSync(lockPath, lockBytes)
  // Simulate the dead writer's PID being reassigned to this unrelated live process.
  writeFileSync(lockPath, JSON.stringify({ ...lock, pid: process.pid, birth: 'previous-process-incarnation' }))
  assert.equal(operator('unlock', lock.token).status, 0, 'PID reuse must not strand a dead writer lock')
  writeFileSync(lockPath, lockBytes)
  assert.equal(operator('unlock', lock.token).status, 0)
  assert.equal(existsSync(lockPath), false)

  config.allowPaid = false
  writeFileSync(configPath, JSON.stringify(config))
  const recovered = await service.generate(args)
  assert.equal(recovered.state, 'needs_reconciliation')
  assert.equal(recovered.operationId, id)
  assert.equal(recovered.reservedMicros, 100000)
  assert.equal(recovered.actualCostMicros, null)
  assert.equal(unexpectedCalls, 0)
  assert.equal(service.budget().totalMicros, 100000)

  const evidence = join(root, 'synthetic-invoice.txt')
  writeFileSync(evidence, 'Synthetic fixture only; no real provider charge')
  assert.equal(operator('record-cost', id, '150000', evidence, 'x'.repeat(101)).status, 1, 'Cost reviewer must use the same bound as quote approval')
  assert.equal(operator('record-cost', id, '150000', evidence, 'Synthetic operator').status, 0)
  const costBytes = readFileSync(join(config.dataRoot, id, 'cost.json'))
  assert.equal(operator('record-cost', id, '1', evidence, 'Synthetic operator').status, 1)
  assert.deepEqual(readFileSync(join(config.dataRoot, id, 'cost.json')), costBytes)
  assert.equal(service.budget().totalMicros, 150000)
  assert.equal((await service.operation(id)).state, 'needs_reconciliation')
  assert.equal(unexpectedCalls, 0)
  assert.equal(existsSync(lockPath), false)
})
