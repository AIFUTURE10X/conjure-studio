'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { GlobalTodo, Project } from '../../constants/types'

interface AssignTodoDialogProps {
  open: boolean
  onClose: () => void
  todo: GlobalTodo | null
  projects: Project[]
  assignedProjectIds: string[]
  onSave: (todoId: string, projectIds: string[], applyToAll: boolean) => void
}

export function AssignTodoDialog({
  open,
  onClose,
  todo,
  projects,
  assignedProjectIds,
  onSave,
}: AssignTodoDialogProps) {
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [applyToAll, setApplyToAll] = useState(false)

  useEffect(() => {
    if (open && todo) {
      setSelectedProjectIds(assignedProjectIds)
      setApplyToAll(todo.apply_to_all)
    }
  }, [open, todo, assignedProjectIds])

  const handleToggleProject = (projectId: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProjectIds.length === projects.length) {
      setSelectedProjectIds([])
    } else {
      setSelectedProjectIds(projects.map(p => p.id))
    }
  }

  const handleSubmit = () => {
    if (!todo) return
    onSave(todo.id, applyToAll ? projects.map(p => p.id) : selectedProjectIds, applyToAll)
    onClose()
  }

  if (!todo) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Assign to Projects</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Todo being assigned */}
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <p className="text-sm font-medium text-white">{todo.title}</p>
            {todo.description && (
              <p className="text-xs text-zinc-400 mt-1">{todo.description}</p>
            )}
          </div>

          {/* Apply to all toggle */}
          <label className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg cursor-pointer group border border-zinc-700 hover:border-[#c99850]/50 transition-colors">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={e => setApplyToAll(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-[#c99850] focus:ring-[#c99850] focus:ring-offset-zinc-900"
            />
            <div>
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                Apply to ALL projects
              </span>
              <p className="text-xs text-zinc-500">
                Includes future projects automatically
              </p>
            </div>
          </label>

          {/* Divider */}
          {!applyToAll && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-zinc-900 px-2 text-zinc-500">or select specific projects</span>
                </div>
              </div>

              {/* Project list */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {/* Select all button */}
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-[#c99850] hover:text-[#dbb56e] mb-2"
                >
                  {selectedProjectIds.length === projects.length ? 'Deselect all' : 'Select all'}
                </button>

                {projects.map(project => (
                  <label
                    key={project.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                      selectedProjectIds.includes(project.id)
                        ? 'bg-[#c99850]/10 border-[#c99850]/50'
                        : 'bg-zinc-800/30 border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={() => handleToggleProject(project.id)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-[#c99850] focus:ring-[#c99850] focus:ring-offset-zinc-900"
                    />
                    <span className="text-lg">{project.icon}</span>
                    <span className="text-sm text-zinc-300">{project.name}</span>
                    {assignedProjectIds.includes(project.id) && (
                      <span className="ml-auto text-xs text-zinc-500">assigned</span>
                    )}
                  </label>
                ))}

                {projects.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">
                    No projects yet. Create a project first.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!applyToAll && selectedProjectIds.length === 0}
            className="bg-[#c99850] hover:bg-[#dbb56e] text-black"
          >
            Save Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
