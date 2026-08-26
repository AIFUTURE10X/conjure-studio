import sharp from 'sharp'

const OPAQUE_ALPHA_THRESHOLD = 240

/**
 * Keep the remover's alpha matte while restoring source RGB in solid logo
 * regions. Semi-transparent edge pixels keep the provider's decontaminated RGB
 * so cutouts do not gain a light fringe from the original background.
 */
export async function preserveOpaqueSourceColors(
  originalBase64: string,
  processedBase64: string,
): Promise<string> {
  const processed = sharp(Buffer.from(processedBase64, 'base64')).ensureAlpha()
  const metadata = await processed.metadata()
  const width = metadata.width
  const height = metadata.height

  if (!width || !height) return processedBase64

  const [sourcePixels, processedPixels] = await Promise.all([
    sharp(Buffer.from(originalBase64, 'base64'))
      .resize(width, height, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer(),
    processed.raw().toBuffer(),
  ])
  const output = Buffer.from(processedPixels)

  for (let index = 0; index < output.length; index += 4) {
    if (output[index + 3] < OPAQUE_ALPHA_THRESHOLD) continue
    output[index] = sourcePixels[index]
    output[index + 1] = sourcePixels[index + 1]
    output[index + 2] = sourcePixels[index + 2]
  }

  const png = await sharp(output, {
    raw: { width, height, channels: 4 },
  }).png().toBuffer()

  return png.toString('base64')
}
