'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Task, TaskFilters, TaskStatus, Priority } from '../constants/types'
import { STORAGE_KEYS } from '../constants/types'
import { getFromStorage, saveToStorage } from '../utils/storage'
import { createTaskId } from '../utils/id'

const DEFAULT_FILTERS: TaskFilters = {
  status: 'all',
  priority: 'all',
  search: '',
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(true)

  // Load tasks from localStorage on mount
  useEffect(() => {
    const stored = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, [])
    setTasks(stored)
    setIsLoading(false)
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.TASKS, tasks)
    }
  }, [tasks, isLoading])

  const getTasksByFeature = useCallback((featureId: string): Task[] => {
    return tasks.filter(t => t.feature_id === featureId)
  }, [tasks])

  const getFilteredTasks = useCallback((featureId: string): Task[] => {
    return tasks.filter(task => {
      if (task.feature_id !== featureId) return false
      if (filters.status !== 'all' && task.status !== filters.status) return false
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  }, [tasks, filters])

  const createTask = useCallback((
    projectId: string,
    featureId: string,
    title: string,
    description: string = '',
    priority: Priority = 'medium'
  ): Task => {
    const now = Date.now()
    const newTask: Task = {
      id: createTaskId(),
      project_id: projectId,
      feature_id: featureId,
      title,
      description,
      status: 'todo' as TaskStatus,
      priority,
      created_at: now,
      updated_at: now,
    }
    setTasks(prev => [...prev, newTask])
    return newTask
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id' | 'project_id' | 'feature_id' | 'created_at'>>) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, ...updates, updated_at: Date.now() } : task
      )
    )
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }, [])

  const deleteTasksByFeature = useCallback((featureId: string) => {
    setTasks(prev => prev.filter(t => t.feature_id !== featureId))
  }, [])

  const deleteTasksByProject = useCallback((projectId: string) => {
    setTasks(prev => prev.filter(t => t.project_id !== projectId))
  }, [])

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== id) return task
        const nextStatus: TaskStatus =
          task.status === 'todo' ? 'in_progress' :
          task.status === 'in_progress' ? 'done' : 'todo'
        return { ...task, status: nextStatus, updated_at: Date.now() }
      })
    )
  }, [])

  const setAllTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  return {
    tasks,
    filters,
    setFilters,
    resetFilters,
    isLoading,
    getTasksByFeature,
    getFilteredTasks,
    createTask,
    updateTask,
    deleteTask,
    deleteTasksByFeature,
    deleteTasksByProject,
    toggleTaskStatus,
    setAllTasks,
  }
}
