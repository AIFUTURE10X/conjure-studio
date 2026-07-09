'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Plus, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GlobalTodo, GlobalTodoCategory, Priority, Project } from '../../constants/types'
import { GLOBAL_TODO_CATEGORIES } from '../../constants/global-todo-defaults'
import { useGlobalTodos } from '../../hooks/useGlobalTodos'
import { useGlobalTodoAssignments } from '../../hooks/useGlobalTodoAssignments'
import { GlobalTodoFilters } from './GlobalTodoFilters'
import { GlobalTodoCategoryGroup } from './GlobalTodoCategoryGroup'
import { AddGlobalTodoDialog } from './AddGlobalTodoDialog'
import { AssignTodoDialog } from './AssignTodoDialog'
import { EmptyState } from '../shared'

interface GlobalTodosPanelProps {
  projects: Project[]
  onBack: () => void
}

export function GlobalTodosPanel({ projects, onBack }: GlobalTodosPanelProps) {
  const {
    globalTodos,
    filteredTodos,
    todosByCategory,
    filters,
    setFilters,
    resetFilters,
    createGlobalTodo,
    updateGlobalTodo,
    deleteGlobalTodo,
  } = useGlobalTodos()

  const {
    assignments,
    assignToProjects,
    unassignFromProject,
    toggleAssignmentStatus,
    deleteAssignmentsByTodo,
    getProjectIdsForTodo,
  } = useGlobalTodoAssignments()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<GlobalTodo | undefined>()
  const [assigningTodo, setAssigningTodo] = useState<GlobalTodo | null>(null)

  // Get categories that have filtered todos
  const activeCategories = useMemo(() => {
    return GLOBAL_TODO_CATEGORIES.filter(cat =>
      todosByCategory[cat.key]?.length > 0
    ).map(cat => cat.key)
  }, [todosByCategory])

  const handleAddClick = () => {
    setEditingTodo(undefined)
    setIsAddDialogOpen(true)
  }

  const handleEditTodo = (todo: GlobalTodo) => {
    setEditingTodo(todo)
    setIsAddDialogOpen(true)
  }

  const handleSaveTodo = (
    title: string,
    description: string,
    category: GlobalTodoCategory,
    priority: Priority,
    applyToAll: boolean
  ) => {
    if (editingTodo) {
      updateGlobalTodo(editingTodo.id, { title, description, category, priority, apply_to_all: applyToAll })
      // If apply_to_all changed to true, assign to all projects
      if (applyToAll && !editingTodo.apply_to_all) {
        assignToProjects(editingTodo.id, projects.map(p => p.id))
      }
    } else {
      const newTodo = createGlobalTodo(title, description, category, priority, applyToAll)
      // If apply_to_all, assign to all projects immediately
      if (applyToAll) {
        assignToProjects(newTodo.id, projects.map(p => p.id))
      }
    }
  }

  const handleDeleteTodo = (todoId: string) => {
    deleteGlobalTodo(todoId)
    deleteAssignmentsByTodo(todoId)
  }

  const handleAssignTodo = (todo: GlobalTodo) => {
    setAssigningTodo(todo)
  }

  const handleSaveAssignment = (todoId: string, projectIds: string[], applyToAll: boolean) => {
    const currentProjectIds = getProjectIdsForTodo(todoId)

    // Unassign from projects not in the new list
    currentProjectIds.forEach(pid => {
      if (!projectIds.includes(pid)) {
        unassignFromProject(todoId, pid)
      }
    })

    // Assign to new projects
    assignToProjects(todoId, projectIds)

    // Update the apply_to_all flag
    updateGlobalTodo(todoId, { apply_to_all: applyToAll })
  }

  // Stats
  const totalTodos = globalTodos.length
  const totalAssignments = assignments.length
  const completedAssignments = assignments.filter(a => a.status === 'done').length

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Globe className="w-6 h-6 text-[#c99850]" />
          <div>
            <h2 className="text-xl font-semibold text-white">Global Development Todos</h2>
            <p className="text-sm text-zinc-400">
              {totalTodos} todo{totalTodos !== 1 ? 's' : ''} • {completedAssignments}/{totalAssignments} assignments done
            </p>
          </div>
        </div>
        <Button
          onClick={handleAddClick}
          className="bg-[#c99850] hover:bg-[#dbb56e] text-black"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Todo
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <GlobalTodoFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
        />
      </div>

      {/* Content */}
      {filteredTodos.length === 0 ? (
        <EmptyState
          icon="🌍"
          title={globalTodos.length === 0 ? 'No global todos yet' : 'No todos match filters'}
          description={
            globalTodos.length === 0
              ? 'Create reusable development todos that can be applied across all your projects'
              : 'Try adjusting your filters to see more todos'
          }
          action={
            globalTodos.length === 0 ? (
              <Button
                variant="outline"
                onClick={handleAddClick}
                className="border-[#c99850]/50 text-[#c99850] hover:bg-[#c99850]/10"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add First Todo
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={resetFilters}
                className="border-zinc-700 text-zinc-400 hover:text-white"
              >
                Clear Filters
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {activeCategories.map(category => (
            <GlobalTodoCategoryGroup
              key={category}
              category={category}
              todos={todosByCategory[category] || []}
              assignments={assignments}
              projects={projects}
              onEditTodo={handleEditTodo}
              onDeleteTodo={handleDeleteTodo}
              onAssignTodo={handleAssignTodo}
              onToggleAssignmentStatus={toggleAssignmentStatus}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <AddGlobalTodoDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleSaveTodo}
        todo={editingTodo}
      />

      {/* Assign Dialog */}
      <AssignTodoDialog
        open={!!assigningTodo}
        onClose={() => setAssigningTodo(null)}
        todo={assigningTodo}
        projects={projects}
        assignedProjectIds={assigningTodo ? getProjectIdsForTodo(assigningTodo.id) : []}
        onSave={handleSaveAssignment}
      />
    </div>
  )
}
