import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { generateOpenAIImage } from '../openai-image-client'
import { priceUsage } from '../costs/provider-rates'
import { executeGenerationOperation } from './online-outbox'
import { PostgresOnlineOperationStore } from './online-postgres-store'
import { onlinePool, onlineService } from './online-runtime'

const xml = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
}[character] ?? character))

const lines = (value: string, maximum: number) => {
  const result: string[] = []
  for (const paragraph of value.trim().split(/\s*\n\s*/)) {
    let current = ''
    for (const word of paragraph.split(/\s+/)) {
      if (!current || `${current} ${word}`.length <= maximum) current = current ? `${current} ${word}` : word
      else { result.push(current); current = word }
    }
    if (current) result.push(current)
  }
  return result
}

export async function composeProductProof(background: Buffer, screenshot: Buffer,
  copy: { headline: string; body: string; cta: string }) {
  const metadata = await sharp(background).metadata()
  if (!metadata.width || !metadata.height) throw new Error('Generated background has no dimensions')
  const width = metadata.width, height = metadata.height
  const proofWidth = Math.floor(width * 0.78), proofHeight = Math.floor(height * 0.46)
  const proof = await sharp(screenshot, { limitInputPixels: 40_000_000, failOn: 'warning' })
    .resize({ width: proofWidth, height: proofHeight, fit: 'inside', withoutEnlargement: true }).png().toBuffer()
  const proofMetadata = await sharp(proof).metadata()
  const left = Math.floor((width - (proofMetadata.width ?? proofWidth)) / 2)
  const top = Math.floor(height * 0.48 + (proofHeight - (proofMetadata.height ?? proofHeight)) / 2)
  const headline = lines(copy.headline, Math.max(18, Math.floor(width / 29)))
  const body = lines(copy.body, Math.max(28, Math.floor(width / 18)))
  if (headline.length > 3 || body.length > 7) throw new Error('Exact copy does not fit the product-proof composition')
  const headlineSize = Math.max(30, Math.floor(width / 18)), bodySize = Math.max(18, Math.floor(width / 37))
  const headlineSvg = headline.map((line, index) => `<tspan x="${width * 0.08}" dy="${index ? headlineSize * 1.08 : 0}">${xml(line)}</tspan>`).join('')
  const bodyStart = height * 0.12 + headline.length * headlineSize * 1.12 + bodySize
  const bodySvg = body.map((line, index) => `<tspan x="${width * 0.08}" dy="${index ? bodySize * 1.35 : 0}">${xml(line)}</tspan>`).join('')
  const overlay = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${width * 0.045}" y="${height * 0.045}" width="${width * 0.91}" height="${height * 0.91}" rx="${Math.max(24, width / 30)}" fill="#09100d" fill-opacity="0.82"/>
    <text x="${width * 0.08}" y="${height * 0.12}" fill="#fff7df" font-family="Arial, sans-serif" font-size="${headlineSize}" font-weight="700">${headlineSvg}</text>
    <text x="${width * 0.08}" y="${bodyStart}" fill="#e5e8df" font-family="Arial, sans-serif" font-size="${bodySize}">${bodySvg}</text>
    <rect x="${width * 0.08}" y="${height * 0.405}" width="${width * 0.84}" height="${height * 0.545}" rx="${Math.max(16, width / 45)}" fill="#ffffff"/>
    <rect x="${width * 0.08}" y="${height * 0.91}" width="${Math.min(width * 0.38, copy.cta.length * bodySize * 0.68 + 44)}" height="${bodySize * 2.1}" rx="${bodySize}" fill="#ffc44a"/>
    <text x="${width * 0.1}" y="${height * 0.91 + bodySize * 1.35}" fill="#281500" font-family="Arial, sans-serif" font-size="${bodySize}" font-weight="700">${xml(copy.cta)}</text>
  </svg>`)
  return sharp(background).composite([{ input: overlay }, { input: proof, left, top }]).png().toBuffer()
}

const popcornURL = () => {
  const value = process.env.POPCORN_INTERNAL_URL
  if (!value?.startsWith('https://') && !value?.startsWith('http://127.0.0.1:')) {
    throw new Error('Popcorn internal URL is not configured')
  }
  return value.replace(/\/$/, '')
}

const serviceHeaders = (ownerId?: string) => ({
  authorization: `Bearer ${process.env.POPCORN_AGENT_MEDIA_TOKEN ?? ''}`,
  ...(process.env.POPCORN_VERCEL_PROTECTION_BYPASS
    ? { 'x-vercel-protection-bypass': process.env.POPCORN_VERCEL_PROTECTION_BYPASS } : {}),
  'content-type': 'application/json',
  ...(ownerId ? { 'x-popcorn-owner-id': ownerId } : {}),
})

async function readReference(ownerId: string, fileId: string, expectedSha256: string) {
  const response = await fetch(`${popcornURL()}/api/internal/files/${fileId}`, { headers: serviceHeaders(ownerId) })
  if (!response.ok) throw new Error('Approved reference is unavailable')
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length > 25 * 1024 * 1024 || response.headers.get('x-content-sha256') !== expectedSha256
    || createHash('sha256').update(bytes).digest('hex') !== expectedSha256) {
    throw new Error('Approved reference digest changed')
  }
  return bytes
}

async function deliverToPopcorn(operation: Record<string, unknown>, bytes: Buffer, dimensions: { width: number; height: number }) {
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const request = operation.request as { prompt: string; model: string; aspectRatio: string; quality: string }
  const composition = operation.composition as { mode?: string } | null
  const reserve = await fetch(`${popcornURL()}/api/internal/generated-files/reserve`, {
    method: 'POST', headers: serviceHeaders(), body: JSON.stringify({
      ownerId: operation.owner_id, campaignId: operation.campaign_id, operationId: operation.id,
      parentFileId: operation.reference_file_id ?? undefined,
      name: `${operation.brand}-${String(operation.id).slice(0, 12)}.png`, mimeType: 'image/png',
      byteLength: bytes.length, sha256,
      generation: { quoteId: operation.quote_id, requestDigest: operation.request_digest, model: request.model,
        prompt: request.prompt, aspectRatio: request.aspectRatio, quality: request.quality,
        mode: composition?.mode ?? 'concept', ...dimensions },
    }),
  })
  if (!reserve.ok) throw new Error('Popcorn could not reserve the generated file')
  const reserved = await reserve.json() as { file: { id: string }; uploadUrl: string }
  const uploaded = await fetch(reserved.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: new Uint8Array(bytes) })
  if (!uploaded.ok) throw new Error('Generated file upload failed')
  const blob = await uploaded.json() as { url: string }
  const completed = await fetch(`${popcornURL()}/api/internal/generated-files/complete`, {
    method: 'POST', headers: serviceHeaders(), body: JSON.stringify({ ownerId: operation.owner_id,
      fileId: reserved.file.id, operationId: operation.id, blobUrl: blob.url }),
  })
  if (!completed.ok) throw new Error('Generated file verification failed')
  return { fileId: reserved.file.id, sha256 }
}

async function recordActualCost(operationId: string, request: { quality: string }, usage: unknown, size: string) {
  const priced = priceUsage({ provider: 'openai', model: 'gpt-image-2.5-flare', operation: 'image-generate',
    units: (usage ?? { quality: request.quality, image_size: size, images_out: 1 }) as never }, new Date())
  if (priced.costUsd === null) return
  const actualMicros = Math.ceil(priced.costUsd * 1_000_000)
  const client = await onlinePool.connect()
  try {
    await client.query('BEGIN')
    await client.query('UPDATE conjure_media.operations SET actual_micros = $2, updated_at = now() WHERE id = $1',
      [operationId, actualMicros])
    await client.query('UPDATE conjure_media.costs SET actual_micros = $2, updated_at = now() WHERE operation_id = $1',
      [operationId, actualMicros])
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

export async function processOnlineGeneration(operationId: string) {
  const service = onlineService(), operation = await service.readOperation(operationId)
  const store = new PostgresOnlineOperationStore(onlinePool, operation.owner_id)
  return executeGenerationOperation(store, async () => {
    const request = operation.request as { prompt: string; aspectRatio: '1:1' | '4:5' | '9:16'; quality: 'low' | 'medium' | 'high' }
    const reference = operation.reference_file_id && operation.reference_sha256
      ? await readReference(operation.owner_id, operation.reference_file_id, operation.reference_sha256) : undefined
    const productProof = operation.composition?.mode === 'product-proof'
    const generated = await generateOpenAIImage({ prompt: request.prompt, aspectRatio: request.aspectRatio,
      imageSize: '1K', imageQuality: request.quality, exactSize: undefined, requestTimeoutMs: 240_000,
      referenceImageFile: reference && !productProof ? new File([new Uint8Array(reference)], 'reference.png', { type: 'image/png' }) : undefined })
    const providerBytes = Buffer.from(generated.imageBase64, 'base64')
    const bytes = productProof && reference
      ? await composeProductProof(providerBytes, reference, operation.composition) : providerBytes
    await recordActualCost(operationId, request, generated.usage, generated.size)
    const metadata = await sharp(bytes, { limitInputPixels: 8_294_400, failOn: 'warning' }).metadata()
    if (metadata.format !== 'png' || !metadata.width || !metadata.height) throw new Error('Provider returned invalid PNG')
    const delivered = await deliverToPopcorn(operation, bytes, { width: metadata.width, height: metadata.height })
    const assetId = createHash('sha256').update(`${operationId}:${delivered.sha256}`).digest('hex')
    await onlinePool.query(`
      INSERT INTO conjure_media.assets
        (id, operation_id, owner_id, campaign_id, brand, file_id, sha256, byte_length, width, height, mime_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'image/png')
      ON CONFLICT (operation_id) DO NOTHING
    `, [assetId, operationId, operation.owner_id, operation.campaign_id, operation.brand,
      delivered.fileId, delivered.sha256, bytes.length, metadata.width, metadata.height])
    return { assetId }
  }, operationId)
}
