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
}

export interface PendingMask {
  blob: Blob
  previewUrl: string
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
