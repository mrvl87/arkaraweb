"use client"

import { useEffect, useMemo, useState } from 'react'
import { Sparkles, Loader2, Copy, Check, ImageIcon, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react'
import type { GenerateImagePromptsOutput } from '@/lib/ai/schemas'
import { AIResultPreview } from './ai-result-preview'

const MIN_READY_CONTENT_LENGTH = 600

function buildGenerationSignature(input: {
  title: string
  content: string
  excerpt?: string
  focusKeyword?: string
  category?: string
}) {
  return JSON.stringify({
    title: input.title.trim(),
    content: input.content.trim(),
    excerpt: input.excerpt?.trim() ?? '',
    focusKeyword: input.focusKeyword?.trim() ?? '',
    category: input.category?.trim() ?? '',
  })
}

interface ImagePromptsPanelProps {
  title: string
  content: string
  excerpt?: string
  focusKeyword?: string
  category?: string
  entityLabel?: string
  initialResult?: GenerateImagePromptsOutput | null
  initialModel?: string | null
  initialGeneratedFrom?: {
    title?: string
    content?: string
    excerpt?: string
    focusKeyword?: string
    category?: string
  } | null
  generatePrompts: (input: {
    title: string
    content: string
    excerpt?: string
    focus_keyword?: string
    category?: string
  }) => Promise<{ success: true; data: GenerateImagePromptsOutput; model: string } | { success: false; error: string }>
}

export function ImagePromptsPanel({
  title,
  content,
  excerpt,
  focusKeyword,
  category,
  entityLabel = 'artikel',
  initialResult = null,
  initialModel = null,
  initialGeneratedFrom = null,
  generatePrompts,
}: ImagePromptsPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateImagePromptsOutput | null>(initialResult)
  const [model, setModel] = useState<string | null>(initialModel)
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [generatedSignature, setGeneratedSignature] = useState<string | null>(
    initialGeneratedFrom
      ? buildGenerationSignature({
          title: initialGeneratedFrom.title ?? '',
          content: initialGeneratedFrom.content ?? '',
          excerpt: initialGeneratedFrom.excerpt,
          focusKeyword: initialGeneratedFrom.focusKeyword,
          category: initialGeneratedFrom.category,
        })
      : null
  )

  const trimmedTitle = title.trim()
  const trimmedContent = content.trim()
  const trimmedExcerpt = excerpt?.trim() || ''
  const trimmedFocusKeyword = focusKeyword?.trim() || ''
  const trimmedCategory = category?.trim() || ''
  const hasRequiredFields = Boolean(trimmedTitle && trimmedContent)
  const isReadyForFinalPrompts = trimmedContent.length >= MIN_READY_CONTENT_LENGTH
  const currentSignature = useMemo(() => buildGenerationSignature({
    title,
    content,
    excerpt,
    focusKeyword,
    category,
  }), [title, content, excerpt, focusKeyword, category])
  const isStale = Boolean(result && generatedSignature && generatedSignature !== currentSignature)

  useEffect(() => {
    setResult(initialResult)
    setModel(initialModel)
    setGeneratedSignature(
      initialGeneratedFrom
        ? buildGenerationSignature({
            title: initialGeneratedFrom.title ?? '',
            content: initialGeneratedFrom.content ?? '',
            excerpt: initialGeneratedFrom.excerpt,
            focusKeyword: initialGeneratedFrom.focusKeyword,
            category: initialGeneratedFrom.category,
          })
        : null
    )
  }, [initialGeneratedFrom, initialModel, initialResult])

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await generatePrompts({
        title: trimmedTitle,
        content: trimmedContent,
        excerpt: trimmedExcerpt || undefined,
        focus_keyword: trimmedFocusKeyword || undefined,
        category: trimmedCategory || undefined,
      })

      if (response.success) {
        setResult(response.data)
        setModel(response.model)
        setGeneratedSignature(currentSignature)
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat image prompts.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyPrompt = async (prompt: string, label: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPrompt(label)
      setTimeout(() => setCopiedPrompt(null), 2000)
    } catch {
      setError('Clipboard tidak tersedia. Coba copy manual dari prompt di bawah.')
    }
  }

  const handleCopyAll = async () => {
    if (!result) {
      return
    }

    const fullText = [
      `Art Direction: ${result.art_direction}`,
      '',
      ...result.hero_prompts.flatMap((item, index) => [
        `${index + 1}. ${item.label}`,
        item.prompt,
        '',
      ]),
    ].join('\n').trim()

    try {
      await navigator.clipboard.writeText(fullText)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    } catch {
      setError('Clipboard tidak tersedia. Coba copy manual dari prompt satu per satu.')
    }
  }

  const handleReset = () => {
    setResult(null)
    setModel(null)
    setError(null)
    setCopiedPrompt(null)
    setCopiedAll(false)
    setGeneratedSignature(null)
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-gray-900">AI Image Prompts</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Hasilkan 3-4 prompt Nano Banana siap copy dari {entityLabel} final yang sudah disetujui.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold uppercase tracking-widest text-amber-700">
            Nano Banana
          </span>
          {model && (
            <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-500">
              {model}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-xs text-gray-600 space-y-1">
        <p className="font-semibold text-gray-700">
          Idealnya generate setelah naskah final stabil.
        </p>
        <p>
          Konten saat ini {trimmedContent.length.toLocaleString('id-ID')} karakter.
          {isReadyForFinalPrompts
            ? ' Panjang naskah sudah cukup untuk variasi visual yang lebih kaya.'
            : ` Disarankan minimal sekitar ${MIN_READY_CONTENT_LENGTH.toLocaleString('id-ID')} karakter agar 3-4 prompt terasa berbeda dan tidak generik.`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !hasRequiredFields}
          className="flex-1 min-w-[220px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-arkara-amber text-arkara-green text-sm font-bold hover:bg-arkara-amber/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : result ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {result ? 'Regenerate Image Prompts' : 'Generate Image Prompts'}
        </button>

        {result && (
          <>
            <button
              type="button"
              onClick={handleCopyAll}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copiedAll ? 'Semua Tersalin' : 'Copy All'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </>
        )}
      </div>

      {!hasRequiredFields && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
          Isi judul dan konten final dulu agar prompt gambar yang dihasilkan relevan.
        </div>
      )}

      {hasRequiredFields && !isReadyForFinalPrompts && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
          <span>
            Naskah masih relatif pendek. Prompt tetap bisa dibuat, tetapi hasilnya cenderung kurang kaya atau lebih mirip satu sama lain.
          </span>
        </div>
      )}

      {isStale && (
        <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-xs text-blue-900 flex items-start gap-2">
          <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 text-blue-700" />
          <span>
            Konten artikel berubah setelah prompt terakhir dibuat. Sebaiknya generate ulang agar prompt gambar tetap sinkron dengan naskah terbaru.
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <AIResultPreview
            title="Art Direction"
            rawJson={result}
            fields={[
              { label: 'Arah Visual', value: result.art_direction },
            ]}
          />

          <div className="space-y-3">
            {result.hero_prompts.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="rounded-2xl border border-gray-200 overflow-hidden bg-gradient-to-br from-white to-gray-50 shadow-sm"
              >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.label}</p>
                    <p className="text-[11px] text-gray-400 uppercase tracking-widest">
                      Prompt Siap Copy
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(item.prompt, item.label)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 transition-all"
                  >
                    {copiedPrompt === item.label ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedPrompt === item.label ? 'Tersalin' : 'Copy'}
                  </button>
                </div>
                <div className="p-4">
                  <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 leading-relaxed font-sans">
                    {item.prompt}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
