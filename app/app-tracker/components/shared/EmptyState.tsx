'use client'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-lg font-medium text-zinc-200 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-400 mb-4 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  )
}
