"use client"

/**
 * GuideCanvas — the in-app manual (Guide tab). Sticky section nav on the
 * left (chip row on small screens), scrollable articles on the right.
 * All content lives in constants/guide-content.ts.
 */

import { useRef, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { GUIDE_SECTIONS, type GuideArticle } from '../../constants/guide-content'

function ArticleBlock({ article }: { article: GuideArticle }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-100">{article.title}</h3>

      {article.paragraphs?.map((paragraph, index) => (
        <p key={index} className="text-xs text-zinc-400 leading-5">{paragraph}</p>
      ))}

      {article.steps && (
        <ol className="space-y-1.5 list-none">
          {article.steps.map((step, index) => (
            <li key={index} className="flex gap-2 text-xs text-zinc-300 leading-5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#c99850]/15 text-[#dbb56e] text-[10px] font-bold flex items-center justify-center mt-0.5">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}

      {article.settings && (
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
              {article.settings.map((row, index) => (
                <tr key={index} className="border-t border-zinc-800/70">
                  <td className="px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 whitespace-nowrap align-top">{row.name}</td>
                  <td className="px-2.5 py-1.5 text-[11px] text-[#dbb56e]/80 align-top">{row.values}</td>
                  <td className="px-2.5 py-1.5 text-[11px] text-zinc-400 leading-4 align-top">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {article.tips && (
        <div className="space-y-1">
          {article.tips.map((tip, index) => (
            <p key={index} className="text-[11px] text-zinc-400 leading-5 flex gap-1.5">
              <span className="shrink-0">💡</span>
              <span>{tip}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export function GuideCanvas() {
  const [activeId, setActiveId] = useState(GUIDE_SECTIONS[0].id)
  const contentRef = useRef<HTMLDivElement>(null)

  const jumpTo = (id: string) => {
    setActiveId(id)
    const target = contentRef.current?.querySelector(`[data-guide-section="${id}"]`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Small screens: horizontal chip nav */}
      <div className="xl:hidden shrink-0 border-b border-zinc-800 bg-zinc-950/90 px-3 py-2 flex gap-1 overflow-x-auto">
        {GUIDE_SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => jumpTo(section.id)}
            className={`shrink-0 px-2 h-7 rounded-md text-[11px] font-medium transition-colors ${
              activeId === section.id
                ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            {section.emoji} {section.title}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Desktop: sticky sidebar nav */}
        <nav className="hidden xl:block w-56 shrink-0 border-r border-zinc-800 bg-zinc-950/60 p-3 space-y-0.5 overflow-y-auto">
          <div className="flex items-center gap-2 px-2 pb-2">
            <BookOpen className="w-4 h-4 text-[#dbb56e]" />
            <span className="text-sm font-bold text-white">How It Works</span>
          </div>
          {GUIDE_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => jumpTo(section.id)}
              className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
                activeId === section.id
                  ? 'bg-[#c99850]/10 text-[#f0d49b] font-medium'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="mr-1.5">{section.emoji}</span>
              {section.title}
            </button>
          ))}
        </nav>

        <div ref={contentRef} className="flex-1 min-w-0 overflow-y-auto px-4 py-4 space-y-8 scroll-smooth">
          {GUIDE_SECTIONS.map((section) => (
            <section key={section.id} data-guide-section={section.id} className="scroll-mt-4 space-y-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{section.emoji}</span>
                  {section.title}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">{section.tagline}</p>
              </div>
              <div className="space-y-3 max-w-3xl">
                {section.articles.map((article, index) => (
                  <ArticleBlock key={index} article={article} />
                ))}
              </div>
            </section>
          ))}
          <p className="text-[10px] text-zinc-600 pb-6">
            Costs shown assume billing is enabled; in free mode everything runs without credits.
          </p>
        </div>
      </div>
    </div>
  )
}
