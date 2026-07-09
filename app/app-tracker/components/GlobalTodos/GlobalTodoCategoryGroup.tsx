'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { GlobalTodo, GlobalTodoAssignment, Project, GlobalTodoCategory } from '../../constants/types'
import { getCategoryConfig } from '../../constants/global-todo-defaults'
import { GlobalTodoItem } from './GlobalTodoItem'

interface GlobalTodoCategoryGroupProps {
  category: GlobalTodoCategory
  todos: GlobalTodo[]
  assignments: GlobalTodoAssignment[]
  projects: Project[]
  onEditTodo: (todo: GlobalTodo) => void
  onDeleteTodo: (todoId: string) => void
  onAssignTodo: (todo: GlobalTodo) => void
  onToggleAssignmentStatus: (assignmentId: string) => void
  defaultExpanded?: boolean
}

export function GlobalTodoCategoryGroup({
  category,
  todos,
  assignments,
  projects,
  onEditTodo,
  onDeleteTodo,
  onAssignTodo,
  onToggleAssignmentStatus,
  defaultExpanded = true,
}: GlobalTodoCategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const config = getCategoryConfig(category)

  // Count completed assignments for this category
  const categoryAssignments = assignments.filter(a =>
    todos.some(t => t.id === a.global_todo_id)
  )
  const doneCount = categoryAssignments.filter(a => a.status === 'done').length
  const totalCount = categoryAssignments.length

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        )}
        <span className="text-xl">{config.icon}</span>
        <span className={`text-sm font-semibold ${config.color}`}>
          {config.label}
        </span>
        <span className="text-xs text-zinc-500">
          ({todos.length} item{todos.length !== 1 ? 's' : ''})
        </span>
        <div className="flex-1" />
        {totalCount > 0 && (
          <span className="text-xs text-zinc-400">
            {doneCount}/{totalCount} done
          </span>
        )}
      </button>

      {/* Todo items */}
      {isExpanded && (
        <div className="p-3 space-y-2 bg-zinc-950/50">
          {todos.map(todo => {
            const todoAssignments = assignments.filter(a => a.global_todo_id === todo.id)
            return (
              <GlobalTodoItem
                key={todo.id}
                todo={todo}
                assignments={todoAssignments}
                projects={projects}
                onEdit={() => onEditTodo(todo)}
                onDelete={() => onDeleteTodo(todo.id)}
                onAssign={() => onAssignTodo(todo)}
                onToggleAssignmentStatus={onToggleAssignmentStatus}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
