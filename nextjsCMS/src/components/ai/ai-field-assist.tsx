"use client"

/**
 * AIFieldAssist — Reusable AI action button that attaches to any form field.
 * Shows a generate button → calls AI → displays preview → user clicks Apply.
 * 
 * Usage:
 *   <AIFieldAssist
 *     operation="generate_slug"
 *     getInput={() => ({ title: currentTitle })}
 *     onApply={(data) => setValue('slug', data.slug)}
 *     renderPreview={(data) => <p>{data.slug}</p>}
 *   />
 */

import { useState, type ReactNode } from 'react'
import { Sparkles, Loader2, X, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface AIFieldAssistProps<TOutput> {
  /** Label shown on the button */
  label?: string
  /** Function that calls the server action and returns the result */
  generate: () => Promise<{ success: true; data: TOutput; model: string } | { success: false; error: string }>
  /** Called when user clicks Apply with the selected data */
  onApply: (data: TOutput) => void
  /** Render the preview of the AI result */
  renderPreview: (data: TOutput) => ReactNode
  /** Optional: Compact mode for inline usage */
  compact?: boolean
  /** Optional: Disabled state */
  disabled?: boolean
}

export function AIFieldAssist<TOutput>({
  label = 'AI Generate',
  generate,
  onApply,
  renderPreview,
  compact = false,
  disabled = false,
}: AIFieldAssistProps<TOutput>) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setIsOpen(true)

    try {
      const res = await generate()
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghasilkan konten AI.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (result) {
      onApply(result)
      setIsOpen(false)
      setResult(null)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setResult(null)
    setError(null)
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={disabled || isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-arkara-amber/10 hover:bg-arkara-amber/20 text-arkara-green text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title={label}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-arkara-amber" />
          )}
          <span className="hidden sm:inline">{label}</span>
        </button>

        {isOpen && (
          <div className="absolute z-20 top-full mt-2 right-0 w-80 bg-white rounded-xl border border-arkara-amber/20 shadow-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-arkara-green flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-arkara-amber" />
                Hasil AI
              </span>
              <button type="button" onClick={handleClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-6 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-xs">Sedang menghasilkan...</span>
              </div>
            )}

            {error && (
              <div className="p-2 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs">
                {error}
              </div>
            )}

            {result && (
              <>
                <div className="text-sm">{renderPreview(result)}</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-arkara-amber text-arkara-green text-xs font-bold hover:bg-arkara-amber/90 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    Retry
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  // Full-size mode
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={isOpen ? handleClose : handleGenerate}
        disabled={disabled || isLoading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-arkara-amber/10 to-arkara-amber/5 border border-arkara-amber/20 hover:border-arkara-amber/40 text-arkara-green text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-arkara-amber" />
        ) : (
          <Sparkles className="w-4 h-4 text-arkara-amber group-hover:scale-110 transition-transform" />
        )}
        {label}
        {!isLoading && (isOpen ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />)}
      </button>

      {isOpen && (
        <div className="bg-white rounded-xl border border-arkara-amber/20 shadow-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">AI sedang bekerja...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs">
              {error}
            </div>
          )}

          {result && (
            <>
              <div>{renderPreview(result)}</div>
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-arkara-amber text-arkara-green text-xs font-bold hover:bg-arkara-amber/90 transition-all shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply ke Form
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Regenerate
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
