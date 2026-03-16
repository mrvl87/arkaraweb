"use client"

import { useState, useEffect } from 'react'

interface SlugInputProps {
  titleValue: string
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  disabled?: boolean
}

export function SlugInput({
  titleValue,
  value,
  onChange,
  label = "Slug (URL)",
  error,
  disabled = false
}: SlugInputProps) {
  const [isLocked, setIsLocked] = useState(true)

  // Auto-generate slug from title if locked and title changes
  useEffect(() => {
    if (isLocked && titleValue && titleValue.trim() !== '') {
      const generated = titleValue
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // remove non-alphanumeric except spaces and dashes
        .replace(/\s+/g, '-')     // replace spaces with dashes
        .replace(/-+/g, '-')      // replace multiple dashes with single dash
        .trim()
      
      if (generated !== value) {
        onChange(generated)
      }
    }
  }, [titleValue, isLocked, onChange, value])

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsLocked(!isLocked)}
          className="text-xs font-medium text-amber-600 hover:text-amber-700"
        >
          {isLocked ? "Edit Manual" : "Auto-Generate"}
        </button>
      </div>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isLocked}
          className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
            error 
              ? 'border-red-300 focus:ring-red-100 focus:border-red-500' 
              : 'border-gray-200 focus:ring-amber-100 focus:border-amber-500'
          } ${isLocked ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
          placeholder="judul-konten-anda"
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
