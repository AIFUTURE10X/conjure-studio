export const CREATION_MEDIA_TYPES = ['image', 'logo', 'video'] as const

export type CreationMediaType = (typeof CREATION_MEDIA_TYPES)[number]

export interface CreationMetadataFields {
  title: string | null
  category: string | null
  tags: string[]
}

export interface CreationMediaMetadata extends CreationMetadataFields {
  mediaType: CreationMediaType
  mediaUrl: string
  updatedAt?: number
}

export interface CreationMetadataInput {
  title?: string | null
  category?: string | null
  tags?: string[] | null
}

function optionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed || null
}

export function normalizeCreationMetadata(input: CreationMetadataInput): CreationMetadataFields {
  const seen = new Set<string>()
  const tags: string[] = []

  for (const value of input.tags ?? []) {
    const tag = value.trim()
    const key = tag.toLocaleLowerCase()
    if (!tag || seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
  }

  return {
    title: optionalText(input.title),
    category: optionalText(input.category),
    tags,
  }
}
