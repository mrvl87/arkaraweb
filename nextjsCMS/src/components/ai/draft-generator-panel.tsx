"use client"

import { useEffect, useState } from 'react'
import { Sparkles, Loader2, Copy, Check, Wand2, PlusSquare, Replace, FilePenLine, ChevronDown } from 'lucide-react'
import type { GenerateFullDraftInput, GenerateFullDraftOutput } from '@/lib/ai/schemas'
import { AIResultPreview } from './ai-result-preview'

type DraftGeneratorResponse =
  | { success: true; data: GenerateFullDraftOutput; model: string }
  | { success: false; error: string }

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
  }) => Promise<DraftGeneratorResponse>
  streamTargetType?: 'post' | 'panduan'
  streamTargetId?: string
  onReplaceContent: (markdown: string) => void
  onAppendContent: (markdown: string) => void
  onApplyMetadata: (data: GenerateFullDraftOutput) => void
  onApplyMobileStructure?: (data: GenerateFullDraftOutput) => void
}

export function DraftGeneratorPanel({
  title,
  editorReady,
  entityLabel = 'artikel',
  initialState,
  generateDraft,
  streamTargetType,
  streamTargetId,
  onReplaceContent,
  onAppendContent,
  onApplyMetadata,
  onApplyMobileStructure,
}: DraftGeneratorPanelProps) {
  const [keyword, setKeyword] = useState(initialState?.input?.keyword ?? '')
  const [angle, setAngle] = useState(initialState?.input?.angle ?? '')
  const [audience, setAudience] = useState(initialState?.input?.audience ?? '')
  const [notes, setNotes] = useState(initialState?.input?.notes ?? '')
  const [outline, setOutline] = useState(initialState?.input?.outline ?? '')
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(
      initialState?.input?.keyword ||
      initialState?.input?.angle ||
      initialState?.input?.audience ||
      initialState?.input?.outline
    )
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateFullDraftOutput | null>(initialState?.result ?? null)
  const [copied, setCopied] = useState(false)
  const [showPreviewDetails, setShowPreviewDetails] = useState(false)
  const [generationMessage, setGenerationMessage] = useState<string | null>(null)

  useEffect(() => {
    setKeyword(initialState?.input?.keyword ?? '')
    setAngle(initialState?.input?.angle ?? '')
    setAudience(initialState?.input?.audience ?? '')
    setNotes(initialState?.input?.notes ?? '')
    setOutline(initialState?.input?.outline ?? '')
    setShowAdvanced(
      Boolean(
        initialState?.input?.keyword ||
        initialState?.input?.angle ||
        initialState?.input?.audience ||
        initialState?.input?.outline
      )
    )
    setResult(initialState?.result ?? null)
    setShowPreviewDetails(false)
  }, [initialState])

  const generateDraftWithStream = async (input: GenerateFullDraftInput): Promise<DraftGeneratorResponse> => {
    const response = await fetch('/cms/api/ai/full-draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetType: streamTargetType,
        targetId: streamTargetId,
        input,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.error || `Server returned ${response.status}`)
    }

    if (!response.body) {
      throw new Error('Server tidak mengirim stream hasil generate.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let finalResponse: DraftGeneratorResponse | null = null

    const consumeLine = (line: string) => {
      const trimmed = line.trim()
      if (!trimmed) return

      const event = JSON.parse(trimmed) as {
        type?: string
        message?: string
        payload?: DraftGeneratorResponse
      }

      if (event.type === 'status' && event.message) {
        setGenerationMessage(event.message)
      }

      if (event.type === 'result' && event.payload) {
        finalResponse = event.payload
      }
    }

    while (true) {
      const { value, done } = await reader.read()

      if (value) {
        buffer += decoder.decode(value, { stream: !done })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        lines.forEach(consumeLine)
      }

      if (done) {
        break
      }
    }

    if (buffer.trim()) {
      consumeLine(buffer)
    }

    if (!finalResponse) {
      throw new Error('Server selesai tanpa mengirim hasil generate.')
    }

    return finalResponse
  }

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    setGenerationMessage('Mengirim brief ke AI...')

    try {
      const input = {
        title,
        keyword: keyword || undefined,
        angle: angle || undefined,
        audience: audience || undefined,
        notes: notes || undefined,
        outline: outline || undefined,
      }

      const response = streamTargetType
        ? await generateDraftWithStream(input)
        : await generateDraft(input)

      if (response.success) {
        setResult(response.data)
        setShowPreviewDetails(false)
      } else {
        setError(response.error)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal membuat draft.'
      setError(
        message.includes('Failed to fetch')
          ? 'Koneksi generate draft terputus sebelum server mengirim hasil. Coba ulang; jika masih terjadi, kurangi brief tambahan.'
          : message
      )
    } finally {
      setIsLoading(false)
      setGenerationMessage(null)
    }
  }

  const handleCopy = async () => {
    if (!result) return

    await navigator.clipboard.writeText(result.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApplyCompleteDraft = () => {
    if (!result) return

    onReplaceContent(result.content)
    onApplyMetadata(result)
    onApplyMobileStructure?.(result)
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
            Satu eksekusi menghasilkan draft pendek {entityLabel}, metadata, Jawaban Singkat, Inti Artikel, dan FAQ yang nyaman dibaca di mobile.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-white border border-amber-200 text-[10px] font-bold uppercase tracking-widest text-amber-700">
          Mobile AI
        </span>
      </div>

      <div className="space-y-3">
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
            Brief Tambahan Opsional
          </label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Contoh: tekan sisi kontrol vs ketergantungan, gunakan simulasi balkon 2x1 meter, tone lebih tajam dan tenang, tutup dengan konsekuensi yang terasa."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-arkara-amber/20 focus:border-arkara-amber outline-none resize-none text-sm"
          />
          <p className="text-[11px] text-gray-500">
            Kosongkan jika ingin AI mengikuti struktur default Arkara tanpa penguncian tambahan.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-white/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced((current) => !current)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-amber-50/60 transition-colors"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Detail Tambahan
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              Keyword, sudut pandang, audiens, dan outline hanya jika Anda perlu arahan lebih spesifik.
            </p>
          </div>
          <ChevronDown className={`h-4 w-4 text-amber-700 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {showAdvanced ? (
          <div className="border-t border-amber-100 bg-amber-50/30 px-4 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Keyword
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Opsional: keyword utama target"
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
                  placeholder="Opsional: tekanan harga, skenario urban, kontrol keluarga"
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
                  placeholder="Opsional: keluarga urban, pemula, rumah tangga apartemen"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-arkara-amber/20 focus:border-arkara-amber outline-none text-sm"
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
                  placeholder="Tempel outline hanya jika draft harus mengikuti struktur tertentu"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-arkara-amber/20 focus:border-arkara-amber outline-none resize-none text-sm"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !title.trim()}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-arkara-amber text-arkara-green text-sm font-bold hover:bg-arkara-amber/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Mobile Draft
        </button>
      </div>

      {isLoading && generationMessage ? (
        <div className="rounded-xl border border-amber-100 bg-white/70 px-4 py-3 text-xs font-semibold text-amber-800">
          {generationMessage}
        </div>
      ) : null}

      {result && (
        <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 space-y-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-arkara-green">Draft sudah jadi. Pilih arah apply berikutnya.</p>
            <p className="text-xs text-gray-500">
              Editor utama menyimpan isi artikel. Mobile editor menyimpan Jawaban Singkat, Inti Artikel, FAQ, dan format editorial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => onAppendContent(result.content)}
              disabled={!editorReady}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 border border-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <PlusSquare className="w-4 h-4" />
              Append ke Editor Utama
            </button>
            <button
              type="button"
              onClick={() => onReplaceContent(result.content)}
              disabled={!editorReady}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-amber-200 text-sm font-bold text-gray-700 hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Replace className="w-4 h-4 text-amber-600" />
              Replace Editor Utama
            </button>
            {onApplyMobileStructure ? (
              <button
                type="button"
                onClick={() => onApplyMobileStructure(result)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-emerald-200 text-sm font-bold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
              >
                <Wand2 className="w-4 h-4 text-emerald-600" />
                Apply ke Mobile Editor
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onApplyMetadata(result)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <Wand2 className="w-4 h-4 text-blue-600" />
              Apply Metadata
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleApplyCompleteDraft}
              disabled={!editorReady}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-emerald-200 hover:border-emerald-400 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Wand2 className="w-4 h-4 text-emerald-300" />
              Replace + Mobile + Metadata
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
              {copied ? 'Tersalin' : 'Copy Markdown'}
            </button>
          </div>
        </div>
      )}

      {!editorReady && result && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
          Editor utama belum siap menerima draft. Tunggu editor selesai termuat, lalu klik lagi `Append`, `Replace`, atau `Replace + Mobile + Metadata`.
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-gray-200 bg-white/85 overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setShowPreviewDetails((current) => !current)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm font-bold text-gray-800">Detail hasil generate</p>
              <p className="mt-1 text-xs text-gray-500">
                Draft Metadata dan Preview Draft Markdown disembunyikan agar area CMS tetap lega.
              </p>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showPreviewDetails ? 'rotate-180' : ''}`} />
          </button>

          {showPreviewDetails ? (
            <div className="border-t border-gray-100 p-4 space-y-4">
              <AIResultPreview
                title="Draft Metadata"
                rawJson={result}
                fields={[
                  ...(result.editorial_format ? [{ label: 'Format Editorial', value: result.editorial_format }] : []),
                  ...(result.quick_answer ? [{ label: 'Jawaban Singkat', value: result.quick_answer }] : []),
                  ...(result.key_takeaways?.length
                    ? [{ label: 'Inti Artikel', value: result.key_takeaways.join('\n') }]
                    : []),
                  ...(result.faq?.length
                    ? [{ label: 'FAQ', value: result.faq.map((item) => `${item.question}\n${item.answer}`).join('\n\n') }]
                    : []),
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
          ) : null}
        </div>
      )}
    </div>
  )
}
