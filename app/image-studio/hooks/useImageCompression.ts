"use client"

const MAX_SIZE = 4 * 1024 * 1024 // 4MB
const MAX_DIMENSION = 2048

export async function compressImageIfNeeded(blob: Blob): Promise<Blob> {
  if (blob.size <= MAX_SIZE) return blob

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = (height / width) * MAX_DIMENSION
          width = MAX_DIMENSION
        } else {
          width = (width / height) * MAX_DIMENSION
          height = MAX_DIMENSION
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (compressed) => resolve(compressed || blob),
        'image/jpeg',
        0.85
      )
    }
    img.src = URL.createObjectURL(blob)
  })
}

export async function analyzeUploadedImage(
  imageUrl: string,
  index: number,
  type: 'style' | 'logo' = 'style'
): Promise<{ index: number; analysis: string; error?: boolean; type?: string } | null> {
  try {
    const response = await fetch(imageUrl)
    const originalBlob = await response.blob()
    const blob = await compressImageIfNeeded(originalBlob)
    const filename = type === 'logo' ? `logo-reference-${index + 1}.jpg` : `reference-image-${index + 1}.jpg`
    const file = new File([blob], filename, { type: blob.type })

    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', type)
    formData.append('mode', 'quality')

    const analysisResponse = await fetch('/api/analyze-image', {
      method: 'POST',
      body: formData
    })

    if (analysisResponse.ok) {
      const data = await analysisResponse.json()
      if (data.analysis) {
        return { index: index + 1, analysis: data.analysis, type, error: false }
      }
    }
  } catch (error) {
    console.error(`[v0] Image ${index + 1} analysis failed:`, error)
  }
  return null
}
