import { timingSafeEqual } from 'node:crypto'
import { safeId } from '@/lib/agent-media/contracts'
import { startFakeGenerationWorkflow } from '@/lib/agent-media/online-workflow'

export const maxDuration = 30

const authorized = (request: Request) => {
  const expected = process.env.AGENT_MEDIA_PROOF_TOKEN?.trim()
  const header = request.headers.get('authorization')
  const supplied = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  if (!expected || expected.length !== supplied.length) return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
}

export async function POST(request: Request) {
  if (process.env.AGENT_MEDIA_M0_FAKE_GENERATION !== '1') {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  if (!authorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const text = await request.text()
  if (Buffer.byteLength(text) > 4096) {
    return Response.json({ error: 'Request too large' }, { status: 413 })
  }
  let input: unknown
  try {
    input = JSON.parse(text)
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = safeId.safeParse((input as { operationId?: unknown })?.operationId)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid operation ID' }, { status: 400 })
  }

  const workflowRunId = await startFakeGenerationWorkflow(parsed.data)
  return Response.json({ operationId: parsed.data, workflowRunId, state: 'queued' }, { status: 202 })
}
