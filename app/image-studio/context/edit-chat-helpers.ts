/**
 * edit-chat-helpers
 *
 * Pure/request-building helpers for EditChatProvider's runEdit and
 * version-append flows, split out to keep the provider itself under the
 * project's 300-line file limit.
 */

import { useCallback, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import { flushSync } from 'react-dom'
import { scaleMaskBlob } from '../components/ImageEditor/upload-prep'
import type { EditChatVersion, PendingMask } from './edit-chat-types'

/**
 * State paired with a ref updated synchronously in the same setter call.
 * EditChatProvider needs this for values (pendingMask, lastInstruction)
 * that a subsequent synchronous call in the same handler must read as
 * already-updated (e.g. clearing pendingMask right before invoking runEdit,
 * whose own closure would otherwise still see the pre-clear value until the
 * next render).
 */
export function useRefBackedState<T>(initial: T): [T, (value: T) => void, MutableRefObject<T>] {
  const [state, setState] = useState(initial)
  const ref = useRef(initial)
  const setValue = useCallback((value: T) => {
    ref.current = value
    setState(value)
  }, [])
  return [state, setValue, ref]
}

/** A mask painted for one aspect ratio scoping an edit at a noticeably different one would silently stretch instead of scoping the intended area. */
const MASK_ASPECT_DRIFT_TOLERANCE = 0.02

/** True when the working image's aspect ratio has drifted enough from the mask's painted aspect that reusing the mask would scope the wrong region. */
export function isMaskAspectStale(preparedWidth: number, preparedHeight: number, mask: PendingMask): boolean {
  const preparedAspect = preparedWidth / preparedHeight
  const paintedAspect = mask.paintedWidth / mask.paintedHeight
  return Math.abs(preparedAspect - paintedAspect) / paintedAspect > MASK_ASPECT_DRIFT_TOLERANCE
}

export interface EditRequestInput {
  imageBlob: Blob
  fileName: string
  imageWidth: number
  imageHeight: number
  mask: PendingMask | null
  isRemove: boolean
  trimmedInstruction: string
  variants: number
}

/** Builds the multipart body for POST /api/edit-image. */
export async function buildEditFormData(input: EditRequestInput): Promise<FormData> {
  const formData = new FormData()
  formData.append('image', input.imageBlob, input.fileName)
  if (input.mask) {
    // The mask was painted at the source's natural size; rescale it to the
    // exact pixel size actually being uploaded.
    formData.append('mask', await scaleMaskBlob(input.mask.blob, input.imageWidth, input.imageHeight), 'mask.png')
    formData.append('mode', input.isRemove ? 'erase' : 'replace')
  }
  if (input.trimmedInstruction) formData.append('prompt', input.trimmedInstruction)
  formData.append('variants', String(input.variants))
  return formData
}

/**
 * Appends a version via a functional setState update and returns its index.
 * Wrapped in flushSync so the updater runs — and `newIndex` is captured —
 * before this returns: by the time runEdit/chooseCandidate call this, prior
 * setState calls in the same handler (setMessages, setIsEditing, …) have
 * already queued updates for this fiber, which disqualifies React's
 * dispatch-time "eager state" optimization that a bare functional update
 * would otherwise rely on — without flushSync the updater (and the capture
 * of `newIndex`) doesn't actually run until the next render, well after
 * this function has already returned -1. Confirmed empirically against
 * React 19; a plain `[...versions, x]` off a closure-captured array has the
 * same-shaped bug from the other direction — it can silently drop whichever
 * of two concurrent appends (e.g. runEdit vs. chooseCandidate) commits second.
 */
export function appendVersion(
  setVersions: Dispatch<SetStateAction<EditChatVersion[]>>,
  build: (newIndex: number) => EditChatVersion,
): number {
  let newIndex = -1
  flushSync(() => {
    setVersions((prev) => {
      newIndex = prev.length
      return [...prev, build(newIndex)]
    })
  })
  return newIndex
}
