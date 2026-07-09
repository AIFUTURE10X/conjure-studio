'use client'

import { Check } from 'lucide-react'

interface SettingRowProps {
  label: string
  description: string
  type: 'toggle' | 'select' | 'input'
  value: unknown
  options?: readonly { value: string; label: string }[]
  onChange: (value: unknown) => void
}

export function SettingRow({
  label,
  description,
  type,
  value,
  options,
  onChange,
}: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-zinc-600/50 transition-colors">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white">{label}</h4>
        <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
      </div>

      <div className="shrink-0">
        {type === 'toggle' && (
          <ToggleSwitch
            checked={value as boolean}
            onChange={(checked) => onChange(checked)}
          />
        )}

        {type === 'select' && options && (
          <SelectDropdown
            value={value as string}
            options={options}
            onChange={(val) => onChange(val)}
          />
        )}

        {type === 'input' && (
          <input
            type="text"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-[#dbb56e]"
          />
        )}
      </div>
    </div>
  )
}

// Custom Toggle Switch
function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-[#dbb56e]' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform flex items-center justify-center ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-[#dbb56e]" />}
      </span>
    </button>
  )
}

// Custom Select Dropdown
function SelectDropdown({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-[#dbb56e] cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
