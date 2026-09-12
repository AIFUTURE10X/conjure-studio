import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import sharp from 'sharp'
import { jsPDF } from 'jspdf'

test('PDF exports retain PNG pixels and both app page formats without external access', async () => {
  const png = await sharp({ create: { width: 16, height: 12, channels: 4, background: '#ee7722' } }).png().toBuffer()
  const dataUrl = `data:image/png;base64,${png.toString('base64')}`
  for (const doc of [new jsPDF('p', 'mm', 'a4'), new jsPDF('portrait', 'px', [800, 1000])]) {
    doc.addImage(dataUrl, 'PNG', 10, 10, 100, 75)
    assert.equal(doc.getNumberOfPages(), 1)
    const bytes = Buffer.from(doc.output('arraybuffer'))
    assert.match(bytes.toString('latin1'), /^%PDF-/)
    assert.match(bytes.toString('latin1'), /\/Subtype \/Image/)
    assert.match(bytes.toString('latin1'), /\/Width 16\b/)
    assert.match(bytes.toString('latin1'), /\/Height 12\b/)
    assert.match(bytes.toString('latin1'), /%%EOF\s*$/)
  }
})

test('native background-removal dependency decodes, applies a mask and encodes actual PNGs offline', async t => {
  const require = createRequire(import.meta.url)
  const nativeRequire = createRequire(require.resolve('@imgly/background-removal-node'))
  assert.equal(nativeRequire.resolve('sharp'), require.resolve('sharp'), 'Native dependency must share the patched Sharp before loading its binary')
  assert.equal(sharp.versions.sharp, '0.35.4')
  const { applySegmentationMask } = await import('@imgly/background-removal-node')
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('Network forbidden in dependency fixture') }
  t.after(() => { globalThis.fetch = originalFetch })
  const input = await sharp({ create: { width: 2, height: 1, channels: 4, background: '#ff4400' } }).png().toBuffer()
  const mask = await sharp(Buffer.from([0, 0, 0, 255, 255, 255, 255, 255]), { raw: { width: 2, height: 1, channels: 4 } }).png().toBuffer()
  const imageBlob = new Blob([new Uint8Array(input)], { type: 'image/png' })
  const maskBlob = new Blob([new Uint8Array(mask)], { type: 'image/png' })
  const result = await applySegmentationMask(imageBlob, maskBlob, { output: { format: 'image/png', quality: 0.9 } })
  assert.equal(result.type, 'image/png')
  const resultBytes = Buffer.from(await result.arrayBuffer())
  const decoded = await sharp(resultBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  assert.equal(decoded.info.width, 2)
  assert.equal(decoded.info.height, 1)
  assert.deepEqual([decoded.data[3], decoded.data[7]], [0, 255])
  // PNG quantization may change invisible RGB under alpha zero. Compare the
  // rendered pixels on black, retaining the opaque source color exactly.
  const visible = await sharp(resultBytes).flatten({ background: '#000000' }).raw().toBuffer()
  assert.deepEqual([...visible], [0, 0, 0, 255, 68, 0])
  await assert.rejects(applySegmentationMask(imageBlob, maskBlob, { output: { format: 'image/png', quality: 2 } }))
})
