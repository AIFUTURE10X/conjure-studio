import type { DirectorProject } from '@/lib/video/photo-director-schema'

/**
 * Compact text rendering of the CORRECTED analysis for the planning turns.
 * Photos are never re-sent after analysis — the concepts/storyboard calls are
 * text-only (the AI-Helper pattern), so user corrections are baked in here:
 * removed observations disappear, confirmed inferences become facts, rejected
 * ones are omitted, and the owner's note is marked authoritative.
 */
export function buildAnalysisSummary(project: DirectorProject): string {
  const analysis = project.analysis
  if (!analysis) return ''

  const lines: string[] = []

  const photoLine = project.photos
    .map((photo, index) => `${index}: ${photo.label || (photo.isDerivedCrop ? 'close-up crop' : `photo ${index + 1}`)} (${photo.width}x${photo.height})`)
    .join('; ')
  lines.push(`PHOTOS: ${photoLine}`)
  lines.push(`Recommended opening photo: ${analysis.bestOpeningPhotoIndex}; closing photo: ${analysis.bestClosingPhotoIndex}.`)

  const observed = analysis.observed.filter((item) => !project.correctedObservedIds.includes(item.id))
  lines.push('OBSERVED FACTS (owner-verified):')
  for (const item of observed) {
    lines.push(`- ${item.label}${item.detail ? ` — ${item.detail}` : ''} (photos ${item.photoIndices.join(', ')})`)
  }

  const confirmed = analysis.inferred.filter((item) => project.confirmedInferredIds.includes(item.id))
  for (const item of confirmed) {
    lines.push(`- ${item.label}${item.detail ? ` — ${item.detail}` : ''} (confirmed by the owner)`)
  }

  const unconfirmed = analysis.inferred.filter(
    (item) => !project.confirmedInferredIds.includes(item.id) && !project.rejectedInferredIds.includes(item.id),
  )
  if (unconfirmed.length > 0) {
    lines.push('UNCONFIRMED GUESSES (do not rely on these):')
    for (const item of unconfirmed) lines.push(`- ${item.label}`)
  }

  if (project.correctionNote.trim()) {
    lines.push(`OWNER CORRECTIONS (authoritative — override anything above): ${project.correctionNote.trim()}`)
  }

  lines.push('PRESERVATION RULES IN FORCE:')
  for (const constraint of project.constraints) {
    lines.push(`- [${constraint.severity}] ${constraint.subject}: ${constraint.requirement}`)
  }

  // Server caps analysisSummary at 6000 chars — trim from the tail if needed.
  const text = lines.join('\n')
  return text.length > 5900 ? `${text.slice(0, 5900)}…` : text
}
