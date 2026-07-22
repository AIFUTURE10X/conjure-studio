/**
 * sourcePhrase → transcript timecode matching for B-roll auto-placement.
 *
 * Whisper transcribes what was SAID, which drifts from the planned script
 * ("gonna" vs "going to", dropped filler, numerals vs words), so beats are
 * matched by anchoring on the first few tokens of the phrase, then — when
 * that fails — a subsequence (LCS) score that tolerates substituted or
 * dropped words. Beats are searched monotonically, each from where the
 * previous one matched, so repeated phrases resolve in order and the
 * resulting timeline is monotonic (what the EDL needs).
 */

export interface TranscriptWord {
  /** Seconds from the start of the recording. */
  start: number
  text: string
}

export type BeatMatchStatus = 'exact' | 'fuzzy' | 'unmatched'

export interface BeatTimecode {
  startSeconds: number | null
  endSeconds: number | null
  matchStatus: BeatMatchStatus
}

interface MatchableBeat {
  id: number
  sourcePhrase: string
  durationSeconds: number
}

/** Lowercase, fold apostrophe variants, strip punctuation, split into tokens. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'") // curly/modifier apostrophes → straight, so "we're" tokenizes the same on both sides
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

interface TimedToken {
  tok: string
  start: number
}

/** One whisper "word" can normalize to several tokens; each keeps its start. */
function toTimedTokens(words: TranscriptWord[]): TimedToken[] {
  return words.flatMap((word) => tokenize(word.text).map((tok) => ({ tok, start: word.start })))
}

const HEAD_TOKENS = 4
/** Phrase tokens used for the fuzzy score — enough to be confident, bounded for speed. */
const FUZZY_PHRASE_TOKENS = 10
const FUZZY_THRESHOLD = 0.6
/** Extra window slack so the transcript can insert a couple of words mid-phrase. */
const FUZZY_SLACK = 3

/** Exact in-order match of the phrase's first K tokens at position p, or -1. */
function findHeadMatch(tokens: TimedToken[], head: string[], from: number): number {
  outer: for (let p = from; p <= tokens.length - head.length; p++) {
    for (let i = 0; i < head.length; i++) {
      if (tokens[p + i].tok !== head[i]) continue outer
    }
    return p
  }
  return -1
}

/**
 * Longest common subsequence of two short token runs, plus the index in `b`
 * of the first token that participates — used to anchor the match at the
 * first word that actually lines up, not the window's edge.
 */
function lcs(a: string[], b: string[]): { len: number; startB: number } {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  let i = m
  let j = n
  let startB = -1
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { startB = j - 1; i--; j-- }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--
    else j--
  }
  return { len: dp[m][n], startB }
}

/** Best fuzzy window from `from`: subsequence score + anchor token index. */
function findFuzzyMatch(tokens: TimedToken[], phraseHead: string[], from: number): { score: number; index: number } {
  const width = phraseHead.length + FUZZY_SLACK
  let best = { score: 0, index: -1 }
  for (let p = from; p < tokens.length; p++) {
    const window = tokens.slice(p, p + width).map((t) => t.tok)
    const { len, startB } = lcs(phraseHead, window)
    const score = len / phraseHead.length
    if (score > best.score) best = { score, index: p + Math.max(0, startB) }
    if (score === 1) break
  }
  return best
}

/**
 * Resolve each beat's sourcePhrase to a start time in the transcript.
 * endSeconds = startSeconds + the beat's clip duration (the cutaway covers
 * the line from where it begins).
 */
export function resolveBeatTimecodes(
  beats: MatchableBeat[],
  words: TranscriptWord[],
): Map<number, BeatTimecode> {
  const tokens = toTimedTokens(words)
  const result = new Map<number, BeatTimecode>()
  let cursor = 0

  for (const beat of beats) {
    const phrase = tokenize(beat.sourcePhrase)
    if (phrase.length === 0 || tokens.length === 0) {
      result.set(beat.id, { startSeconds: null, endSeconds: null, matchStatus: 'unmatched' })
      continue
    }

    const head = phrase.slice(0, Math.min(HEAD_TOKENS, phrase.length))
    let matchIndex = findHeadMatch(tokens, head, cursor)
    let matchStatus: BeatMatchStatus = 'exact'

    if (matchIndex === -1) {
      const fuzzy = findFuzzyMatch(tokens, phrase.slice(0, FUZZY_PHRASE_TOKENS), cursor)
      if (fuzzy.score >= FUZZY_THRESHOLD && fuzzy.index >= 0) {
        matchIndex = fuzzy.index
        matchStatus = 'fuzzy'
      } else {
        result.set(beat.id, { startSeconds: null, endSeconds: null, matchStatus: 'unmatched' })
        continue
      }
    }

    const startSeconds = tokens[matchIndex].start
    result.set(beat.id, {
      startSeconds,
      endSeconds: startSeconds + beat.durationSeconds,
      matchStatus,
    })
    cursor = matchIndex + 1
  }

  return result
}

/**
 * Fallback when there is no transcript (or nothing matched): lay clips
 * back-to-back from 0:00. An explicit user choice, never silent.
 */
export function sequentialTimecodes(beats: MatchableBeat[]): Map<number, BeatTimecode> {
  const result = new Map<number, BeatTimecode>()
  let at = 0
  for (const beat of beats) {
    result.set(beat.id, { startSeconds: at, endSeconds: at + beat.durationSeconds, matchStatus: 'exact' })
    at += beat.durationSeconds
  }
  return result
}
