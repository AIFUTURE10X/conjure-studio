"use client"

import { useState, useEffect } from 'react'

interface NeonStatusBadgeProps {
  endpoint: string
}

type ConnectionStatus = 'checking' | 'connected' | 'disconnected'

export function NeonStatusBadge({ endpoint }: NeonStatusBadgeProps) {
  const [status, setStatus] = useState<ConnectionStatus>('checking')

  useEffect(() => {
    checkConnection()
  }, [endpoint])

  const checkConnection = async () => {
    setStatus('checking')
    try {
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        // Check if the response indicates success
        if (data.status === 'healthy' || data.success || response.status === 200) {
          setStatus('connected')
        } else {
          setStatus('disconnected')
        }
      } else {
        setStatus('disconnected')
      }
    } catch (error) {
      console.error('[v0] Neon connection check failed:', error)
      setStatus('disconnected')
    }
  }

  return (
    <button
      onClick={checkConnection}
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer"
      title={status === 'connected' ? 'Connected to Neon database' : status === 'checking' ? 'Checking connection...' : 'Neon database offline - Click to retry'}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          status === 'checking'
            ? 'bg-yellow-500 animate-pulse'
            : status === 'connected'
            ? 'bg-green-500'
            : 'bg-red-500'
        }`}
      />
      <span className="text-xs text-zinc-400">Neon</span>
    </button>
  )
}
