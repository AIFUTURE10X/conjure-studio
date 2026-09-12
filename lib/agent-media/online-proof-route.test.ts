import test from 'node:test'
import assert from 'node:assert/strict'
import { POST } from '../../app/api/agent-media/v1/proof/route'

test('M0 proof route stays disabled and authenticated before workflow start', async t => {
  const previousEnabled = process.env.AGENT_MEDIA_M0_FAKE_GENERATION
  const previousToken = process.env.AGENT_MEDIA_PROOF_TOKEN
  t.after(() => {
    if (previousEnabled === undefined) delete process.env.AGENT_MEDIA_M0_FAKE_GENERATION
    else process.env.AGENT_MEDIA_M0_FAKE_GENERATION = previousEnabled
    if (previousToken === undefined) delete process.env.AGENT_MEDIA_PROOF_TOKEN
    else process.env.AGENT_MEDIA_PROOF_TOKEN = previousToken
  })

  delete process.env.AGENT_MEDIA_M0_FAKE_GENERATION
  delete process.env.AGENT_MEDIA_PROOF_TOKEN
  const disabled = await POST(new Request('https://example.com/api/agent-media/v1/proof', { method: 'POST' }))
  assert.equal(disabled.status, 404)

  process.env.AGENT_MEDIA_M0_FAKE_GENERATION = '1'
  process.env.AGENT_MEDIA_PROOF_TOKEN = 'synthetic-proof-token'
  const unauthorized = await POST(new Request('https://example.com/api/agent-media/v1/proof', {
    method: 'POST',
    headers: { authorization: 'Bearer wrong-token' },
    body: JSON.stringify({ operationId: 'proof-one' }),
  }))
  assert.equal(unauthorized.status, 401)

  const tooLarge = await POST(new Request('https://example.com/api/agent-media/v1/proof', {
    method: 'POST',
    headers: { authorization: 'Bearer synthetic-proof-token' },
    body: JSON.stringify({ operationId: 'proof-one', padding: 'x'.repeat(4096) }),
  }))
  assert.equal(tooLarge.status, 413)
})
