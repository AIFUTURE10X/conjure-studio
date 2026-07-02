/**
 * edit-chat-types
 *
 * Shared type surface for EditChatProvider, split out to keep the provider
 * itself under the project's 300-line file limit.
 */

export interface EditChatVersion {
  url: string
  label: string
  /** The instruction that produced this version, if any (absent for "Original"). */
  promptUsed?: string
}

export interface EditChatMessage {
  id: string
  role: 'user' | 'assistant'
  text?: string
  hasMask?: boolean
  resultVersionIndex?: number
  isError?: boolean
  /** Multi-variant result awaiting a pick (present until chosenUrl is set). */
  candidateUrls?: string[]
  /** The candidate the user picked, once resolved. */
  chosenUrl?: string
  /** Instruction that produced candidateUrls — becomes the version's promptUsed once chosen. */
  instruction?: string
  /** The version index this result/candidate was edited FROM — re-roll targets this, not the version it produced. */
  sourceIndex?: number
}

/** The most recent result (resolved version or unresolved candidate row) — the only one that shows Re-roll, and what Re-roll targets. */
export function findNewestResultMessage(messages: EditChatMessage[]): EditChatMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.resultVersionIndex !== undefined || (message.candidateUrls && !message.chosenUrl)) {
      return message
    }
  }
  return undefined
}

export interface PendingMask {
  blob: Blob
  previewUrl: string
  /** Natural pixel dims the mask was painted at — lets runEdit detect a stale mask if the working image's aspect ratio has since changed. */
  paintedWidth: number
  paintedHeight: number
}

export interface EditChatTarget {
  index: number
  originalUrl: string
}

export interface EditChatEngine {
  target: EditChatTarget | null
  versions: EditChatVersion[]
  currentVersionIndex: number
  messages: EditChatMessage[]
  isEditing: boolean
  pendingMask: PendingMask | null
  variants: number
  /** True when there's something for the Re-roll button to repeat: a prior instruction or an attached mask. */
  canReroll: boolean
  setVariants: (count: number) => void
  startEditChat: (index: number, url: string) => void
  exitEditChat: () => void
  setPendingMask: (mask: PendingMask | null) => void
  currentImageUrl: () => string | undefined
  sendEdit: (instruction: string) => Promise<void>
  rerollLast: () => Promise<void>
  moreLikeVersion: (index: number) => Promise<void>
  chooseCandidate: (messageId: string, url: string) => void
  revertToVersion: (index: number) => void
  applyVersionToCanvas: (index: number) => Promise<void>
}
