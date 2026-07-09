'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Feature } from '../constants/types'
import { STORAGE_KEYS } from '../constants/types'
import { getFromStorage, saveToStorage } from '../utils/storage'
import { createFeatureId } from '../utils/id'

export function useFeatures() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load features from localStorage on mount
  useEffect(() => {
    const stored = getFromStorage<Feature[]>(STORAGE_KEYS.FEATURES, [])
    setFeatures(stored)
    setIsLoading(false)
  }, [])

  // Save features to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.FEATURES, features)
    }
  }, [features, isLoading])

  const getFeaturesByProject = useCallback((projectId: string): Feature[] => {
    return features
      .filter(f => f.project_id === projectId)
      .sort((a, b) => a.order - b.order)
  }, [features])

  const createFeature = useCallback((
    projectId: string,
    name: string,
    description: string,
    icon: string = '⚡'
  ): Feature => {
    const projectFeatures = features.filter(f => f.project_id === projectId)
    const maxOrder = projectFeatures.length > 0
      ? Math.max(...projectFeatures.map(f => f.order))
      : -1

    const newFeature: Feature = {
      id: createFeatureId(),
      project_id: projectId,
      name,
      description,
      icon,
      order: maxOrder + 1,
      created_at: Date.now(),
    }
    setFeatures(prev => [...prev, newFeature])
    return newFeature
  }, [features])

  const updateFeature = useCallback((id: string, updates: Partial<Omit<Feature, 'id' | 'project_id' | 'created_at'>>) => {
    setFeatures(prev =>
      prev.map(feature =>
        feature.id === id ? { ...feature, ...updates } : feature
      )
    )
  }, [])

  const deleteFeature = useCallback((id: string) => {
    setFeatures(prev => prev.filter(feature => feature.id !== id))
  }, [])

  const deleteFeaturesByProject = useCallback((projectId: string) => {
    setFeatures(prev => prev.filter(f => f.project_id !== projectId))
  }, [])

  const getFeatureById = useCallback((id: string): Feature | undefined => {
    return features.find(f => f.id === id)
  }, [features])

  const reorderFeatures = useCallback((projectId: string, featureIds: string[]) => {
    setFeatures(prev =>
      prev.map(feature => {
        if (feature.project_id !== projectId) return feature
        const newOrder = featureIds.indexOf(feature.id)
        return newOrder >= 0 ? { ...feature, order: newOrder } : feature
      })
    )
  }, [])

  const setAllFeatures = useCallback((newFeatures: Feature[]) => {
    setFeatures(newFeatures)
  }, [])

  return {
    features,
    isLoading,
    getFeaturesByProject,
    createFeature,
    updateFeature,
    deleteFeature,
    deleteFeaturesByProject,
    getFeatureById,
    reorderFeatures,
    setAllFeatures,
  }
}
