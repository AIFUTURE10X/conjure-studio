'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { GlobalTodo, GlobalTodoFilters, GlobalTodoCategory, Priority } from '../constants/types'
import { STORAGE_KEYS } from '../constants/types'
import { getFromStorage, saveToStorage } from '../utils/storage'
import { createGlobalTodoId } from '../utils/id'
import { DEFAULT_GLOBAL_TODO_FILTERS } from '../constants/global-todo-defaults'

export function useGlobalTodos() {
  const [globalTodos, setGlobalTodos] = useState<GlobalTodo[]>([])
  const [filters, setFilters] = useState<GlobalTodoFilters>(DEFAULT_GLOBAL_TODO_FILTERS)
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = getFromStorage<GlobalTodo[]>(STORAGE_KEYS.GLOBAL_TODOS, [])
    setGlobalTodos(stored)
    setIsLoading(false)
  }, [])

  // Save to localStorage when changed
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.GLOBAL_TODOS, globalTodos)
    }
  }, [globalTodos, isLoading])

  const createGlobalTodo = useCallback((
    title: string,
    description: string = '',
    category: GlobalTodoCategory = 'other',
    priority: Priority = 'medium',
    applyToAll: boolean = false
  ): GlobalTodo => {
    const now = Date.now()
    const newTodo: GlobalTodo = {
      id: createGlobalTodoId(),
      title,
      description,
      category,
      priority,
      apply_to_all: applyToAll,
      created_at: now,
      updated_at: now,
    }
    setGlobalTodos(prev => [...prev, newTodo])
    return newTodo
  }, [])

  const updateGlobalTodo = useCallback((
    id: string,
    updates: Partial<Omit<GlobalTodo, 'id' | 'created_at'>>
  ) => {
    setGlobalTodos(prev =>
      prev.map(todo =>
        todo.id === id
          ? { ...todo, ...updates, updated_at: Date.now() }
          : todo
      )
    )
  }, [])

  const deleteGlobalTodo = useCallback((id: string) => {
    setGlobalTodos(prev => prev.filter(todo => todo.id !== id))
  }, [])

  const getGlobalTodoById = useCallback((id: string): GlobalTodo | undefined => {
    return globalTodos.find(t => t.id === id)
  }, [globalTodos])

  // Get todos that should apply to all projects
  const applyToAllTodos = useMemo(() => {
    return globalTodos.filter(t => t.apply_to_all)
  }, [globalTodos])

  // Get todos by category
  const getTodosByCategory = useCallback((category: GlobalTodoCategory): GlobalTodo[] => {
    return globalTodos.filter(t => t.category === category)
  }, [globalTodos])

  // Get categories that have todos
  const categoriesWithTodos = useMemo((): GlobalTodoCategory[] => {
    const cats = new Set<GlobalTodoCategory>()
    globalTodos.forEach(t => cats.add(t.category))
    return Array.from(cats)
  }, [globalTodos])

  // Filtered todos based on current filters
  const filteredTodos = useMemo((): GlobalTodo[] => {
    return globalTodos.filter(todo => {
      if (filters.priority !== 'all' && todo.priority !== filters.priority) return false
      if (filters.category !== 'all' && todo.category !== filters.category) return false
      if (filters.search && !todo.title.toLowerCase().includes(filters.search.toLowerCase())) {
        // Also search description
        if (!todo.description.toLowerCase().includes(filters.search.toLowerCase())) {
          return false
        }
      }
      return true
    })
  }, [globalTodos, filters])

  // Group filtered todos by category
  const todosByCategory = useMemo((): Record<GlobalTodoCategory, GlobalTodo[]> => {
    const grouped: Record<string, GlobalTodo[]> = {}
    filteredTodos.forEach(todo => {
      if (!grouped[todo.category]) {
        grouped[todo.category] = []
      }
      grouped[todo.category].push(todo)
    })
    return grouped as Record<GlobalTodoCategory, GlobalTodo[]>
  }, [filteredTodos])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_GLOBAL_TODO_FILTERS)
  }, [])

  const setAllGlobalTodos = useCallback((todos: GlobalTodo[]) => {
    setGlobalTodos(todos)
  }, [])

  return {
    globalTodos,
    filteredTodos,
    todosByCategory,
    categoriesWithTodos,
    applyToAllTodos,
    filters,
    setFilters,
    resetFilters,
    isLoading,
    createGlobalTodo,
    updateGlobalTodo,
    deleteGlobalTodo,
    getGlobalTodoById,
    getTodosByCategory,
    setAllGlobalTodos,
  }
}
