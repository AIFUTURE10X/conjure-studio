'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { GlobalTodoAssignment, TaskStatus } from '../constants/types'
import { STORAGE_KEYS } from '../constants/types'
import { getFromStorage, saveToStorage } from '../utils/storage'
import { createGlobalTodoAssignmentId } from '../utils/id'

export function useGlobalTodoAssignments() {
  const [assignments, setAssignments] = useState<GlobalTodoAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = getFromStorage<GlobalTodoAssignment[]>(
      STORAGE_KEYS.GLOBAL_TODO_ASSIGNMENTS,
      []
    )
    setAssignments(stored)
    setIsLoading(false)
  }, [])

  // Save to localStorage when changed
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.GLOBAL_TODO_ASSIGNMENTS, assignments)
    }
  }, [assignments, isLoading])

  // Create assignment (link todo to project)
  const assignToProject = useCallback((
    globalTodoId: string,
    projectId: string
  ): GlobalTodoAssignment | null => {
    // Check if already assigned
    const existing = assignments.find(
      a => a.global_todo_id === globalTodoId && a.project_id === projectId
    )
    if (existing) return existing

    const now = Date.now()
    const newAssignment: GlobalTodoAssignment = {
      id: createGlobalTodoAssignmentId(),
      global_todo_id: globalTodoId,
      project_id: projectId,
      status: 'todo',
      notes: '',
      assigned_at: now,
      completed_at: null,
    }
    setAssignments(prev => [...prev, newAssignment])
    return newAssignment
  }, [assignments])

  // Assign todo to multiple projects at once
  const assignToProjects = useCallback((
    globalTodoId: string,
    projectIds: string[]
  ) => {
    const now = Date.now()
    const newAssignments = projectIds
      .filter(projectId =>
        !assignments.some(
          a => a.global_todo_id === globalTodoId && a.project_id === projectId
        )
      )
      .map(projectId => ({
        id: createGlobalTodoAssignmentId(),
        global_todo_id: globalTodoId,
        project_id: projectId,
        status: 'todo' as TaskStatus,
        notes: '',
        assigned_at: now,
        completed_at: null,
      }))

    if (newAssignments.length > 0) {
      setAssignments(prev => [...prev, ...newAssignments])
    }
  }, [assignments])

  // Remove assignment
  const unassignFromProject = useCallback((
    globalTodoId: string,
    projectId: string
  ) => {
    setAssignments(prev =>
      prev.filter(a =>
        !(a.global_todo_id === globalTodoId && a.project_id === projectId)
      )
    )
  }, [])

  // Update assignment status (per-project progress)
  const updateAssignmentStatus = useCallback((
    assignmentId: string,
    status: TaskStatus
  ) => {
    setAssignments(prev =>
      prev.map(a =>
        a.id === assignmentId
          ? {
              ...a,
              status,
              completed_at: status === 'done' ? Date.now() : null,
            }
          : a
      )
    )
  }, [])

  // Toggle assignment status cycle: todo -> in_progress -> done -> todo
  const toggleAssignmentStatus = useCallback((assignmentId: string) => {
    setAssignments(prev =>
      prev.map(a => {
        if (a.id !== assignmentId) return a
        const nextStatus: TaskStatus =
          a.status === 'todo' ? 'in_progress' :
          a.status === 'in_progress' ? 'done' : 'todo'
        return {
          ...a,
          status: nextStatus,
          completed_at: nextStatus === 'done' ? Date.now() : null,
        }
      })
    )
  }, [])

  // Update assignment notes
  const updateAssignmentNotes = useCallback((
    assignmentId: string,
    notes: string
  ) => {
    setAssignments(prev =>
      prev.map(a =>
        a.id === assignmentId ? { ...a, notes } : a
      )
    )
  }, [])

  // Get assignments for a specific project
  const getAssignmentsByProject = useCallback((projectId: string): GlobalTodoAssignment[] => {
    return assignments.filter(a => a.project_id === projectId)
  }, [assignments])

  // Get assignments for a specific global todo
  const getAssignmentsByTodo = useCallback((globalTodoId: string): GlobalTodoAssignment[] => {
    return assignments.filter(a => a.global_todo_id === globalTodoId)
  }, [assignments])

  // Get assignment for specific todo and project
  const getAssignment = useCallback((
    globalTodoId: string,
    projectId: string
  ): GlobalTodoAssignment | undefined => {
    return assignments.find(
      a => a.global_todo_id === globalTodoId && a.project_id === projectId
    )
  }, [assignments])

  // Check if a todo is assigned to a project
  const isAssigned = useCallback((
    globalTodoId: string,
    projectId: string
  ): boolean => {
    return assignments.some(
      a => a.global_todo_id === globalTodoId && a.project_id === projectId
    )
  }, [assignments])

  // Get project IDs that have a specific todo assigned
  const getProjectIdsForTodo = useCallback((globalTodoId: string): string[] => {
    return assignments
      .filter(a => a.global_todo_id === globalTodoId)
      .map(a => a.project_id)
  }, [assignments])

  // Delete all assignments for a todo (when todo is deleted)
  const deleteAssignmentsByTodo = useCallback((globalTodoId: string) => {
    setAssignments(prev => prev.filter(a => a.global_todo_id !== globalTodoId))
  }, [])

  // Delete all assignments for a project (when project is deleted)
  const deleteAssignmentsByProject = useCallback((projectId: string) => {
    setAssignments(prev => prev.filter(a => a.project_id !== projectId))
  }, [])

  // Count assignments by status for a specific todo
  const getStatusCountsForTodo = useCallback((globalTodoId: string): Record<TaskStatus, number> => {
    const todoAssignments = assignments.filter(a => a.global_todo_id === globalTodoId)
    return {
      todo: todoAssignments.filter(a => a.status === 'todo').length,
      in_progress: todoAssignments.filter(a => a.status === 'in_progress').length,
      done: todoAssignments.filter(a => a.status === 'done').length,
    }
  }, [assignments])

  const setAllAssignments = useCallback((newAssignments: GlobalTodoAssignment[]) => {
    setAssignments(newAssignments)
  }, [])

  return {
    assignments,
    isLoading,
    assignToProject,
    assignToProjects,
    unassignFromProject,
    updateAssignmentStatus,
    toggleAssignmentStatus,
    updateAssignmentNotes,
    getAssignmentsByProject,
    getAssignmentsByTodo,
    getAssignment,
    isAssigned,
    getProjectIdsForTodo,
    deleteAssignmentsByTodo,
    deleteAssignmentsByProject,
    getStatusCountsForTodo,
    setAllAssignments,
  }
}
