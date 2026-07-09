"use client"

/**
 * AddCustomProductModal Component
 *
 * Modal for adding custom product mockups with category selection.
 * User can name their product, choose a category, and upload an image.
 */

import { useState, useRef } from 'react'
import { X, Upload, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MOCKUP_CATEGORIES } from './categories'

export interface CustomProduct {
  id: string
  categoryId: string
  name: string
  imageUrl: string // Base64 data URL
}

interface AddCustomProductModalProps {
  onClose: () => void
  onAdd: (product: Omit<CustomProduct, 'id'>) => void
  defaultCategory?: string
}

export function AddCustomProductModal({
  onClose,
  onAdd,
  defaultCategory = 'apparel',
}: AddCustomProductModalProps) {
  const [categoryId, setCategoryId] = useState(defaultCategory)
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      processFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    // Convert to base64 for localStorage persistence
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImageUrl(dataUrl)
      setError(null)
    }
    reader.onerror = () => {
      setError('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter a product name')
      return
    }
    if (!imageUrl) {
      setError('Please upload a product image')
      return
    }

    onAdd({
      categoryId,
      name: name.trim(),
      imageUrl,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-zinc-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Add Custom Product</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-purple-500"
            >
              {MOCKUP_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Product Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tank Top, Beanie, Laptop Sleeve"
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Product Image</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative w-full aspect-video rounded-lg border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
                isDragging
                  ? 'border-purple-500 bg-purple-500/10'
                  : imageUrl
                  ? 'border-zinc-600 bg-zinc-800'
                  : 'border-zinc-600 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800'
              }`}
            >
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm">Click to change</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    isDragging ? 'bg-purple-500/20' : 'bg-zinc-700/50'
                  }`}>
                    {isDragging ? (
                      <ImageIcon className="w-6 h-6 text-purple-400" />
                    ) : (
                      <Upload className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>
                  <p className={`text-sm font-medium ${isDragging ? 'text-purple-400' : 'text-zinc-400'}`}>
                    {isDragging ? 'Drop image here' : 'Drag & drop or click'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">PNG, JPG, WebP</p>
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-zinc-800">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-500 text-white"
          >
            Add Product
          </Button>
        </div>
      </Card>
    </div>
  )
}
