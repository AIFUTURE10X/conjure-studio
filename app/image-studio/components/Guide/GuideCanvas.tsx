"use client"

/**
 * GuideCanvas — the in-app manual (Guide tab). Sticky section nav on the
 * left (chip row on small screens), scrollable articles on the right.
 * All content lives in constants/guide-content.ts.
 */

import { useRef, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { GUIDE_SECTIONS } from '../../constants/guide-content'
import { GuideArticleBlock } from './GuideArticleBlock'

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
                  <GuideArticleBlock key={index} article={article} />
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
