'use client'

interface ProgressBarProps {
  value: number
  label?: string
  size?: 'sm' | 'md'
  color?: 'gold' | 'green' | 'blue'
}

export function ProgressBar({ value, label, size = 'md', color = 'gold' }: ProgressBarProps) {
  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2'

  const colorClasses = {
    gold: 'bg-[#c99850]',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
  }

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-zinc-400 mb-1">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      )}
      <div className={`w-full bg-zinc-700 rounded-full ${heightClass} overflow-hidden`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}
