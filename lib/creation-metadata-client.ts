import type {
  CreationMediaMetadata,
  CreationMediaType,
  CreationMetadataInput,
} from '@/lib/creation-metadata'
import { getUserId } from '@/lib/user-id'

export async function fetchCreationMetadata(mediaType?: CreationMediaType): Promise<CreationMediaMetadata[]> {
  const params = new URLSearchParams({ userId: getUserId() })
  if (mediaType) params.set('mediaType', mediaType)
  const response = await fetch(`/api/creation-metadata?${params.toString()}`)
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error || 'Could not load creation details')
  return Array.isArray(data?.metadata) ? data.metadata as CreationMediaMetadata[] : []
}

export async function saveCreationMetadata(
  item: Pick<CreationMediaMetadata, 'mediaType' | 'mediaUrl'> & CreationMetadataInput,
): Promise<CreationMediaMetadata> {
  const response = await fetch('/api/creation-metadata', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: getUserId(), ...item }),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.metadata) {
    throw new Error(data?.error || 'Could not save creation details')
  }
  return data.metadata as CreationMediaMetadata
}
