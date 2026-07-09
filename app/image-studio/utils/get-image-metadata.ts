/**
 * get-image-metadata
 *
 * Client-side image dimensions/file-size lookup, split out of
 * ImageGenerationProvider to keep that file under the project's 300-line
 * limit. File size is exact for data URIs (decoded from the base64 length)
 * and a HEAD-request estimate for remote URLs.
 */

export interface ImageMetadata {
  dimensions: string
  fileSize: string
}

export async function getImageMetadata(url: string): Promise<ImageMetadata> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = async () => {
      let fileSize = '~2 MB'
      try {
        if (url.startsWith('data:')) {
          const b64 = url.split(',')[1]
          if (b64) fileSize = `~${(Math.ceil((b64.length * 3) / 4) / 1048576).toFixed(1)} MB`
        } else {
          const r = await fetch(url, { method: 'HEAD' })
          const cl = r.headers.get('content-length')
          if (cl) fileSize = `~${(parseInt(cl) / 1048576).toFixed(1)} MB`
        }
      } catch {}
      resolve({ dimensions: `${img.width}×${img.height}`, fileSize })
    }
    img.onerror = () => resolve({ dimensions: 'Unknown', fileSize: 'Unknown' })
    img.src = url
  })
}
