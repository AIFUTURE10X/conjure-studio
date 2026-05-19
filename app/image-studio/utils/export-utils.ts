/**
 * Export Utilities - DO NOT MODIFY WITHOUT READING EXPORT_FIX_REFERENCE.md
 *
 * These utilities handle the critical pattern of converting URLs to proper formats
 * for downloading and API calls. The patterns here fix issues where Vercel Blob URLs
 * (https://xxx.blob.vercel-storage.com/...) don't work directly with browser downloads
 * or APIs expecting base64 data.
 *
 * @see EXPORT_FIX_REFERENCE.md for full documentation
 * @see EXPORT_FIX_REFERENCE.json for structured reference
 */

/**
 * Fetches an image URL and converts it to a base64 data URL.
 *
 * USE THIS when you need to send an image to an API that expects base64.
 * This handles both data URLs (passes through) and remote URLs (fetches and converts).
 *
 * @example
 * // Before calling vectorize or upscale API:
 * const imageBase64 = await urlToBase64(generatedLogo.url)
 * formData.append('imageBase64', imageBase64)
 */
export async function urlToBase64(url: string): Promise<string> {
  // If already a data URL, return as-is
  if (url.startsWith('data:')) {
    return url
  }

  // Fetch remote URL and convert to base64
  const response = await fetch(url)
  const blob = await response.blob()

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to convert image to base64'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Downloads an image from a URL as a file.
 *
 * USE THIS instead of directly setting link.href = url.
 * Direct URL assignment causes Vercel Blob URLs to open in a new tab instead of downloading.
 *
 * @example
 * // Download a logo:
 * await downloadImageAsFile(logo.url, `logo-${Date.now()}.png`)
 */
export async function downloadImageAsFile(url: string, filename: string): Promise<void> {
  // Fetch the image and create a blob URL for proper download
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image for download: ${response.status}`)
  }

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Let the browser start the download before revoking the object URL.
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
}

/**
 * Generates a sanitized filename from a prompt string.
 *
 * @example
 * const filename = generateLogoFilename('My Cool Logo!', 'png')
 * // Returns: "logo-my-cool-logo-1702345678901.png"
 */
export function generateLogoFilename(prompt: string, extension: 'png' | 'svg' | 'pdf'): string {
  const sanitizedPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 30)

  return `logo-${sanitizedPrompt}-${Date.now()}.${extension}`
}

/**
 * Downloads a logo with proper filename generation.
 * Combines downloadImageAsFile with generateLogoFilename for convenience.
 *
 * @example
 * await downloadLogo(generatedLogo.url, generatedLogo.prompt)
 */
export async function downloadLogo(url: string, prompt: string): Promise<void> {
  const filename = generateLogoFilename(prompt, 'png')
  await downloadImageAsFile(url, filename)
}
