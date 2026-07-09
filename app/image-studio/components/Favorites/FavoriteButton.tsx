"use client"

import { useState } from 'react'
import { Heart, Check } from 'lucide-react'

interface FavoriteButtonProps {
  imageUrl: string
  isFavorite: boolean
  onToggle: () => void
  size?: 'sm' | 'lg'
}

export function FavoriteButton({ imageUrl, isFavorite, onToggle, size = 'sm' }: FavoriteButtonProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isToggling) return

    setIsToggling(true)
    try {
      await onToggle()
      if (!isFavorite) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 1500)
      }
    } finally {
      setTimeout(() => setIsToggling(false), 300)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        disabled={isToggling}
        className={`
          ${size === 'lg' ? 'p-3' : 'p-2'}
          rounded-full transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-[#c99850]
          ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}
          ${isFavorite ? 'bg-red-500 hover:bg-red-600 scale-100' : 'bg-white/90 hover:bg-white hover:scale-110'}
        `}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={`
            ${size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'}
            transition-all duration-300
            ${isFavorite ? 'fill-white text-white animate-heart-beat' : 'text-gray-800 hover:fill-gray-300'}
          `}
        />
      </button>

      {showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-success-pop">
          <div className="bg-green-500 rounded-full p-2 shadow-lg">
            <Check className="w-6 h-6 text-white stroke-3" />
          </div>
        </div>
      )}
    </div>
  )
}
