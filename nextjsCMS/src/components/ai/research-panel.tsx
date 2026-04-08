"use client"

import { useState } from 'react'
import { Check, Copy, Loader2, RefreshCw, Search, Sparkles } from 'lucide-react'
import type { ResearchWithWebOutput } from '@/lib/ai/schemas'

interface ResearchPanelProps {
  title: string
  content?: string
  entityLabel?: string
  initialQuestion?: string
  generateResearch: (input: {
    title: string
    content?: string
    question?: string
    audience?: string
    notes?: string
  }) => Promise<{ success: true; data: ResearchWithWebOutput; model: string } | { success: false; error: string }>
}

const PRIORITY_STYLES: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-red-50 border-red-200 text-red-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  low: 'bg-sky-50 border-sky-200 text-sky-700',
}

function prettyPriority(value: 'high' | 'medium' | 'low') {
  switch (value) {
    case 'high':
      return 'High Priority'
    case 'medium':
      return 'Medium Priority'
    default:
      return 'Low Priority'
  }
}

export function ResearchPanel({
  title,
  content,
  entityLabel = 'artikel',
  initialQuestion = '',
  generateResearch,
}: ResearchPanelProps) {
  const [question, setQuestion] = useState(initialQuestion)
  const [audience, setAudience] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const [result, setResult] = useState<ResearchWithWebOutput | null>(null)
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const trimmedTitle = title.trim()
  const trimmedContent = content?.trim() || ''
  const canGenerate = Boolean(trimmedTitle)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await generateResearch({
        title: trimmedTitle,
        content: trimmedContent || undefined,
        question: question.trim() || undefined,
        audience: audience.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      if (response.success) {
        setResult(response.data)
        setModel(response.model)
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyiapkan brief riset web.')
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
      `Research Goal: ${result.research_goal}`,
      '',
      'Recommended Queries:',
      ...result.recommended_queries.map((item, index) => `${index + 1}. ${item}`),
      '',
      'Research Agenda:',
      ...result.research_agenda.flatMap((item, index) => [
        `${index + 1}. ${item.question} [${item.priority}]`,
        `Reason: ${item.reason}`,
        `Suggested Query: ${item.suggested_query}`,
        '',
      ]),
      ...(result.watchouts.length > 0
        ? ['Watchouts:', ...result.watchouts.map((item, index) => `${index + 1}. ${item}`)]
        : []),
    ].join('\n').trim()

    await handleCopy(fullText, 'copy-all')
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-sky-600" />
            <h3 className="font-bold text-gray-900">Research With Web</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Siapkan agenda browsing untuk {entityLabel} agar editor tahu apa yang perlu dicari sebelum menulis atau merevisi draft.
          </p>
        </div>
        {model && (
          <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-500">
            {model}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Pertanyaan Riset Utama
          </label>
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Contoh: data terbaru apa yang perlu dicek sebelum publish?"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Audiens
            </label>
            <input
              type="text"
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
              placeholder="Contoh: pembaca umum, survivalist pemula"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Catatan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Bagian mana yang paling rawan basi?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-xs text-sky-900">
        Panel ini belum browsing langsung. Tugasnya menyiapkan query dan agenda verifikasi agar pencarian web berikutnya lebih fokus dan hemat noise.
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !canGenerate}
          className="flex-1 min-w-[220px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : result ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {result ? 'Regenerate Research Brief' : 'Generate Research Brief'}
        </button>

        {result && (
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            {copiedValue === 'copy-all' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copiedValue === 'copy-all' ? 'Semua Tersalin' : 'Copy All'}
          </button>
        )}
      </div>

      {!canGenerate && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
          Isi judul dulu agar agenda riset bisa tetap relevan dengan topik konten.
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-sky-50 to-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-sky-700">Research Goal</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{result.research_goal}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Recommended Queries</p>
                <p className="text-xs text-gray-500">Query siap pakai untuk pencarian web berikutnya.</p>
              </div>
            </div>

            <div className="space-y-2">
              {result.recommended_queries.map((query, index) => {
                const copyKey = `query-${index}`
                return (
                  <div
                    key={copyKey}
                    className="rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-3 flex items-start justify-between gap-3"
                  >
                    <p className="text-sm text-gray-800 leading-relaxed">{query}</p>
                    <button
                      type="button"
                      onClick={() => handleCopy(query, copyKey)}
                      className="shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all"
                    >
                      {copiedValue === copyKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedValue === copyKey ? 'Tersalin' : 'Copy'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            {result.research_agenda.map((item, index) => {
              const copyKey = `agenda-${index}`
              return (
                <div
                  key={`${item.question}-${index}`}
                  className="rounded-2xl border border-gray-200 overflow-hidden bg-gradient-to-br from-white to-gray-50 shadow-sm"
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-900">{item.question}</p>
                      <span className={`inline-flex px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${PRIORITY_STYLES[item.priority]}`}>
                        {prettyPriority(item.priority)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.suggested_query, copyKey)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all"
                    >
                      {copiedValue === copyKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedValue === copyKey ? 'Query Tersalin' : 'Copy Query'}
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Reason</p>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">{item.reason}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Suggested Query</p>
                      <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 mt-1 leading-relaxed font-sans">
                        {item.suggested_query}
                      </pre>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {result.watchouts.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-sm font-bold text-amber-900">Watchouts</p>
              <ul className="space-y-1 text-sm text-amber-900/90">
                {result.watchouts.map((item, index) => (
                  <li key={`${item}-${index}`}>- {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

