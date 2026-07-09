/**
 * Utility to composite a solid background color behind a transparent PNG
 * using the Canvas API. Returns a Blob with the color applied.
 */

export async function compositeBackground(
  imageUrl: string,
  backgroundColor: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Fill with background color first
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw transparent image on top
      ctx.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob'))
        }
      }, 'image/png')
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

/**
 * Creates a data URL from a composited image
 */
export async function compositeBackgroundToDataUrl(
  imageUrl: string,
  backgroundColor: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Fill with background color first
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw transparent image on top
      ctx.drawImage(img, 0, 0)

      resolve(canvas.toDataURL('image/png'))
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}
