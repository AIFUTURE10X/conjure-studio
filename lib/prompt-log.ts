import { getUserId } from '@/lib/user-id'

export type PromptKind = 'image' | 'video' | 'logo'

/** Fire-and-forget prompt-library logging — never blocks or fails generation. */
export function logPromptUse(prompt: string, kind: PromptKind): void {
  const trimmed = prompt.trim()
  if (!trimmed || typeof window === 'undefined') return
  void fetch('/api/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: getUserId(), prompt: trimmed.slice(0, 8000), kind }),
  }).catch((error) => console.error('[prompt-log] Failed:', error))
}
