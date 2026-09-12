// Test-only entrypoint. It cannot reach a paid provider, even if keys are inherited.
import { readFileSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { configSchema } from '../../lib/agent-media/contracts'
import { MediaService } from '../../lib/agent-media/service'
import { createMediaServer } from '../../lib/agent-media/mcp-server'

async function main() {
  globalThis.fetch = async () => { throw new Error('Network disabled in MCP fixture') }
  const config = configSchema.parse(JSON.parse(readFileSync(process.argv[2], 'utf8')))
  const service = new MediaService(() => config, { async generate(_request, size) {
    appendFileSync(join(config.dataRoot, 'synthetic-calls.txt'), 'fixture\n')
    const [width, height] = size.split('x').map(Number)
    return sharp({ create: { width, height, channels: 4, background: '#e7eff6' } }).png().toBuffer()
  } })
  await createMediaServer(service).connect(new StdioServerTransport())
}
main().catch(() => { process.stderr.write('Synthetic MCP fixture failed\n'); process.exitCode = 1 })
