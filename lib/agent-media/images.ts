import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { hash, requireMedia, type Asset, type MediaRequest } from './contracts'
import { MediaStore } from './store'

export async function describePng(bytes: Buffer, maxPixels = 8_294_400) {
  requireMedia(bytes.length > 0 && bytes.length <= 8_000_000, 'PNG must be at most 8 MB')
  const image = sharp(bytes, { limitInputPixels: maxPixels, failOn: 'warning' })
  const meta = await image.metadata()
  requireMedia(meta.format === 'png' && meta.width && meta.height && (meta.pages ?? 1) === 1, 'Expected one PNG image')
  await image.stats()
  return { width: meta.width, height: meta.height, byteLength: bytes.length }
}
export async function loadReference(store: MediaStore, request: MediaRequest) {
  if (!request.reference) return undefined
  const asset = store.read<Asset>(`${request.reference.id}.json`)
  requireMedia(asset.owner === store.owner && asset.brand === request.brand && !asset.operationId, 'Reference is not accessible')
  const bytes = readFileSync(store.path(`${request.reference.id}.png`))
  requireMedia(asset.sha256 === request.reference.sha256 && hash(bytes) === asset.sha256, 'Reference bytes changed')
  await describePng(bytes)
  return bytes
}
export async function saveGenerated(store: MediaStore, operationId: string, brand: string, size: string, bytes: Buffer): Promise<Asset> {
  const dimensions = await describePng(bytes)
  requireMedia(`${dimensions.width}x${dimensions.height}` === size, 'Provider image dimensions differ from the quote')
  const asset: Asset = { id: operationId, operationId, owner: store.owner, brand, sha256: hash(bytes), mimeType: 'image/png', ...dimensions }
  if (store.exists(operationId, 'image.png')) requireMedia(hash(readFileSync(store.path(operationId, 'image.png'))) === asset.sha256, 'Stored asset differs; never overwrite it')
  else store.bytes([operationId, 'image.png'], bytes)
  if (!store.exists(operationId, 'asset.json')) store.write('asset.json', asset, operationId)
  return asset
}
