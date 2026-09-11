import { readFileSync } from 'node:fs'
import { hostname } from 'node:os'
import { resolve } from 'node:path'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { configSchema, hash, requireMedia, sha256 } from '../lib/agent-media/contracts'
import { MediaService } from '../lib/agent-media/service'
import { conjureImageProvider } from '../lib/agent-media/provider'
import { createMediaServer } from '../lib/agent-media/mcp-server'
import { processBirth } from '../lib/agent-media/process-identity'
import { durableRemove } from '../lib/agent-media/durable-files'

async function main() {
  const [command, configPath, ...args] = process.argv.slice(2)
  requireMedia(configPath && ['serve', 'inspect-quote', 'approve', 'revoke', 'record-cost', 'unlock'].includes(command),
    'Usage: node --import tsx scripts/conjure-mcp.ts serve|inspect-quote|approve|revoke|record-cost|unlock <config.json> [arguments]')
  const loadConfig = () => configSchema.parse(JSON.parse(readFileSync(resolve(configPath), 'utf8')))
  const service = new MediaService(loadConfig, conjureImageProvider)
  if (command === 'serve') {
    requireMedia(args.length === 0, 'Unexpected arguments')
    await createMediaServer(service).connect(new StdioServerTransport())
    return
  }
  let result: unknown
  if (command === 'inspect-quote') {
    requireMedia(args.length === 1, 'Expected quote ID')
    const quote = service.readQuote(args[0]); result = { quote, approvalDigest: hash(quote), budget: service.budget() }
  } else if (command === 'approve') {
    requireMedia(args.length === 3, 'Expected quote ID, exact digest and reviewer')
    result = await service.approve(args[0], args[1], args[2])
  } else if (command === 'revoke') {
    requireMedia(args.length === 1, 'Expected quote ID'); sha256.parse(args[0])
    result = await service.store.lock(async () => { service.store.write(`revoked-${args[0]}.json`, { at: new Date().toISOString() }); return { revoked: args[0] } })
  } else if (command === 'record-cost') {
    requireMedia(args.length === 4, 'Expected operation ID, actual USD micros, evidence file and reviewer')
    const [id, amount, evidenceFile, reviewer] = args; sha256.parse(id)
    const actualMicros = Number(amount)
    requireMedia(Number.isSafeInteger(actualMicros) && actualMicros >= 0 && actualMicros <= 1_000_000_000 && reviewer.trim(), 'Invalid cost/reviewer')
    await service.operation(id)
    const source = readFileSync(resolve(evidenceFile)); requireMedia(source.length > 0 && source.length <= 5_000_000, 'Invalid evidence file')
    result = await service.store.lock(async () => {
      service.store.write('cost.json', { actualMicros, evidenceDigest: hash(source), reviewer, at: new Date().toISOString() }, id)
      return service.budget()
    })
  } else {
    requireMedia(args.length === 1, 'Expected the inspected stale lock token')
    const lock = service.store.read<{ token: string; pid: number; host: string; birth?: string }>('writer.lock')
    requireMedia(lock.token === args[0] && lock.host === hostname(), 'Lock token/host mismatch')
    const currentBirth = processBirth(lock.pid)
    requireMedia(currentBirth === null || (typeof lock.birth === 'string' && lock.birth.length > 0 && currentBirth !== lock.birth),
      'Writer process is still present or legacy identity is unknown; do not unlock')
    const current = service.store.read<{ token: string }>('writer.lock')
    requireMedia(current.token === lock.token, 'Lock changed during inspection')
    durableRemove(service.store.path('writer.lock')); result = { unlocked: true }
  }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
}
main().catch(() => { process.stderr.write('Conjure MCP stopped. Check command, private configuration and operator state. No credentials or provider response are printed.\n'); process.exitCode = 1 })
