"use client"

import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  FileText,
  Link as LinkIcon,
  Loader2,
  PlusCircle,
  Search,
  Sparkles,
} from 'lucide-react'
import type {
  GenerateMobileReaderStructureInput,
  GenerateMobileReaderStructureOutput,
} from '@/lib/ai/schemas'
import type { InternalLinkAuditResult, InternalLinkOpportunity } from '@/lib/internal-link-opportunities'
import { normalizeEditorContentForAI } from '@/lib/editor-content'

interface ContentAdoptionPanelProps {
  entityLabel: string
  sourceTitle: string
  sourceContent: string
  sourceDescription?: string
  editorReady: boolean
  generateStructure: (
    input: GenerateMobileReaderStructureInput
  ) => Promise<
    | { success: true; data: GenerateMobileReaderStructureOutput; model: string }
    | { success: false; error: string }
  >
  findInternalLinks: (input: {
    title: string
    content: string
  }) => Promise<InternalLinkAuditResult>
  onApplyMobileStructure: (data: GenerateMobileReaderStructureOutput) => void
  onInsertInternalLink: (item: InternalLinkOpportunity) => void
}

type AdoptionStatus = 'idle' | 'loading' | 'success' | 'error'

export function ContentAdoptionPanel({
  entityLabel,
  sourceTitle,
  sourceContent,
  sourceDescription,
  editorReady,
  generateStructure,
  findInternalLinks,
  onApplyMobileStructure,
  onInsertInternalLink,
}: ContentAdoptionPanelProps) {
  const [structureStatus, setStructureStatus] = useState<AdoptionStatus>('idle')
  const [linkStatus, setLinkStatus] = useState<AdoptionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [linkResult, setLinkResult] = useState<InternalLinkAuditResult | null>(null)

  const normalizedContent = useMemo(() => normalizeEditorContentForAI(sourceContent), [sourceContent])
  const canAdopt = Boolean(sourceTitle.trim() && normalizedContent.length >= 300)
  const isBusy = structureStatus === 'loading' || linkStatus === 'loading'

  const runMobileStructure = async () => {
    if (!canAdopt) return

    setStructureStatus('loading')
    setError(null)

    try {
      const response = await generateStructure({
        title: sourceTitle,
        content: normalizedContent,
        description: sourceDescription || undefined,
      })

      if (!response.success) {
        setStructureStatus('error')
        setError(response.error)
        return
      }

      onApplyMobileStructure(response.data)
      setStructureStatus('success')
    } catch (err) {
      setStructureStatus('error')
      setError(err instanceof Error ? err.message : 'Gagal membuat Mobile Reader dari konten editor.')
    }
  }

  const runInternalLinks = async () => {
    if (!canAdopt) return

    setLinkStatus('loading')
    setError(null)

    try {
      const result = await findInternalLinks({
        title: sourceTitle,
        content: sourceContent,
      })

      setLinkResult(result)
      setLinkStatus('success')
    } catch (err) {
      setLinkStatus('error')
      setLinkResult(null)
      setError(err instanceof Error ? err.message : 'Gagal mencari internal link dari konten editor.')
    }
  }

  const runBoth = async () => {
    if (!canAdopt || isBusy) return
    await runMobileStructure()
    await runInternalLinks()
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
              Adopsi Konten Editor
            </p>
            <h3 className="mt-1 text-base font-black text-slate-900">
              Paste {entityLabel} dari luar, lalu proses layer mobile dan internal link.
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">
              AI tidak menulis ulang konten utama. Sistem hanya membaca konten editor untuk membuat Jawaban Singkat, Inti Artikel, FAQ, dan rekomendasi internal link.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white bg-white/80 px-3 py-2 text-xs text-slate-600 shadow-sm">
          <span className="font-bold text-slate-900">{normalizedContent.length.toLocaleString('id-ID')}</span>
          {' '}karakter terbaca
        </div>
      </div>

      {!canAdopt ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          Isi judul dan paste konten utama minimal 300 karakter ke editor sebelum menjalankan adopsi konten.
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runMobileStructure}
          disabled={!canAdopt || structureStatus === 'loading'}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black uppercase tracking-[0.12em] text-emerald-200 transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {structureStatus === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : structureStatus === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate Mobile Reader
        </button>

        <button
          type="button"
          onClick={runInternalLinks}
          disabled={!canAdopt || linkStatus === 'loading'}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-emerald-800 transition-colors hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {linkStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Cari Internal Link
        </button>

        <button
          type="button"
          onClick={runBoth}
          disabled={!canAdopt || isBusy}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <PlusCircle className="h-4 w-4" />
          Generate Keduanya
        </button>
      </div>

      {linkResult ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Rekomendasi Internal Link
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {linkResult.suggestions.length} saran dari {linkResult.scannedCount} konten published.
              </p>
            </div>
            {linkResult.existingLinkCount > 0 ? (
              <span className="text-xs font-semibold text-slate-500">
                {linkResult.existingLinkCount} link existing terdeteksi
              </span>
            ) : null}
          </div>

          {linkResult.suggestions.length ? (
            <div className="mt-4 grid gap-3">
              {linkResult.suggestions.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                          {item.type === 'post' ? 'Artikel' : 'Panduan'}
                        </span>
                        {item.category ? (
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            {item.category}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-black leading-snug text-slate-900">{item.title}</p>
                      <p className="mt-1 font-mono text-[11px] text-slate-500">{item.path}</p>
                      {item.matchedTerms.length ? (
                        <p className="mt-2 text-[11px] text-slate-500">
                          Match: {item.matchedTerms.join(', ')}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => onInsertInternalLink(item)}
                      disabled={!editorReady}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      Insert di Cursor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-4 text-xs text-slate-500">
              Belum ada saran internal link yang cukup relevan dari konten editor saat ini.
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
