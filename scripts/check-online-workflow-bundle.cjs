const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const routePath = path.join(root, '.next', 'server', 'app', '.well-known', 'workflow', 'v1', 'flow', 'route.js')
if (!fs.existsSync(routePath)) throw new Error('Workflow flow bundle is missing; run next build first')
const route = fs.readFileSync(routePath, 'utf8')
const chunks = [...route.matchAll(/R\.c\("([^"]+)"\)/g)].map(match => path.join(root, '.next', match[1]))
if (!chunks.length) throw new Error('Workflow flow route did not reference any compiled chunks')
const applicationChunks = chunks.map(file => ({ file, source: fs.readFileSync(file, 'utf8') }))
  .filter(chunk => chunk.source.includes('lib/agent-media/online-generation-workflow.ts'))
if (!applicationChunks.length) throw new Error('Compiled online generation workflow chunk is missing')
const source = applicationChunks.map(chunk => chunk.source).join('\n')
for (const [label, pattern] of [
  ['Sharp', /node_modules[\\/]sharp|sharp\/dist\/constructor/],
  ['online generation implementation', /lib\/agent-media\/online-generation\.ts/],
  ['Node util require', /require\(["']node:util["']\)/],
]) {
  if (pattern.test(source)) throw new Error(`${label} leaked into the workflow flow bundle`)
}
if (!source.includes('WORKFLOW_USE_STEP')) throw new Error('Online generation workflow did not compile to a step proxy')
console.log(`Online workflow flow bundle is sandbox-safe (${applicationChunks.length} application chunk checked).`)
