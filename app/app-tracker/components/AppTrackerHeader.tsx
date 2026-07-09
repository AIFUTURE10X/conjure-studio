'use client'

import Link from 'next/link'
import { Plus, Settings, RotateCcw, Globe, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AppTrackerHeaderProps {
  onAddProject: () => void
  onOpenSettings?: () => void
  onOpenGlobalTodos?: () => void
  onResetToDefaults?: () => void
}

export function AppTrackerHeader({ onAddProject, onOpenSettings, onOpenGlobalTodos, onResetToDefaults }: AppTrackerHeaderProps) {
  return (
    <header className="flex items-center px-6 py-4 border-b border-zinc-800 bg-zinc-900">
      {/* Left: Title */}
      <div className="flex items-center gap-3 flex-1">
        <span className="text-2xl">📋</span>
        <div>
          <h1 className="text-xl font-bold text-white">App Progress & QA Tracker</h1>
          <p className="text-xs text-zinc-400">Track development tasks and QA testing</p>
        </div>
      </div>

      {/* Center: Action buttons */}
      <div className="flex items-center gap-2 justify-center">
        <Link
          href="/image-studio"
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-gradient-to-br from-[#c99850] to-[#dbb56e] hover:from-[#dbb56e] hover:to-[#c99850] text-black text-sm font-medium transition-all"
          title="Back to Image Studio"
        >
          <Home className="w-4 h-4 mr-1" />
          Home
        </Link>
        {onResetToDefaults && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Reset all data to defaults? This will replace all projects, features, tasks, and tests with default data.')) {
                onResetToDefaults()
              }
            }}
            className="text-zinc-400 hover:text-white"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onAddProject}
          className="border-[#c99850]/50 text-[#c99850] hover:bg-[#c99850]/10 hover:border-[#c99850]"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Project
        </Button>
        {onOpenGlobalTodos && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenGlobalTodos}
            className="text-zinc-400 hover:text-[#c99850]"
            title="Global Development Todos"
          >
            <Globe className="w-4 h-4" />
          </Button>
        )}
        {onOpenSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="text-zinc-400 hover:text-white"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Right: Spacer to balance the layout */}
      <div className="flex-1" />
    </header>
  )
}
