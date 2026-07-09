'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Task, Priority } from '../../constants/types'
import { TaskItem } from './TaskItem'
import { TaskFormDialog } from './TaskFormDialog'
import { EmptyState } from '../shared'

interface TasksPanelProps {
  projectId: string
  featureId: string
  tasks: Task[]
  onCreateTask: (projectId: string, featureId: string, title: string, description: string, priority: Priority) => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  onToggleStatus: (taskId: string) => void
}

export function TasksPanel({
  projectId,
  featureId,
  tasks,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onToggleStatus,
}: TasksPanelProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()

  const featureTasks = tasks.filter(t => t.feature_id === featureId)

  // Sort: in_progress first, then todo, then done
  const sortedTasks = [...featureTasks].sort((a, b) => {
    const order = { in_progress: 0, todo: 1, done: 2 }
    return order[a.status] - order[b.status]
  })

  const handleAddClick = () => {
    setEditingTask(undefined)
    setIsFormOpen(true)
  }

  const handleEditClick = (task: Task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleSave = (title: string, description: string, priority: Priority) => {
    if (editingTask) {
      onUpdateTask(editingTask.id, { title, description, priority })
    } else {
      onCreateTask(projectId, featureId, title, description, priority)
    }
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header with add button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-white">Development Tasks</h3>
          <p className="text-sm text-zinc-400">
            {featureTasks.filter(t => t.status === 'done').length} of {featureTasks.length} completed
          </p>
        </div>
        <Button
          onClick={handleAddClick}
          className="bg-[#c99850] hover:bg-[#dbb56e] text-black"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Task list */}
      {sortedTasks.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No tasks yet"
          description="Add development tasks to track your progress on this feature"
          action={
            <Button
              variant="outline"
              onClick={handleAddClick}
              className="border-[#c99850]/50 text-[#c99850] hover:bg-[#c99850]/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add First Task
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {sortedTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleStatus={() => onToggleStatus(task.id)}
              onEdit={() => handleEditClick(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <TaskFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        task={editingTask}
      />
    </div>
  )
}
