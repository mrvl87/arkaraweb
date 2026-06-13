"use client"

import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, ExternalLink } from 'lucide-react'
import type { SeoIndexingQueueItem } from '@/lib/seo/indexing-queue'

interface SeoIndexingQueuePanelProps {
  items: SeoIndexingQueueItem[]
  error?: string
}

function statusClass(status: SeoIndexingQueueItem['status']): string {
  if (status === 'pending') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'submitted') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'failed') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-gray-200 bg-gray-50 text-gray-600'
}

export function SeoIndexingQueuePanel({ items, error }: SeoIndexingQueuePanelProps) {
  const [copied, setCopied] = useState(false)
  const pendingUrls = useMemo(
    () => items.filter((item) => item.status === 'pending').map((item) => item.url),
    [items]
  )

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pendingUrls.join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Indexing queue</p>
          <h2 className="text-xl font-black text-arkara-green">Link siap indexing</h2>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={pendingUrls.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-arkara-green px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-arkara-amber hover:text-arkara-green disabled:cursor-not-allowed disabled:opacity-60"
        >
          {copied ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
          {copied ? 'Copied' : `Copy ${pendingUrls.length} URL`}
        </button>
      </div>

      {error ? (
        <div className="m-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="max-h-[360px] divide-y divide-gray-100 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="grid gap-3 px-5 py-3 md:grid-cols-[1fr_160px_40px] md:items-center">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-arkara-green/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-arkara-green">
                    {item.content_type}
                  </span>
                  <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClass(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
                    {item.source.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="truncate text-sm font-black text-arkara-green">{item.title}</p>
                <p className="truncate text-xs font-semibold text-gray-500">{item.url}</p>
              </div>
              <p className="text-xs font-semibold text-gray-400">
                {new Date(item.created_at).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-100 bg-white text-arkara-green hover:border-arkara-amber hover:text-arkara-amber"
                aria-label={`Buka ${item.title}`}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5 text-sm font-semibold text-gray-500">Belum ada URL yang perlu di-index.</div>
      )}
    </section>
  )
}
