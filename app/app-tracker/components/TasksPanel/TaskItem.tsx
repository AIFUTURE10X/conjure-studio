'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { Task } from '../../constants/types'
import { PriorityBadge } from '../shared'
import { getTaskStatusOption } from '../../constants/status-options'

interface TaskItemProps {
  task: Task
  onToggleStatus: () => void
  onEdit: () => void
  onDelete: () => void
}

export function TaskItem({ task, onToggleStatus, onEdit, onDelete }: TaskItemProps) {
  const statusOption = getTaskStatusOption(task.status)
  const isDone = task.status === 'done'

  return (
    <div className={`group flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
      isDone
        ? 'bg-zinc-800/30 border-zinc-800'
        : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
    }`}>
      {/* Checkbox */}
      <Checkbox
        checked={isDone}
        onCheckedChange={onToggleStatus}
        className={`border-zinc-600 ${isDone ? 'bg-green-500 border-green-500' : ''}`}
      />

      {/* Status icon */}
      <span className={`text-lg ${statusOption.color}`}>{statusOption.icon}</span>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${isDone ? 'text-zinc-500 line-through' : 'text-white'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-zinc-500 truncate">{task.description}</p>
        )}
      </div>

      {/* Priority badge */}
      <PriorityBadge priority={task.priority} size="sm" />

      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-7 w-7 text-zinc-400 hover:text-white"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-7 w-7 text-zinc-400 hover:text-red-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
