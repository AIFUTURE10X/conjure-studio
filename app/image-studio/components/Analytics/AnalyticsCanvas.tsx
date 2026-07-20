"use client"

/**
 * AnalyticsCanvas — the Analytics tab. Spend by category, daily stacked
 * bars, and per-job costs over a 7/30/90-day window. Costs come from
 * /api/analytics (computed from history via the cost map; exact charges
 * win when billing recorded them).
 */

import { useEffect, useState } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import { getUserId } from '@/lib/user-id'
import { RecentJobsList } from './RecentJobsList'
import { CATEGORY_COLORS, type AnalyticsData } from './analytics-types'

const WINDOWS = [7, 30, 90] as const

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex-1 min-w-[130px] rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-xl font-bold text-white mt-0.5">{value}</p>
      {hint && <p className="text-[10px] text-zinc-600 mt-0.5">{hint}</p>}
    </div>
  )
}

export function AnalyticsCanvas() {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetch(`/api/analytics?userId=${encodeURIComponent(getUserId())}&days=${days}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => { if (!cancelled && payload) setData(payload) })
      .catch((error) => console.error('[analytics] Load failed:', error))
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [days])

  const maxCategoryCredits = Math.max(1, ...(data?.categories.map((c) => c.credits) ?? [1]))
  const maxDaily = Math.max(1, ...(data?.daily.map((d) => d.image + d.video + d.tools) ?? [1]))
  const billedTotal = data?.billed.reduce((sum, row) => sum + row.credits, 0) ?? 0

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#dbb56e]" />
          <h2 className="text-base font-bold text-white">Spend Analytics</h2>
        </div>
        <div className="flex gap-1 ml-auto">
          {WINDOWS.map((option) => (
            <button
              key={option}
              onClick={() => setDays(option)}
              className={`px-2.5 h-7 rounded-md text-xs font-bold transition-colors ${
                days === option
                  ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {option}d
            </button>
          ))}
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-16 text-zinc-500 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Crunching your history…
        </div>
      ) : !data || data.totals.jobs === 0 ? (
        <p className="text-center text-sm text-zinc-500 py-16">
          Nothing generated in the last {days} days — spend appears here as you create.
        </p>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            <StatTile label="Credits spent" value={String(data.totals.credits)} hint={`last ${data.days} days`} />
            <StatTile label="Jobs run" value={String(data.totals.jobs)} />
            <StatTile label="Images generated" value={String(data.totals.images)} />
            <StatTile label="Video clips" value={String(data.totals.videos)} />
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-2.5">
            <h3 className="text-sm font-semibold text-zinc-100">By category</h3>
            {data.categories.map((category) => (
              <div key={category.id}>
                <div className="flex items-baseline justify-between text-[11px] mb-0.5">
                  <span className="text-zinc-300 font-medium">{category.label}</span>
                  <span className="text-zinc-500">
                    {category.jobs} job{category.jobs === 1 ? '' : 's'}
                    {category.id === 'image' ? ` · ${category.units} images` : ''}
                    {' · avg '}{category.avgCredits} cr
                    {' · '}<span className="text-[#dbb56e] font-semibold">{category.credits} cr</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[category.id]}`}
                    style={{ width: `${Math.max(2, (category.credits / maxCategoryCredits) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-zinc-100">Daily spend</h3>
              <div className="flex gap-3 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-500 inline-block" /> Image</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#dbb56e] inline-block" /> Video</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Tools</span>
              </div>
            </div>
            <div className="flex items-end gap-px h-28">
              {data.daily.map((day) => {
                const total = day.image + day.video + day.tools
                return (
                  <div
                    key={day.date}
                    title={`${day.date} — ${total} cr (image ${day.image}, video ${day.video}, tools ${day.tools})`}
                    className="flex-1 min-w-0 flex flex-col justify-end h-full rounded-sm overflow-hidden"
                  >
                    {total === 0 ? (
                      <div className="h-px bg-zinc-800" />
                    ) : (
                      <>
                        <div className="bg-emerald-500" style={{ height: `${(day.tools / maxDaily) * 100}%` }} />
                        <div className="bg-[#dbb56e]" style={{ height: `${(day.video / maxDaily) * 100}%` }} />
                        <div className="bg-sky-500" style={{ height: `${(day.image / maxDaily) * 100}%` }} />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-[9px] text-zinc-600 mt-1">
              <span>{data.daily[0]?.date}</span>
              <span>{data.daily[data.daily.length - 1]?.date}</span>
            </div>
          </div>

          <RecentJobsList jobs={data.recent} />

          <p className="text-[10px] text-zinc-600 pb-4">
            {billedTotal > 0
              ? `Billing recorded ${billedTotal} credits of actual charges in this window; other numbers are computed from your history at current rates.`
              : 'Costs are computed from your generation history at current credit rates — in free mode nothing was actually charged. Failed video jobs show as refunded.'}
          </p>
        </>
      )}
    </div>
  )
}
