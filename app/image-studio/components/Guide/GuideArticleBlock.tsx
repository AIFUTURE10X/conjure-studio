"use client"

/**
 * GuideArticleBlock — one guide article: summary content always visible,
 * deep-dive blocks behind a "Show the in-depth guide" expander.
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { GuideArticle, GuideDetailBlock, GuideSettingRow } from '../../constants/guide-content'

function SettingsTable({ rows }: { rows: GuideSettingRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-zinc-800">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-zinc-950/80">
            <th className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Setting</th>
            <th className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Options</th>
            <th className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">What it does</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-zinc-800/70">
              <td className="px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 whitespace-nowrap align-top">{row.name}</td>
              <td className="px-2.5 py-1.5 text-[11px] text-[#dbb56e]/80 align-top">{row.values}</td>
              <td className="px-2.5 py-1.5 text-[11px] text-zinc-400 leading-4 align-top">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Shared renderer for the summary fields and each deep-dive block. */
function ContentBlocks({ block }: { block: GuideDetailBlock }) {
  return (
    <>
      {block.paragraphs?.map((paragraph, index) => (
        <p key={`p-${index}`} className="text-xs text-zinc-400 leading-5">{paragraph}</p>
      ))}

      {block.steps && (
        <ol className="space-y-1.5 list-none">
          {block.steps.map((step, index) => (
            <li key={index} className="flex gap-2 text-xs text-zinc-300 leading-5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#c99850]/15 text-[#dbb56e] text-[10px] font-bold flex items-center justify-center mt-0.5">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}

      {block.settings && <SettingsTable rows={block.settings} />}

      {block.tips && (
        <div className="space-y-1">
          {block.tips.map((tip, index) => (
            <p key={index} className="text-[11px] text-zinc-400 leading-5 flex gap-1.5">
              <span className="shrink-0">💡</span>
              <span>{tip}</span>
            </p>
          ))}
        </div>
      )}
    </>
  )
}

export function GuideArticleBlock({ article }: { article: GuideArticle }) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = Boolean(article.more?.length)

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-100">{article.title}</h3>

      <ContentBlocks block={article} />

      {hasMore && (
        <>
          {expanded && (
            <div className="space-y-3 border-l-2 border-[#c99850]/30 pl-3 ml-0.5">
              {article.more!.map((block, index) => (
                <div key={index} className="space-y-2">
                  {block.heading && (
                    <h4 className="text-xs font-semibold text-[#f0d49b]">{block.heading}</h4>
                  )}
                  <ContentBlocks block={block} />
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-[#c99850]/10 text-[#dbb56e] hover:bg-[#c99850]/20 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide the in-depth guide' : 'Show the in-depth guide'}
          </button>
        </>
      )}
    </div>
  )
}
