import type { BrollBeat } from './useBrollPlan'
import type { VideoJob } from '../useVideoGeneration'
import { BROLL_MODEL } from './useBrollPlan'

/**
 * B-roll manifest export (editor handoff): the beat plan plus each beat's
 * generated clip URL, as JSON or CSV. The editor drops clips onto the
 * timeline using `coversPhrase` to find the spot in the voiceover by ear —
 * there are no timecodes until transcript timing (Whisper) exists.
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

export function buildBrollManifest(beats: BrollBeat[], jobs: VideoJob[]): BrollManifestRow[] {
  return beats.map((beat, index) => {
    const job = latestClipFor(beat, jobs)
    const clipStatus: BrollManifestRow['clipStatus'] =
      !job ? 'not generated'
      : job.status === 'pending' ? 'rendering'
      : job.status === 'failed' ? 'failed'
      : 'done'
    return {
      order: index + 1,
      keyword: beat.keyword,
      coversPhrase: beat.sourcePhrase,
      videoPrompt: beat.videoPrompt,
      durationSeconds: beat.durationSeconds,
      clipStatus,
      clipUrl: job?.videoUrl ?? '',
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

export function downloadTextFile(filename: string, mimeType: string, content: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
