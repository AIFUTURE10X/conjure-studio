'use client'

import type { GlobalTodoAssignment, Project, TaskStatus } from '../../constants/types'

interface ProjectStatusIndicatorsProps {
  assignments: GlobalTodoAssignment[]
  projects: Project[]
}

const STATUS_STYLES: Record<TaskStatus, { bg: string; icon: string }> = {
  done: { bg: 'bg-green-500', icon: '✓' },
  in_progress: { bg: 'bg-yellow-500', icon: '●' },
  todo: { bg: 'bg-zinc-600', icon: '○' },
}

export function ProjectStatusIndicators({
  assignments,
  projects,
}: ProjectStatusIndicatorsProps) {
  if (assignments.length === 0) return null

  // Get project info for each assignment
  const assignmentDetails = assignments.map(assignment => {
    const project = projects.find(p => p.id === assignment.project_id)
    return {
      ...assignment,
      projectName: project?.name || 'Unknown Project',
      projectIcon: project?.icon || '📁',
    }
  })

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {assignmentDetails.map(detail => {
        const style = STATUS_STYLES[detail.status]
        const tooltipText = `${detail.projectIcon} ${detail.projectName} • ${detail.status.replace('_', ' ')}`
        return (
          <div
            key={detail.id}
            title={tooltipText}
            className={`w-5 h-5 rounded-full ${style.bg} flex items-center justify-center text-[10px] text-white cursor-default`}
          >
            {style.icon}
          </div>
        )
      })}
    </div>
  )
}
