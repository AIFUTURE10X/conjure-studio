"use client"

import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { BrollBeat } from './useBrollPlan'
import {
  resolveBeatTimecodes,
  sequentialTimecodes,
  type BeatTimecode,
  type TranscriptWord,
} from './broll-timecodes'

/**
 * Voiceover transcription state for B-roll auto-placement: upload audio →
 * /api/transcribe (fal Whisper, word timestamps) → match each beat's
 * sourcePhrase to a real timecode. Lives beside useBrollPlan so the plan
 * hook stays focused on beats and clips.
 */

const MAX_MEDIA_BYTES = 4 * 1024 * 1024

export function useBrollTranscribe(beats: BrollBeat[]) {
  const [words, setWords] = useState<TranscriptWord[] | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)

  const transcribe = useCallback(async (file: File) => {
    if (file.size > MAX_MEDIA_BYTES) {
      toast.error('File is too large (max 4MB) — export just the audio track and upload that')
      return
    }
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('media', file)
      const response = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Transcription failed')
      const received = (data.words as TranscriptWord[]) ?? []
      if (received.length === 0) throw new Error('No speech found in that file')
      setWords(received)
      toast.success('Voiceover timed — beats are now matched to real timecodes')
    } catch (error) {
      console.error('[broll] Transcribe failed:', error)
      toast.error(error instanceof Error ? error.message : 'Transcription failed')
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  const clearTranscript = useCallback(() => setWords(null), [])

  /** Per-beat timecodes from the timed transcript; null until one exists. */
  const timecodes: Map<number, BeatTimecode> | null = useMemo(
    () => (words ? resolveBeatTimecodes(beats, words) : null),
    [beats, words],
  )

  /** Back-to-back layout for when there's no transcript — explicit user choice. */
  const sequential = useCallback(() => sequentialTimecodes(beats), [beats])

  const matchSummary = useMemo(() => {
    if (!timecodes) return null
    const statuses = [...timecodes.values()].map((t) => t.matchStatus)
    return {
      exact: statuses.filter((s) => s === 'exact').length,
      fuzzy: statuses.filter((s) => s === 'fuzzy').length,
      unmatched: statuses.filter((s) => s === 'unmatched').length,
    }
  }, [timecodes])

  return { words, isTranscribing, transcribe, clearTranscript, timecodes, sequential, matchSummary }
}
