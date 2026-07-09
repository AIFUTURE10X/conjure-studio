'use client'

import { useState } from 'react'
import { Edit, Trash2, Users, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GlobalTodo, GlobalTodoAssignment, Project } from '../../constants/types'
import { getCategoryConfig } from '../../constants/global-todo-defaults'
import { PriorityBadge } from '../shared'
import { ProjectStatusIndicators } from './ProjectStatusIndicators'

interface GlobalTodoItemProps {
  todo: GlobalTodo
  assignments: GlobalTodoAssignment[]
  projects: Project[]
  onEdit: () => void
  onDelete: () => void
  onAssign: () => void
  onToggleAssignmentStatus: (assignmentId: string) => void
}

export function GlobalTodoItem({
  todo,
  assignments,
  projects,
  onEdit,
  onDelete,
  onAssign,
  onToggleAssignmentStatus,
}: GlobalTodoItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const categoryConfig = getCategoryConfig(todo.category)

  const assignedCount = assignments.length
  const doneCount = assignments.filter(a => a.status === 'done').length

  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg overflow-hidden hover:border-zinc-600 transition-colors">
      {/* Main row */}
      <div className="p-3 flex items-start gap-3">
        {/* Expand toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-0.5 text-zinc-500 hover:text-white transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Category icon */}
        <span className="text-lg mt-0.5">{categoryConfig.icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-medium text-white truncate">{todo.title}</h4>
            <PriorityBadge priority={todo.priority} />
            {todo.apply_to_all && (
              <span className="px-1.5 py-0.5 text-[10px] bg-[#c99850]/20 text-[#c99850] rounded">
                All Projects
              </span>
            )}
          </div>

          {todo.description && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{todo.description}</p>
          )}

          {/* Assignment summary */}
          <div className="flex items-center gap-3 mt-2">
            {assignedCount > 0 ? (
              <>
                <span className="text-xs text-zinc-500">
                  {doneCount}/{assignedCount} done
                </span>
                <ProjectStatusIndicators
                  assignments={assignments}
                  projects={projects}
                />
              </>
            ) : (
              <span className="text-xs text-zinc-500 italic">Not assigned to any projects</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onAssign}
            className="h-8 w-8 text-zinc-400 hover:text-[#c99850]"
            title="Assign to projects"
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-zinc-400 hover:text-white"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-zinc-400 hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expanded: Per-project status list */}
      {isExpanded && assignments.length > 0 && (
        <div className="border-t border-zinc-700/50 bg-zinc-900/50 px-4 py-2">
          <div className="text-xs text-zinc-500 mb-2">Per-project progress:</div>
          <div className="space-y-1">
            {assignments.map(assignment => {
              const project = projects.find(p => p.id === assignment.project_id)
              return (
                <button
                  key={assignment.id}
                  onClick={() => onToggleAssignmentStatus(assignment.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 transition-colors group text-left"
                >
                  <StatusIcon status={assignment.status} />
                  <span className="flex-1 text-sm text-zinc-300">
                    {project?.icon} {project?.name || 'Unknown'}
                  </span>
                  <span className="text-xs text-zinc-500 group-hover:text-zinc-400 capitalize">
                    {assignment.status.replace('_', ' ')}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'done') {
    return <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white">✓</div>
  }
  if (status === 'in_progress') {
    return <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] text-white">●</div>
  }
  return <div className="w-4 h-4 rounded-full bg-zinc-600 flex items-center justify-center text-[10px] text-white">○</div>
}
