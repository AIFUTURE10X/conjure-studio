/**
 * AI-based Background Removal
 *
 * Uses @imgly/background-removal-node for high-quality ML-based removal.
 * Extracted to keep other methods file under 300 lines.
 */

/**
 * AI-based background removal using @imgly/background-removal-node
 * Higher quality but slower (2-5s first run, <1s after model cached)
 * Note: First run downloads ~50MB ML model
 */
export async function removeBackgroundAI(imageBase64: string): Promise<string> {
  try {
    console.log('[Background Removal AI] Starting AI-based removal...')
    console.log('[Background Removal AI] Note: First run downloads ML model (~50MB)')

    // Dynamic import to avoid loading the large model unless needed
    const { removeBackground: imglyRemove } = await import('@imgly/background-removal-node')

    console.log('[Background Removal AI] Module loaded successfully')

    const inputBuffer = Buffer.from(imageBase64, 'base64')
    const blob = new Blob([inputBuffer], { type: 'image/png' })

    console.log('[Background Removal AI] Running model...')

    const resultBlob = await imglyRemove(blob, {
      model: 'medium',
      output: { format: 'image/png', quality: 0.9 }
    })

    const arrayBuffer = await resultBlob.arrayBuffer()
    const outputBase64 = Buffer.from(arrayBuffer).toString('base64')

    console.log('[Background Removal AI] Completed successfully')
    return outputBase64
  } catch (error: any) {
    console.error('[Background Removal AI] Error:', error?.message || error)
    throw new Error(`AI background removal failed: ${error?.message || 'Unknown error'}. Try using "Fast" or "Auto" method instead.`)
  }
}
