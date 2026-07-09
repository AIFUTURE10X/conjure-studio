// ID generation utilities for App Tracker

/**
 * Generate a unique ID with a prefix
 * Format: prefix_timestamp-randomstring
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}_${timestamp}-${random}`
}

// Specific ID generators for each entity type
export const createProjectId = () => generateId('proj')
export const createFeatureId = () => generateId('feat')
export const createTaskId = () => generateId('task')
export const createTestId = () => generateId('test')
export const createTemplateId = () => generateId('tmpl')
export const createGlobalTodoId = () => generateId('gtodo')
export const createGlobalTodoAssignmentId = () => generateId('assign')
