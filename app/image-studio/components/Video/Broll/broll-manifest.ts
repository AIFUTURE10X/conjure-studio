import type { BrollBeat } from './useBrollPlan'
import type { VideoJob } from '../useVideoGeneration'
import type { BeatTimecode } from './broll-timecodes'
import { BROLL_MODEL } from './useBrollPlan'

/**
 * B-roll manifest export (editor handoff): the beat plan plus each beat's
 * generated clip URL, as JSON or CSV — and, once a transcript has been
 * timed (Whisper), as a real SRT marker track and CMX3600 EDL that place
 * each cutaway at its actual timecode. Without timecodes the editor drops
 * clips in using `coversPhrase` to find the spot in the voiceover by ear.
 */

export interface BrollManifestRow {
  order: number
  keyword: string
  /** Verbatim transcript line the cutaway covers — the editor's placement key. */
  coversPhrase: string
  videoPrompt: string
  durationSeconds: number
  clipStatus: 'not generated' | 'rendering' | 'done' | 'failed'
  clipUrl: string
  /** Absolute voiceover timecodes, when a transcript has been matched. */
  startSeconds: number | null
  endSeconds: number | null
}

/**
 * Beats don't hold job ids (submitVideo only reports success), so clips are
 * joined back by exact prompt match against B-roll-model jobs — which also
 * survives a refresh, since jobs rehydrate from video history. Editing a
 * beat's prompt after queueing breaks the join and the row reads
 * "not generated"; re-queue the beat to relink it.
 */
function latestClipFor(beat: BrollBeat, jobs: VideoJob[]): VideoJob | undefined {
  return jobs
    .filter((job) => job.model === BROLL_MODEL && job.prompt === beat.videoPrompt)
    .sort((a, b) => b.timestamp - a.timestamp)[0]
}

export function buildBrollManifest(
  beats: BrollBeat[],
  jobs: VideoJob[],
  timecodes?: Map<number, BeatTimecode> | null,
): BrollManifestRow[] {
  return beats.map((beat, index) => {
    const job = latestClipFor(beat, jobs)
    const clipStatus: BrollManifestRow['clipStatus'] =
      !job ? 'not generated'
      : job.status === 'pending' ? 'rendering'
      : job.status === 'failed' ? 'failed'
      : 'done'
    const timecode = timecodes?.get(beat.id)
    return {
      order: index + 1,
      keyword: beat.keyword,
      coversPhrase: beat.sourcePhrase,
      videoPrompt: beat.videoPrompt,
      durationSeconds: beat.durationSeconds,
      clipStatus,
      clipUrl: job?.videoUrl ?? '',
      startSeconds: timecode?.startSeconds ?? null,
      endSeconds: timecode?.endSeconds ?? null,
    }
  })
}

export interface BrollManifestContext {
  resolution: string
  aspectRatio: string
}

export function manifestToJson(rows: BrollManifestRow[], context: BrollManifestContext): string {
  return JSON.stringify(
    {
      type: 'broll-manifest',
      exportedAt: new Date().toISOString(),
      model: BROLL_MODEL,
      resolution: context.resolution,
      aspectRatio: context.aspectRatio,
      beats: rows,
    },
    null,
    2,
  )
}

const CSV_COLUMNS: Array<[header: string, pick: (row: BrollManifestRow) => string | number]> = [
  ['order', (row) => row.order],
  ['keyword', (row) => row.keyword],
  ['covers_phrase', (row) => row.coversPhrase],
  ['video_prompt', (row) => row.videoPrompt],
  ['duration_seconds', (row) => row.durationSeconds],
  ['start_seconds', (row) => row.startSeconds ?? ''],
  ['clip_status', (row) => row.clipStatus],
  ['clip_url', (row) => row.clipUrl],
]

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`
}

export function manifestToCsv(rows: BrollManifestRow[]): string {
  const header = CSV_COLUMNS.map(([name]) => name).join(',')
  const lines = rows.map((row) => CSV_COLUMNS.map(([, pick]) => csvEscape(pick(row))).join(','))
  return [header, ...lines].join('\r\n')
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0')
}

/** SRT timecode: HH:MM:SS,mmm — comma before ms, exactly 3 digits. */
function secondsToSrt(t: number): string {
  const ms = Math.round(t * 1000)
  const hh = Math.floor(ms / 3_600_000)
  const mm = Math.floor(ms / 60_000) % 60
  const ss = Math.floor(ms / 1000) % 60
  return `${pad(hh, 2)}:${pad(mm, 2)}:${pad(ss, 2)},${pad(ms % 1000, 3)}`
}

/** Timecoded rows sorted by start — the shared precondition for SRT/EDL. */
function timedRows(rows: BrollManifestRow[]): Array<BrollManifestRow & { startSeconds: number; endSeconds: number }> {
  return rows
    .filter((row): row is BrollManifestRow & { startSeconds: number; endSeconds: number } =>
      row.startSeconds !== null && row.endSeconds !== null)
    .sort((a, b) => a.startSeconds - b.startSeconds)
}

/**
 * SRT marker track: one cue per placed beat, text = keyword. A placement
 * guide over the voiceover, not spoken captions. UTF-8 without BOM, CRLF.
 */
export function manifestToSrt(rows: BrollManifestRow[]): string {
  const blocks = timedRows(rows).map((row, index) => [
    String(index + 1),
    `${secondsToSrt(row.startSeconds)} --> ${secondsToSrt(row.endSeconds)}`,
    row.keyword,
  ].join('\r\n'))
  return blocks.join('\r\n\r\n') + '\r\n'
}

/** EDL frame rate — no fps exists anywhere in the app, so 30 non-drop is our stated assumption. */
export const EDL_FPS = 30

function secondsToEdlFrames(t: number): number {
  return Math.round(t * EDL_FPS)
}

/** EDL timecode from an absolute frame count: HH:MM:SS:FF non-drop, FF in 0..fps-1. */
function framesToEdl(frames: number): string {
  const ff = frames % EDL_FPS
  const s = Math.floor(frames / EDL_FPS)
  return `${pad(Math.floor(s / 3600), 2)}:${pad(Math.floor(s / 60) % 60, 2)}:${pad(s % 60, 2)}:${pad(ff, 2)}`
}

/**
 * CMX3600 EDL: drops each finished clip on V1 at its voiceover timecode.
 * The sequence it's imported into must run at EDL_FPS non-drop (baked into
 * the title). Reel is AX (URLs don't fit 8 chars); each event carries a
 * stable local clip name + the source URL as comments — download the clips
 * and name them to match (beat-001.mp4, …), then relink in the editor.
 *
 * A cutaway plays until the next one begins, so overlapping record spans are
 * clamped to the next beat's start — V1 can't carry two clips at once, and a
 * beat fully covered by the next is dropped. Source OUT is derived from the
 * (clamped) record frame count so src duration always equals rec duration.
 */
export function manifestToEdl(rows: BrollManifestRow[]): string {
  const placed = timedRows(rows).filter((row) => row.clipUrl !== '')
  const lines: string[] = [`TITLE: BROLL_TIMELINE_${EDL_FPS}FPS_NDF`, 'FCM: NON-DROP FRAME']
  let eventNo = 0
  placed.forEach((row, index) => {
    const recIn = secondsToEdlFrames(row.startSeconds)
    const next = placed[index + 1]
    const recOut = next
      ? Math.min(secondsToEdlFrames(row.endSeconds), secondsToEdlFrames(next.startSeconds))
      : secondsToEdlFrames(row.endSeconds)
    const recFrames = recOut - recIn
    if (recFrames <= 0) return // fully covered by the next beat — nothing to place
    eventNo += 1
    lines.push(
      `${pad(eventNo, 3)}  AX       V     C        ` +
        `${framesToEdl(0)} ${framesToEdl(recFrames)} ${framesToEdl(recIn)} ${framesToEdl(recOut)}`,
      `* FROM CLIP NAME: beat-${pad(eventNo, 3)}.mp4`,
      `* SOURCE FILE: ${row.clipUrl}`,
    )
  })
  return lines.join('\r\n') + '\r\n'
}

export function downloadTextFile(filename: string, mimeType: string, content: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
