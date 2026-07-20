export const ANNOTATION_REFERENCE_INSTRUCTION =
  'Use the annotated reference image as an edit guide. The visible annotations are deliberate user instructions, not random marks. Make the next image visibly follow them. Render drawn text labels exactly when they read like desired visible text. Use boxes, arrows, and freehand marks to guide placement, cropping, emphasis, additions, removals, or changes unless the prompt explicitly asks to keep those marks as graphics.'

export const ANNOTATION_REFERENCE_PROMPT_NOTE =
  'Use the annotated reference image as an edit guide.'

export interface AnnotationReferenceImage {
  file: File
  preview: string
  mode: 'inspire'
  source: 'annotation'
  instruction?: string
  maskFile?: File
  annotatedPreview?: string
}

export function isAnnotationReference(value: unknown): value is AnnotationReferenceImage {
  return Boolean(value && typeof value === 'object' && (value as { source?: unknown }).source === 'annotation')
}

export async function dataUrlToImageFile(dataUrl: string, filename: string): Promise<File> {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const mimeType = blob.type || dataUrl.match(/^data:([^;,]+)/)?.[1] || 'image/png'
  return new File([blob], filename, { type: mimeType })
}

export async function imageUrlToImageFile(url: string, filename: string): Promise<File> {
  const response = await fetch(url)
  const blob = await response.blob()
  const mimeType = blob.type || url.match(/^data:([^;,]+)/)?.[1] || 'image/png'
  return new File([blob], filename, { type: mimeType })
}

export function getAnnotationReferenceInstruction(value: unknown): string | null {
  if (!isAnnotationReference(value)) return null
  const details = value.instruction?.trim()
  return details ? `${ANNOTATION_REFERENCE_INSTRUCTION} ${details}` : ANNOTATION_REFERENCE_INSTRUCTION
}
