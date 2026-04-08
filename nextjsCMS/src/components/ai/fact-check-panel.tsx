"use client"

import { useState } from 'react'
import { AlertTriangle, Check, Copy, Loader2, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import type { VerifyLatestFactsOutput } from '@/lib/ai/schemas'

interface FactCheckPanelProps {
  title: string
  content: string
  excerpt?: string
  entityLabel?: string
  generateReport: (input: {
    title: string
    content: string
    excerpt?: string
    focus_area?: string
  }) => Promise<{ success: true; data: VerifyLatestFactsOutput; model: string } | { success: false; error: string }>
}

const STATUS_STYLES: Record<
  VerifyLatestFactsOutput['claims'][number]['status'],
  { label: string; className: string }
> = {
  needs_web_verification: {
    label: 'Needs Web Verification',
    className: 'bg-sky-50 border-sky-200 text-sky-700',
  },
  needs_update: {
    label: 'Needs Update',
    className: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  unsupported: {
    label: 'Unsupported',
    className: 'bg-red-50 border-red-200 text-red-700',
  },
  uncertain: {
    label: 'Uncertain',
    className: 'bg-gray-100 border-gray-200 text-gray-700',
  },
}

const MIN_FACTCHECK_CONTENT_LENGTH = 280

export function FactCheckPanel({
  title,
  content,
  excerpt,
  entityLabel = 'artikel',
  generateReport,
}: FactCheckPanelProps) {
  const [focusArea, setFocusArea] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const [result, setResult] = useState<VerifyLatestFactsOutput | null>(null)
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const trimmedTitle = title.trim()
  const trimmedContent = content.trim()
  const canGenerate = Boolean(trimmedTitle && trimmedContent.length >= MIN_FACTCHECK_CONTENT_LENGTH)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await generateReport({
        title: trimmedTitle,
        content: trimmedContent,
        excerpt: excerpt?.trim() || undefined,
        focus_area: focusArea.trim() || undefined,
      })

      if (response.success) {
        setResult(response.data)
        setModel(response.model)
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat laporan fact-check.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(key)
      setTimeout(() => setCopiedValue(null), 1800)
    } catch {
      setError('Clipboard tidak tersedia. Coba copy manual dari teks yang tampil.')
    }
  }

  const handleCopyAll = async () => {
    if (!result) {
      return
    }

    const fullText = [
      `Summary: ${result.summary}`,
      `Checked At: ${result.checked_at}`,
      '',
      ...result.claims.flatMap((claim, index) => [
        `${index + 1}. ${claim.claim}`,
        `Status: ${STATUS_STYLES[claim.status].label}`,
        `Reason: ${claim.reason}`,
        ...(claim.suggested_revision ? [`Suggested Revision: ${claim.suggested_revision}`] : []),
        ...(claim.sources.length > 0
          ? [
              'Sources:',
              ...claim.sources.map((source) =>
                `- ${source.title}${source.publisher ? ` (${source.publisher})` : ''}${source.url ? ` - ${source.url}` : ''}`
              ),
            ]
          : []),
        '',
      ]),
    ].join('\n').trim()

    await handleCopy(fullText, 'copy-all')
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-gray-900">Verify Latest Facts</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tinjau klaim penting pada {entityLabel} sebelum masuk editor final atau sebelum publish.
          </p>
        </div>
        {model && (
          <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-500">
            {model}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          Fokus Pengecekan
        </label>
        <input
          type="text"
          value={focusArea}
          onChange={(event) => setFocusArea(event.target.value)}
          placeholder="Contoh: angka, regulasi, langkah keselamatan, data terbaru"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none text-sm"
        />
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-900 space-y-1">
        <p className="font-semibold text-emerald-950">Preflight fact-check</p>
        <p>
          Tahap ini belum browsing live. Panel ini memprioritaskan klaim yang perlu verifikasi web, butuh wording lebih aman, atau tampak unsupported.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !canGenerate}
          className="flex-1 min-w-[220px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : result ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {result ? 'Run Fact Check Again' : 'Run Fact Check'}
        </button>

        {result && (
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            {copiedValue === 'copy-all' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copiedValue === 'copy-all' ? 'Semua Tersalin' : 'Copy Report'}
          </button>
        )}
      </div>

      {!trimmedTitle && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
          Isi judul dulu agar report bisa tetap mengikuti konteks konten.
        </div>
      )}

      {trimmedTitle && trimmedContent.length > 0 && trimmedContent.length < MIN_FACTCHECK_CONTENT_LENGTH && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
          <span>
            Konten masih terlalu pendek untuk fact-check yang berarti. Tambahkan isi draft lebih dulu agar ekstraksi klaim lebih akurat.
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
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-emerald-50 to-white p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Summary</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{result.summary}</p>
              </div>
              <span className="text-[10px] font-semibold text-gray-500">
                {new Date(result.checked_at).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {result.claims.map((claim, index) => {
              const statusMeta = STATUS_STYLES[claim.status]
              const copyKey = `claim-${index}`

              return (
                <div
                  key={`${claim.claim}-${index}`}
                  className="rounded-2xl border border-gray-200 overflow-hidden bg-gradient-to-br from-white to-gray-50 shadow-sm"
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                    <span className={`inline-flex px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                    {claim.suggested_revision && (
                      <button
                        type="button"
                        onClick={() => handleCopy(claim.suggested_revision ?? '', copyKey)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all"
                      >
                        {copiedValue === copyKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedValue === copyKey ? 'Revisi Tersalin' : 'Copy Suggestion'}
                      </button>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Claim</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1 leading-relaxed">{claim.claim}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Reason</p>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">{claim.reason}</p>
                    </div>

                    {claim.suggested_revision && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Suggested Revision</p>
                        <pre className="whitespace-pre-wrap break-words text-sm text-emerald-950 mt-2 leading-relaxed font-sans">
                          {claim.suggested_revision}
                        </pre>
                      </div>
                    )}

                    {claim.sources.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Sources</p>
                        <div className="space-y-2">
                          {claim.sources.map((source, sourceIndex) => (
                            <div
                              key={`${source.title}-${sourceIndex}`}
                              className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700"
                            >
                              <p className="font-semibold text-gray-900">{source.title}</p>
                              {(source.publisher || source.note) && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {[source.publisher, source.note].filter(Boolean).join(' · ')}
                                </p>
                              )}
                              {source.url && (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-sky-700 hover:text-sky-800 underline break-all mt-2 inline-block"
                                >
                                  {source.url}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

