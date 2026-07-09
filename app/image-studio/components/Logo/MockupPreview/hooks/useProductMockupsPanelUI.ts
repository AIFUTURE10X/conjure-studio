"use client"

/**
 * useProductMockupsPanelUI Hook
 *
 * Manages UI state for ProductMockupsPanel dropdowns, modals, and keyboard handlers.
 * Extracted to keep ProductMockupsPanel.tsx under 300 lines.
 */

import { useState, useRef, useEffect, RefObject } from 'react'

interface UseProductMockupsPanelUIProps {
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  mockupControls: { setCanvasZoom?: (zoom: number) => void } | null
}

export interface ProductMockupsPanelUIState {
  // Dropdown states
  showSavedMockupsDropdown: boolean
  setShowSavedMockupsDropdown: (show: boolean) => void
  showSavePresetModal: boolean
  setShowSavePresetModal: (show: boolean) => void
  showHistoryDropdown: boolean
  setShowHistoryDropdown: (show: boolean) => void
  // Preset name
  presetName: string
  setPresetName: (name: string) => void
  // Refs
  dropdownRef: RefObject<HTMLDivElement | null>
  historyDropdownRef: RefObject<HTMLDivElement | null>
  historyRefreshRef: RefObject<(() => void) | null>
  presetInputRef: RefObject<HTMLInputElement | null>
  // Actions
  openSavePresetModal: (defaultName: string) => void
}

export function useProductMockupsPanelUI({
  isExpanded,
  setIsExpanded,
  mockupControls
}: UseProductMockupsPanelUIProps): ProductMockupsPanelUIState {
  const [showSavedMockupsDropdown, setShowSavedMockupsDropdown] = useState(false)
  const [showSavePresetModal, setShowSavePresetModal] = useState(false)
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)
  const [presetName, setPresetName] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)
  const historyDropdownRef = useRef<HTMLDivElement>(null)
  const historyRefreshRef = useRef<(() => void) | null>(null)
  const presetInputRef = useRef<HTMLInputElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSavedMockupsDropdown(false)
      }
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(event.target as Node)) {
        setShowHistoryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ESC key handler for fullscreen exit
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isExpanded, setIsExpanded])

  // Reset zoom to 100% when entering expanded view
  useEffect(() => {
    if (isExpanded && mockupControls?.setCanvasZoom) {
      mockupControls.setCanvasZoom(1.0)
    }
  }, [isExpanded, mockupControls])

  // Helper to open save preset modal with default name
  const openSavePresetModal = (defaultName: string) => {
    setPresetName(defaultName)
    setShowSavePresetModal(true)
    setTimeout(() => presetInputRef.current?.focus(), 100)
  }

  return {
    showSavedMockupsDropdown,
    setShowSavedMockupsDropdown,
    showSavePresetModal,
    setShowSavePresetModal,
    showHistoryDropdown,
    setShowHistoryDropdown,
    presetName,
    setPresetName,
    dropdownRef,
    historyDropdownRef,
    historyRefreshRef,
    presetInputRef,
    openSavePresetModal
  }
}
