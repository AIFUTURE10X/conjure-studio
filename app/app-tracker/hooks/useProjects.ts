'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Project } from '../constants/types'
import { STORAGE_KEYS } from '../constants/types'
import { getFromStorage, saveToStorage } from '../utils/storage'
import { createProjectId } from '../utils/id'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load projects from localStorage on mount
  useEffect(() => {
    const stored = getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, [])
    setProjects(stored)
    setIsLoading(false)
  }, [])

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.PROJECTS, projects)
    }
  }, [projects, isLoading])

  const createProject = useCallback((name: string, description: string, icon: string = '📱'): Project => {
    const now = Date.now()
    const newProject: Project = {
      id: createProjectId(),
      name,
      description,
      icon,
      created_at: now,
      updated_at: now,
    }
    setProjects(prev => [...prev, newProject])
    return newProject
  }, [])

  const updateProject = useCallback((id: string, updates: Partial<Omit<Project, 'id' | 'created_at'>>) => {
    setProjects(prev =>
      prev.map(project =>
        project.id === id
          ? { ...project, ...updates, updated_at: Date.now() }
          : project
      )
    )
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id))
  }, [])

  const getProjectById = useCallback((id: string): Project | undefined => {
    return projects.find(p => p.id === id)
  }, [projects])

  const setAllProjects = useCallback((newProjects: Project[]) => {
    setProjects(newProjects)
  }, [])

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    setAllProjects,
  }
}
