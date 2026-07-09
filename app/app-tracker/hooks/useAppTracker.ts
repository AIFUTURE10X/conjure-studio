'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProjects } from './useProjects'
import { useFeatures } from './useFeatures'
import { useTasks } from './useTasks'
import { useTestItems } from './useTestItems'
import { STORAGE_KEYS, type ActiveView } from '../constants/types'
import { getFromStorage, saveToStorage, existsInStorage } from '../utils/storage'
import { getDefaultData } from '../constants/default-data'

export function useAppTracker() {
  const projects = useProjects()
  const features = useFeatures()
  const tasks = useTasks()
  const testItems = useTestItems()

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('tests')
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize with default data on first load
  useEffect(() => {
    if (projects.isLoading || features.isLoading || tasks.isLoading || testItems.isLoading) {
      return
    }

    const wasInitialized = existsInStorage(STORAGE_KEYS.INITIALIZED)

    if (!wasInitialized && projects.projects.length === 0) {
      // First time user - load default data
      const defaultData = getDefaultData()
      projects.setAllProjects(defaultData.projects)
      features.setAllFeatures(defaultData.features)
      tasks.setAllTasks(defaultData.tasks)
      testItems.setAllTestItems(defaultData.testItems)
      saveToStorage(STORAGE_KEYS.INITIALIZED, true)

      // Set first project as active
      if (defaultData.projects.length > 0) {
        setActiveProjectId(defaultData.projects[0].id)
        const firstProjectFeatures = defaultData.features.filter(
          f => f.project_id === defaultData.projects[0].id
        )
        if (firstProjectFeatures.length > 0) {
          setActiveFeatureId(firstProjectFeatures[0].id)
        }
      }
    } else {
      // Restore previous selection
      const savedProjectId = getFromStorage<string | null>(STORAGE_KEYS.ACTIVE_PROJECT, null)
      const savedFeatureId = getFromStorage<string | null>(STORAGE_KEYS.ACTIVE_FEATURE, null)

      if (savedProjectId && projects.projects.some(p => p.id === savedProjectId)) {
        setActiveProjectId(savedProjectId)
      } else if (projects.projects.length > 0) {
        setActiveProjectId(projects.projects[0].id)
      }

      if (savedFeatureId && features.features.some(f => f.id === savedFeatureId)) {
        setActiveFeatureId(savedFeatureId)
      }
    }

    setIsInitialized(true)
  }, [projects.isLoading, features.isLoading, tasks.isLoading, testItems.isLoading])

  // Auto-select first feature when project changes
  useEffect(() => {
    if (!activeProjectId || !isInitialized) return

    const projectFeatures = features.getFeaturesByProject(activeProjectId)
    if (projectFeatures.length > 0) {
      const currentFeatureInProject = projectFeatures.find(f => f.id === activeFeatureId)
      if (!currentFeatureInProject) {
        setActiveFeatureId(projectFeatures[0].id)
      }
    } else {
      setActiveFeatureId(null)
    }
  }, [activeProjectId, features.features, isInitialized])

  // Persist active selections
  useEffect(() => {
    if (isInitialized) {
      saveToStorage(STORAGE_KEYS.ACTIVE_PROJECT, activeProjectId)
      saveToStorage(STORAGE_KEYS.ACTIVE_FEATURE, activeFeatureId)
    }
  }, [activeProjectId, activeFeatureId, isInitialized])

  // Delete project and cascade to features, tasks, tests
  const deleteProjectCascade = useCallback((projectId: string) => {
    features.deleteFeaturesByProject(projectId)
    tasks.deleteTasksByProject(projectId)
    testItems.deleteTestsByProject(projectId)
    projects.deleteProject(projectId)

    // If deleted project was active, select another
    if (activeProjectId === projectId) {
      const remaining = projects.projects.filter(p => p.id !== projectId)
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null)
    }
  }, [activeProjectId, projects, features, tasks, testItems])

  // Delete feature and cascade to tasks, tests
  const deleteFeatureCascade = useCallback((featureId: string) => {
    tasks.deleteTasksByFeature(featureId)
    testItems.deleteTestsByFeature(featureId)
    features.deleteFeature(featureId)

    // If deleted feature was active, select another in same project
    if (activeFeatureId === featureId && activeProjectId) {
      const remaining = features.getFeaturesByProject(activeProjectId).filter(f => f.id !== featureId)
      setActiveFeatureId(remaining.length > 0 ? remaining[0].id : null)
    }
  }, [activeFeatureId, activeProjectId, features, tasks, testItems])

  // Reset all data to defaults
  const resetToDefaults = useCallback(() => {
    const defaultData = getDefaultData()
    projects.setAllProjects(defaultData.projects)
    features.setAllFeatures(defaultData.features)
    tasks.setAllTasks(defaultData.tasks)
    testItems.setAllTestItems(defaultData.testItems)

    // Set first project as active
    if (defaultData.projects.length > 0) {
      setActiveProjectId(defaultData.projects[0].id)
      const firstProjectFeatures = defaultData.features.filter(
        f => f.project_id === defaultData.projects[0].id
      )
      if (firstProjectFeatures.length > 0) {
        setActiveFeatureId(firstProjectFeatures[0].id)
      }
    }
  }, [projects, features, tasks, testItems])

  const isLoading = projects.isLoading || features.isLoading || tasks.isLoading || testItems.isLoading

  return {
    // State
    activeProjectId,
    activeFeatureId,
    activeView,
    isInitialized,
    isLoading,

    // Setters
    setActiveProjectId,
    setActiveFeatureId,
    setActiveView,

    // Projects
    projects: projects.projects,
    createProject: projects.createProject,
    updateProject: projects.updateProject,
    deleteProject: deleteProjectCascade,
    getProjectById: projects.getProjectById,

    // Features
    features: features.features,
    getFeaturesByProject: features.getFeaturesByProject,
    createFeature: features.createFeature,
    updateFeature: features.updateFeature,
    deleteFeature: deleteFeatureCascade,
    getFeatureById: features.getFeatureById,

    // Tasks
    tasks: tasks.tasks,
    taskFilters: tasks.filters,
    setTaskFilters: tasks.setFilters,
    getTasksByFeature: tasks.getTasksByFeature,
    getFilteredTasks: tasks.getFilteredTasks,
    createTask: tasks.createTask,
    updateTask: tasks.updateTask,
    deleteTask: tasks.deleteTask,
    toggleTaskStatus: tasks.toggleTaskStatus,

    // Test Items
    testItems: testItems.testItems,
    testFilters: testItems.filters,
    setTestFilters: testItems.setFilters,
    getTestsByFeature: testItems.getTestsByFeature,
    getFilteredTests: testItems.getFilteredTests,
    createTestItem: testItems.createTestItem,
    updateTestItem: testItems.updateTestItem,
    deleteTestItem: testItems.deleteTestItem,
    setTestStatus: testItems.setTestStatus,

    // Utility
    resetToDefaults,
  }
}
