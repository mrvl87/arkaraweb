"use client"

import { useState, useEffect } from 'react'
import { normalizeSlug } from '@/lib/slugs'

interface SlugInputProps {
  titleValue: string
  value: string
  onChange: (value: string) => void
  mode?: 'create' | 'edit'
  modePreference?: 'auto' | 'manual'
  onModeChange?: (mode: 'auto' | 'manual') => void
  label?: string
  error?: string
  disabled?: boolean
}

export function SlugInput({
  titleValue,
  value,
  onChange,
  mode = 'create',
  modePreference,
  onModeChange,
  label = "Slug (URL)",
  error,
  disabled = false
}: SlugInputProps) {
  const [isAutoMode, setIsAutoMode] = useState(
    modePreference ? modePreference === 'auto' : mode === 'create'
  )

  useEffect(() => {
    if (!modePreference) return
    setIsAutoMode(modePreference === 'auto')
  }, [modePreference])

  const updateMode = (nextMode: boolean) => {
    setIsAutoMode(nextMode)
    onModeChange?.(nextMode ? 'auto' : 'manual')
  }

  // Auto-generate slug from title only while auto mode is active.
  useEffect(() => {
    if (isAutoMode && titleValue && titleValue.trim() !== '') {
      const generated = normalizeSlug(titleValue)

      if (generated !== value) {
        onChange(generated)
      }
    }
  }, [titleValue, isAutoMode, onChange, value])

  const handleToggleMode = () => {
    if (isAutoMode) {
      updateMode(false)
      return
    }

    updateMode(true)

    const generated = normalizeSlug(titleValue)
    if (generated && generated !== value) {
      onChange(generated)
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <button
          type="button"
          onClick={handleToggleMode}
          className="text-xs font-medium text-amber-600 hover:text-amber-700"
        >
          {isAutoMode ? "Edit Manual" : "Gunakan Judul"}
        </button>
      </div>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(normalizeSlug(e.target.value))}
          disabled={disabled || isAutoMode}
          className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
            error 
              ? 'border-red-300 focus:ring-red-100 focus:border-red-500' 
              : 'border-gray-200 focus:ring-amber-100 focus:border-amber-500'
          } ${isAutoMode ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
          placeholder="judul-konten-anda"
        />
      </div>
      <p className="text-[11px] text-gray-500">
        {isAutoMode
          ? 'Slug mengikuti judul sampai Anda pindah ke mode manual.'
          : 'Mode manual aktif. Slug tidak akan diubah otomatis dari judul.'}
      </p>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
