"use client"

interface OptionButtonProps {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}

export function OptionButton({ selected, onClick, children, className = '' }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border transition-colors ${
        selected
          ? 'border-purple-500 bg-purple-500/20 text-white'
          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
      } ${className}`}
    >
      {children}
    </button>
  )
}

interface OptionButtonSmallProps {
  selected: boolean
  onClick: () => void
  label: string
}

export function OptionButtonSmall({ selected, onClick, label }: OptionButtonSmallProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
        selected
          ? 'border-purple-500 bg-purple-500/20 text-white'
          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
      }`}
    >
      {label}
    </button>
  )
}

interface ToggleSwitchProps {
  enabled: boolean
  onChange: () => void
  label: string
  description?: string
}

export function ToggleSwitch({ enabled, onChange, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onChange}
        className={`w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-purple-600' : 'bg-zinc-700'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
      <div>
        <span className="text-sm text-zinc-300">{label}</span>
        {description && <p className="text-xs text-zinc-500">{description}</p>}
      </div>
    </div>
  )
}
