'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TestItem, TestFilters, TestStatus, Priority, Platform } from '../constants/types'
import { STORAGE_KEYS } from '../constants/types'
import { getFromStorage, saveToStorage } from '../utils/storage'
import { createTestId } from '../utils/id'

const DEFAULT_FILTERS: TestFilters = {
  status: 'all',
  priority: 'all',
  platforms: [],
  search: '',
}

export function useTestItems() {
  const [testItems, setTestItems] = useState<TestItem[]>([])
  const [filters, setFilters] = useState<TestFilters>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(true)

  // Load test items from localStorage on mount
  useEffect(() => {
    const stored = getFromStorage<TestItem[]>(STORAGE_KEYS.TEST_ITEMS, [])
    setTestItems(stored)
    setIsLoading(false)
  }, [])

  // Save test items to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.TEST_ITEMS, testItems)
    }
  }, [testItems, isLoading])

  const getTestsByFeature = useCallback((featureId: string): TestItem[] => {
    return testItems.filter(t => t.feature_id === featureId)
  }, [testItems])

  const getFilteredTests = useCallback((featureId: string): TestItem[] => {
    return testItems.filter(item => {
      if (item.feature_id !== featureId) return false
      if (filters.status !== 'all' && item.status !== filters.status) return false
      if (filters.priority !== 'all' && item.priority !== filters.priority) return false
      if (filters.platforms.length > 0 && !filters.platforms.some(p => item.platforms.includes(p))) return false
      if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  }, [testItems, filters])

  const createTestItem = useCallback((
    projectId: string,
    featureId: string,
    title: string,
    steps: string = '',
    expectedResult: string = '',
    priority: Priority = 'medium',
    platforms: Platform[] = ['web'],
    category?: string
  ): TestItem => {
    const now = Date.now()
    const newItem: TestItem = {
      id: createTestId(),
      project_id: projectId,
      feature_id: featureId,
      title,
      steps,
      expected_result: expectedResult,
      status: 'not_tested' as TestStatus,
      priority,
      platforms,
      notes: '',
      category: category || undefined,
      created_at: now,
      updated_at: now,
    }
    setTestItems(prev => [...prev, newItem])
    return newItem
  }, [])

  const updateTestItem = useCallback((id: string, updates: Partial<Omit<TestItem, 'id' | 'project_id' | 'feature_id' | 'created_at'>>) => {
    setTestItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...updates, updated_at: Date.now() } : item
      )
    )
  }, [])

  const deleteTestItem = useCallback((id: string) => {
    setTestItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const deleteTestsByFeature = useCallback((featureId: string) => {
    setTestItems(prev => prev.filter(t => t.feature_id !== featureId))
  }, [])

  const deleteTestsByProject = useCallback((projectId: string) => {
    setTestItems(prev => prev.filter(t => t.project_id !== projectId))
  }, [])

  const setTestStatus = useCallback((id: string, status: TestStatus) => {
    setTestItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status, updated_at: Date.now() } : item
      )
    )
  }, [])

  const bulkSetStatus = useCallback((ids: string[], status: TestStatus) => {
    const now = Date.now()
    setTestItems(prev =>
      prev.map(item =>
        ids.includes(item.id) ? { ...item, status, updated_at: now } : item
      )
    )
  }, [])

  const setAllTestItems = useCallback((newItems: TestItem[]) => {
    setTestItems(newItems)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  return {
    testItems,
    filters,
    setFilters,
    resetFilters,
    isLoading,
    getTestsByFeature,
    getFilteredTests,
    createTestItem,
    updateTestItem,
    deleteTestItem,
    deleteTestsByFeature,
    deleteTestsByProject,
    setTestStatus,
    bulkSetStatus,
    setAllTestItems,
  }
}
