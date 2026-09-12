import test from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { composeProductProof } from './online-generation'

test('product-proof composition is deterministic and keeps supplied screenshot pixels in the layout path', async () => {
  const background = await sharp({ create: { width: 1024, height: 1280, channels: 4, background: '#204060' } }).png().toBuffer()
  const screenshot = await sharp({ create: { width: 640, height: 360, channels: 4, background: '#ff3300' } }).png().toBuffer()
  const copy = { headline: 'Exact product proof', body: 'The supplied screen remains a deterministic layer.', cta: 'See the guide' }
  const first = await composeProductProof(background, screenshot, copy)
  const repeated = await composeProductProof(background, screenshot, copy)
  assert.deepEqual(repeated, first)
  const metadata = await sharp(first).metadata()
  assert.equal(metadata.width, 1024)
  assert.equal(metadata.height, 1280)
  const changedScreenshot = await sharp({ create: { width: 640, height: 360, channels: 4, background: '#00aa55' } }).png().toBuffer()
  assert.notDeepEqual(await composeProductProof(background, changedScreenshot, copy), first)
})
