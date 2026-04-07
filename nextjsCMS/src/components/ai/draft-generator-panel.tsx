"use client"

import { useEffect, useState } from 'react'
import { Sparkles, Loader2, Copy, Check, Wand2, PlusSquare, Replace, FilePenLine } from 'lucide-react'
import type { GenerateFullDraftInput, GenerateFullDraftOutput } from '@/lib/ai/schemas'
import { AIResultPreview } from './ai-result-preview'

interface DraftGeneratorPanelInitialState {
  input?: Partial<GenerateFullDraftInput>
  result?: GenerateFullDraftOutput | null
  model?: string | null
}

interface DraftGeneratorPanelProps {
  title: string
  editorReady: boolean
  entityLabel?: string
  initialState?: DraftGeneratorPanelInitialState
  generateDraft: (input: {
    title: string
    keyword?: string
    angle?: string
    audience?: string
    notes?: string
    outline?: string
  }) => Promise<{ success: true; data: GenerateFullDraftOutput; model: string } | { success: false; error: string }>
  onReplaceContent: (markdown: string) => void
  onAppendContent: (markdown: string) => void
  onApplyMetadata: (data: GenerateFullDraftOutput) => void
}

export function DraftGeneratorPanel({
  title,
  editorReady,
  entityLabel = 'artikel',
  initialState,
  generateDraft,
  onReplaceContent,
  onAppendContent,
  onApplyMetadata,
}: DraftGeneratorPanelProps) {
  const [keyword, setKeyword] = useState(initialState?.input?.keyword ?? '')
  const [angle, setAngle] = useState(initialState?.input?.angle ?? '')
  const [audience, setAudience] = useState(initialState?.input?.audience ?? '')
  const [notes, setNotes] = useState(initialState?.input?.notes ?? '')
  const [outline, setOutline] = useState(initialState?.input?.outline ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateFullDraftOutput | null>(initialState?.result ?? null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setKeyword(initialState?.input?.keyword ?? '')
    setAngle(initialState?.input?.angle ?? '')
    setAudience(initialState?.input?.audience ?? '')
    setNotes(initialState?.input?.notes ?? '')
    setOutline(initialState?.input?.outline ?? '')
    setResult(initialState?.result ?? null)
  }, [initialState])

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await generateDraft({
        title,
        keyword: keyword || undefined,
        angle: angle || undefined,
        audience: audience || undefined,
        notes: notes || undefined,
        outline: outline || undefined,
      })

      if (response.success) {
        setResult(response.data)
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat draft.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return

    await navigator.clipboard.writeText(result.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 via-white to-emerald-50 border border-amber-200 rounded-2xl p-5 space-y-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-arkara-green">
            <FilePenLine className="w-4 h-4 text-arkara-amber" />
            <h3 className="text-base font-bold">AI Draft Generator</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Ubah brief singkat menjadi draft lengkap {entityLabel}, lalu pilih apakah ingin menambahkan ke editor atau mengganti isi editor secara eksplisit.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-white border border-amber-200 text-[10px] font-bold uppercase tracking-widest text-amber-700">
          Phase 4A
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Judul Aktif
          </label>
          <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 min-h-[48px]">
            {title || 'Isi judul artikel terlebih dahulu'}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Keyword
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Keyword utama target"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-arkara-amber/20 focus:border-arkara-amber outline-none text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Sudut Pandang
          </label>
          <input
            type="text"
            value={angle}
            onChange={(event) => setAngle(event.target.value)}
            placeholder="Contoh: murah, cepat, untuk pemula"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-arkara-amber/20 focus:border-arkara-amber outline-none text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Audiens
          </label>
          <input
            type="text"
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            placeholder="Contoh: survivalist pemula"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-arkara-amber/20 focus:border-arkara-amber outline-none text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Catatan Tambahan
          </label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Poin penting, batasan, gaya penulisan, atau CTA"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-arkara-amber/20 focus:border-arkara-amber outline-none resize-none text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Outline Opsional
          </label>
          <textarea
            value={outline}
            onChange={(event) => setOutline(event.target.value)}
            rows={4}
            placeholder="Tempel outline jika draft harus mengikuti struktur tertentu"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-arkara-amber/20 focus:border-arkara-amber outline-none resize-none text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !title.trim()}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-arkara-amber text-arkara-green text-sm font-bold hover:bg-arkara-amber/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Draft
        </button>

        {result && (
          <>
            <button
              type="button"
              onClick={() => onAppendContent(result.content)}
              disabled={!editorReady}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <PlusSquare className="w-4 h-4 text-emerald-600" />
              Append ke Editor
            </button>
            <button
              type="button"
              onClick={() => onReplaceContent(result.content)}
              disabled={!editorReady}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Replace className="w-4 h-4 text-amber-600" />
              Replace Editor
            </button>
            <button
              type="button"
              onClick={() => onApplyMetadata(result)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <Wand2 className="w-4 h-4 text-blue-600" />
              Apply Metadata
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
              {copied ? 'Tersalin' : 'Copy Markdown'}
            </button>
          </>
        )}
      </div>

      {!editorReady && result && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
          Editor belum siap menerima draft. Tunggu editor selesai termuat, lalu klik lagi `Append` atau `Replace`.
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
            title="Draft Metadata"
            rawJson={result}
            fields={[
              ...(result.word_count ? [{ label: 'Jumlah Kata', value: `${result.word_count}` }] : []),
              ...(result.suggested_slug ? [{ label: 'Slug Disarankan', value: result.suggested_slug }] : []),
              ...(result.suggested_meta_title
                ? [{ label: 'Meta Title Disarankan', value: result.suggested_meta_title }]
                : []),
              ...(result.suggested_meta_desc
                ? [{ label: 'Meta Description Disarankan', value: result.suggested_meta_desc }]
                : []),
            ]}
          />

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gradient-to-r from-arkara-green to-arkara-green/90 flex items-center justify-between">
              <h4 className="text-sm font-bold text-arkara-amber tracking-wide">Preview Draft Markdown</h4>
              <span className="text-[10px] text-arkara-amber/70 uppercase tracking-widest">
                Preview sebelum apply
              </span>
            </div>
            <div className="p-5 max-h-[520px] overflow-y-auto">
              <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 leading-relaxed font-mono">
                {result.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
