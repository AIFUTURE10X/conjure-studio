"use client"

/**
 * Fetches a title style's reference artwork through the same-origin proxy and
 * hands back a File plus an object-URL preview, matching the shape the logo
 * panel's reference-image slot expects.
 *
 * Callers own the preview url and must revokeObjectURL it when they replace or
 * clear the reference.
 */

export interface TitleStyleArtwork {
  file: File
  preview: string
}

export async function fetchTitleStyleArtwork(
  styleId: string,
  signal?: AbortSignal
): Promise<TitleStyleArtwork> {
  const response = await fetch(`/api/title-logo-reference/${encodeURIComponent(styleId)}`, {
    signal,
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new Error(detail?.error ?? `Reference artwork failed (${response.status})`)
  }

  const blob = await response.blob()
  const file = new File([blob], `${styleId}.png`, { type: blob.type || 'image/png' })

  return { file, preview: URL.createObjectURL(file) }
}
