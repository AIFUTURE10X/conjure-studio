"use client"

/** Per-job cost table for the Analytics tab: what each generation cost. */

import { CATEGORY_BADGES, type AnalyticsJob } from './analytics-types'

function formatWhen(timestamp: number): string {
  const date = new Date(timestamp)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return isToday ? time : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
}

export function RecentJobsList({ jobs }: { jobs: AnalyticsJob[] }) {
  if (jobs.length === 0) return null

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-100">Recent jobs</h3>
        <p className="text-[10px] text-zinc-500">What each generation cost, newest first</p>
      </div>
      <div className="max-h-[45vh] overflow-y-auto">
        <table className="w-full text-left">
          <tbody>
            {jobs.map((job, index) => (
              <tr key={index} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/80">
                <td className="px-3 py-2 whitespace-nowrap align-top">
                  <span className="text-[10px] font-medium text-zinc-300">{CATEGORY_BADGES[job.kind]}</span>
                </td>
                <td className="px-3 py-2 align-top w-full">
                  <p className="text-[11px] text-zinc-400 leading-4 line-clamp-1" title={job.label}>
                    {job.label || '(no prompt)'}
                  </p>
                  {job.units > 1 && (
                    <p className="text-[10px] text-zinc-600">{job.units} images</p>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right align-top">
                  {job.status === 'refunded' ? (
                    <span className="text-[11px] text-zinc-500 line-through" title="Job failed — credits refunded">refunded</span>
                  ) : job.status === 'pending' ? (
                    <span className="text-[11px] text-sky-400">{job.credits} cr · running</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#dbb56e]">{job.credits} cr</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right align-top">
                  <span className="text-[10px] text-zinc-600">{formatWhen(job.timestamp)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
