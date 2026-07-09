'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { GlobalTodo, GlobalTodoCategory, Priority } from '../../constants/types'
import { GLOBAL_TODO_CATEGORIES } from '../../constants/global-todo-defaults'
import { PRIORITY_OPTIONS } from '../../constants/status-options'

interface AddGlobalTodoDialogProps {
  open: boolean
  onClose: () => void
  onSave: (
    title: string,
    description: string,
    category: GlobalTodoCategory,
    priority: Priority,
    applyToAll: boolean
  ) => void
  todo?: GlobalTodo // If provided, we're editing
}

export function AddGlobalTodoDialog({
  open,
  onClose,
  onSave,
  todo,
}: AddGlobalTodoDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GlobalTodoCategory>('other')
  const [priority, setPriority] = useState<Priority>('medium')
  const [applyToAll, setApplyToAll] = useState(false)

  const isEditing = !!todo

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description)
      setCategory(todo.category)
      setPriority(todo.priority)
      setApplyToAll(todo.apply_to_all)
    } else {
      setTitle('')
      setDescription('')
      setCategory('other')
      setPriority('medium')
      setApplyToAll(false)
    }
  }, [todo, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave(title.trim(), description.trim(), category, priority, applyToAll)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Edit Global Todo' : 'Add Global Todo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Title</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Setup OAuth authentication"
              className="bg-zinc-800 border-zinc-700 text-white"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Description</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details about this todo..."
              className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as GlobalTodoCategory)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white focus:outline-none focus:border-[#c99850]"
            >
              {GLOBAL_TODO_CATEGORIES.map(cat => (
                <option key={cat.key} value={cat.key}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Priority</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    priority === option.value
                      ? `${option.bg} ${option.color} border border-current`
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={e => setApplyToAll(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-[#c99850] focus:ring-[#c99850] focus:ring-offset-zinc-900"
              />
              <div>
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                  Apply to all projects
                </span>
                <p className="text-xs text-zinc-500">
                  Automatically assign to all current and future projects
                </p>
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              className="bg-[#c99850] hover:bg-[#dbb56e] text-black"
            >
              {isEditing ? 'Save Changes' : 'Add Todo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
