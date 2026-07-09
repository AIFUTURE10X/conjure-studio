'use client'

import { ProgressBar } from './ProgressBar'

interface ProgressSummaryProps {
  buildProgress: number
  testProgress: number
  overallProgress?: number
  showOverall?: boolean
  size?: 'sm' | 'md'
}

export function ProgressSummary({
  buildProgress,
  testProgress,
  overallProgress,
  showOverall = false,
  size = 'md',
}: ProgressSummaryProps) {
  const overall = overallProgress ?? Math.round((buildProgress + testProgress) / 2)

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span>Build: <span className="text-zinc-200">{buildProgress}%</span></span>
        <span className="text-zinc-600">|</span>
        <span>Tests: <span className="text-zinc-200">{testProgress}%</span></span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4">
        <ProgressBar value={buildProgress} label="Build" color="blue" size="sm" />
        <ProgressBar value={testProgress} label="Tests" color="green" size="sm" />
      </div>
      {showOverall && (
        <ProgressBar value={overall} label="Overall" color="gold" size="md" />
      )}
    </div>
  )
}
