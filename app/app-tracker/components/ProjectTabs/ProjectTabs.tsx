'use client'

import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Project, Task, TestItem } from '../../constants/types'
import { calculateProjectProgress } from '../../hooks/useProgress'

interface ProjectTabsProps {
  projects: Project[]
  tasks: Task[]
  testItems: TestItem[]
  activeProjectId: string | null
  onSelectProject: (projectId: string) => void
  onAddProject: () => void
  onDeleteProject?: (projectId: string) => void
}

export function ProjectTabs({
  projects,
  tasks,
  testItems,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject,
}: ProjectTabsProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-zinc-900 border-b border-zinc-800 overflow-x-auto">
      {projects.map(project => {
        const isActive = project.id === activeProjectId
        const progress = calculateProjectProgress(tasks, testItems, project.id)

        return (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectProject(project.id)}
            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              isActive
                ? 'bg-zinc-800 text-white border border-[#c99850]/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <span className="text-lg">{project.icon}</span>
            <span className="font-medium whitespace-nowrap">{project.name}</span>

            {/* Mini progress indicator */}
            <div className="flex items-center gap-1 ml-1">
              <div className="w-8 h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c99850] rounded-full"
                  style={{ width: `${progress.overallProgress}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500">{progress.overallProgress}%</span>
            </div>

            {/* Delete button (only when hovering, not on active) */}
            {onDeleteProject && !isActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteProject(project.id)
                }}
                className="absolute -top-1 -right-1 p-0.5 bg-zinc-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )
      })}

      {/* Add project button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddProject}
        className="text-zinc-500 hover:text-[#c99850] ml-2"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  )
}
