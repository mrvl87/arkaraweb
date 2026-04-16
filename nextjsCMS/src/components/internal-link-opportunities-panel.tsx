"use client"

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Copy, Link2, RefreshCw } from 'lucide-react'
import type { InternalLinkAuditResult } from '@/lib/internal-link-opportunities'

interface InternalLinkOpportunitiesPanelProps {
  title: string
  content?: string
  category?: string
  sourceId?: string
  sourcePublishedAt?: string | null
  sourceLabel: string
  checker: (input: {
    title: string
    content?: string
    category?: string
    publishedAt?: string | null
    postId?: string
    panduanId?: string
  }) => Promise<InternalLinkAuditResult>
  idKey: 'postId' | 'panduanId'
}

function formatDate(value: string | null): string {
  if (!value) return 'tanggal tidak diketahui'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'tanggal tidak diketahui'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function InternalLinkOpportunitiesPanel({
  title,
  content,
  category,
  sourceId,
  sourcePublishedAt,
  sourceLabel,
  checker,
  idKey,
}: InternalLinkOpportunitiesPanelProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const [result, setResult] = useState<InternalLinkAuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const payload = useMemo(
    () => ({
      title,
      content: content ?? '',
      category,
      publishedAt: sourcePublishedAt,
      ...(sourceId ? { [idKey]: sourceId } : {}),
    }),
    [category, content, idKey, sourceId, sourcePublishedAt, title]
  )

  useEffect(() => {
    if (!title.trim() || !sourceId) {
      setResult(null)
      return
    }

    const timer = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const next = await checker(payload)
          setResult(next)
          setError(null)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Gagal memeriksa peluang internal link.')
        }
      })
    }, 500)

    return () => window.clearTimeout(timer)
  }, [checker, payload, sourceId, title])

  const refresh = () => {
    if (!title.trim() || !sourceId) return

    startTransition(async () => {
      try {
        const next = await checker(payload)
        setResult(next)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memeriksa peluang internal link.')
      }
    })
  }

  const copyMarkdownLink = async (path: string, anchor: string) => {
    await navigator.clipboard.writeText(`[${anchor}](${path})`)
    setCopiedPath(path)
    window.setTimeout(() => setCopiedPath((current) => (current === path ? null : current)), 1500)
  }

  if (!sourceId) {
    return null
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">Internal Link Audit</p>
          <h3 className="mt-1 text-lg font-bold text-gray-900">Peluang link baru untuk update {sourceLabel}</h3>
          <p className="mt-2 text-sm text-gray-600">
            Menampilkan konten blog dan panduan yang lebih baru dari naskah ini, relevan, dan belum tertaut di isi saat ini.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={isPending || !title.trim()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          Periksa ulang
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Tanggal Acuan</p>
          <p className="mt-2 text-sm font-bold text-gray-800">{formatDate(result?.sourcePublishedAt ?? sourcePublishedAt ?? null)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Internal Link Saat Ini</p>
          <p className="mt-2 text-sm font-bold text-gray-800">{result?.existingLinkCount ?? 0} tautan</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Konten Baru Relevan</p>
          <p className="mt-2 text-sm font-bold text-gray-800">{result?.suggestions.length ?? 0} saran</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {!error && result && result.suggestions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
          Belum ada konten baru yang cukup relevan dan belum tertaut. Jika baru menambah atau menghapus link di editor, klik <span className="font-bold">Periksa ulang</span>.
        </div>
      ) : null}

      {!error && result && result.suggestions.length > 0 ? (
        <div className="space-y-3">
          {result.suggestions.map((item) => (
            <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                      item.type === 'post' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.type === 'post' ? 'blog' : 'panduan'}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">{formatDate(item.publishedAt)}</span>
                    {item.category ? (
                      <span className="rounded-full bg-gray-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-600">
                        {item.category}
                      </span>
                    ) : null}
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-gray-900">{item.title}</h4>
                  <p className="mt-2 font-mono text-xs text-arkara-green">{item.path}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.matchedTerms.map((term) => (
                      <span key={term} className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-row gap-2 md:flex-col">
                  <button
                    type="button"
                    onClick={() => copyMarkdownLink(item.path, item.suggestedAnchor)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    <Copy className="h-4 w-4" />
                    {copiedPath === item.path ? 'Tersalin' : 'Salin Markdown'}
                  </button>
                  <a
                    href={`${siteUrl}${item.path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    <Link2 className="h-4 w-4" />
                    Buka URL
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
