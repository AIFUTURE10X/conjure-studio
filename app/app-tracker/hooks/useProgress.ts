'use client'

import { useMemo } from 'react'
import type { Task, TestItem } from '../constants/types'

interface ProgressStats {
  buildProgress: number
  testProgress: number
  overallProgress: number
  taskBreakdown: { todo: number; in_progress: number; done: number }
  testBreakdown: { not_tested: number; in_progress: number; passed: number; failed: number }
}

/**
 * Calculate progress statistics for a set of tasks and test items
 */
export function useProgress(tasks: Task[], testItems: TestItem[]): ProgressStats {
  return useMemo(() => {
    // Task breakdown
    const taskBreakdown = {
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    }

    // Test breakdown
    const testBreakdown = {
      not_tested: testItems.filter(t => t.status === 'not_tested').length,
      in_progress: testItems.filter(t => t.status === 'in_progress').length,
      passed: testItems.filter(t => t.status === 'passed').length,
      failed: testItems.filter(t => t.status === 'failed').length,
    }

    // Build progress = Done tasks / Total tasks * 100
    const buildProgress = tasks.length > 0
      ? Math.round((taskBreakdown.done / tasks.length) * 100)
      : 0

    // Test progress = Passed tests / Total tests * 100
    const testProgress = testItems.length > 0
      ? Math.round((testBreakdown.passed / testItems.length) * 100)
      : 0

    // Overall = Average of both
    const overallProgress = Math.round((buildProgress + testProgress) / 2)

    return {
      buildProgress,
      testProgress,
      overallProgress,
      taskBreakdown,
      testBreakdown,
    }
  }, [tasks, testItems])
}

/**
 * Calculate progress for a specific feature
 */
export function calculateFeatureProgress(
  tasks: Task[],
  testItems: TestItem[],
  featureId: string
): { buildProgress: number; testProgress: number; taskCount: number; testCount: number } {
  const featureTasks = tasks.filter(t => t.feature_id === featureId)
  const featureTests = testItems.filter(t => t.feature_id === featureId)

  const doneTasks = featureTasks.filter(t => t.status === 'done').length
  const passedTests = featureTests.filter(t => t.status === 'passed').length

  return {
    buildProgress: featureTasks.length > 0 ? Math.round((doneTasks / featureTasks.length) * 100) : 0,
    testProgress: featureTests.length > 0 ? Math.round((passedTests / featureTests.length) * 100) : 0,
    taskCount: featureTasks.length,
    testCount: featureTests.length,
  }
}

/**
 * Calculate progress for an entire project (all its features combined)
 */
export function calculateProjectProgress(
  tasks: Task[],
  testItems: TestItem[],
  projectId: string
): { buildProgress: number; testProgress: number; overallProgress: number; taskCount: number; testCount: number } {
  const projectTasks = tasks.filter(t => t.project_id === projectId)
  const projectTests = testItems.filter(t => t.project_id === projectId)

  const doneTasks = projectTasks.filter(t => t.status === 'done').length
  const passedTests = projectTests.filter(t => t.status === 'passed').length

  const buildProgress = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0
  const testProgress = projectTests.length > 0 ? Math.round((passedTests / projectTests.length) * 100) : 0

  return {
    buildProgress,
    testProgress,
    overallProgress: Math.round((buildProgress + testProgress) / 2),
    taskCount: projectTasks.length,
    testCount: projectTests.length,
  }
}
