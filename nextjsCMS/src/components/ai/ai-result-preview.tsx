"use client"

/**
 * AI Workspace Result Preview — Displays AI results in a structured,
 * copyable format with Apply actions.
 */

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface ResultField {
  label: string
  value: string
  fieldKey?: string
}

interface AIResultPreviewProps {
  title: string
  fields: ResultField[]
  rawJson?: Record<string, unknown>
  onApply?: (fieldKey: string, value: string) => void
  className?: string
}

export function AIResultPreview({
  title,
  fields,
  rawJson,
  onApply,
  className = '',
}: AIResultPreviewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showRaw, setShowRaw] = useState(false)

  const handleCopy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(key)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className={`bg-white rounded-2xl border border-arkara-amber/20 overflow-hidden shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-5 py-3 bg-gradient-to-r from-arkara-green to-arkara-green/90 flex items-center justify-between">
        <h4 className="text-sm font-bold text-arkara-amber tracking-wide">{title}</h4>
        {rawJson && (
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="text-xs text-arkara-amber/60 hover:text-arkara-amber flex items-center gap-1 transition-colors"
          >
            {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Raw JSON
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="divide-y divide-gray-100">
        {fields.map((field, idx) => (
          <div key={idx} className="px-5 py-3 group hover:bg-arkara-cream/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                  {field.label}
                </span>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                  {field.value}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleCopy(field.value, field.label)}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                  title="Copy"
                >
                  {copiedField === field.label ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                {onApply && field.fieldKey && (
                  <button
                    type="button"
                    onClick={() => onApply(field.fieldKey!, field.value)}
                    className="px-2.5 py-1 rounded-lg bg-arkara-amber text-arkara-green text-[10px] font-bold uppercase tracking-wider hover:bg-arkara-amber/80 transition-colors shadow-sm"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Raw JSON (collapsible) */}
      {showRaw && rawJson && (
        <div className="px-5 py-3 border-t bg-gray-50">
          <pre className="text-[11px] text-gray-600 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
            {JSON.stringify(rawJson, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
