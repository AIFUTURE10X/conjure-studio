import sharp from 'sharp'

interface SharpUpscaleOptions {
  sharpen?: boolean
}

export async function upscaleBase64WithSharp(
  imageBase64: string,
  targetSize: number,
  options: SharpUpscaleOptions = {}
): Promise<string> {
  const base64Data = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64
  const imageBuffer = Buffer.from(base64Data, 'base64')
  const metadata = await sharp(imageBuffer).metadata()
  const originalWidth = metadata.width || 1024
  const originalHeight = metadata.height || 1024
  const maxOriginalDim = Math.max(originalWidth, originalHeight)

  if (maxOriginalDim >= targetSize) {
    return base64Data
  }

  const scale = targetSize / maxOriginalDim
  const newWidth = Math.round(originalWidth * scale)
  const newHeight = Math.round(originalHeight * scale)
  let pipeline = sharp(imageBuffer).resize(newWidth, newHeight, {
    kernel: 'lanczos3',
    fit: 'fill',
  })

  if (options.sharpen) {
    pipeline = pipeline.sharpen({ sigma: 1.0 })
  }

  const upscaledBuffer = await pipeline
    .png({ quality: 100 })
    .toBuffer()

  return upscaledBuffer.toString('base64')
}
