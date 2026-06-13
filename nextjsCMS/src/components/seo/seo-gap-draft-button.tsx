"use client"

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, FilePlus2, Loader2 } from 'lucide-react'
import { actionGenerateGapDraft } from '@/app/cms/seo/actions'
import type { SeoClusterSlug } from '@/lib/seo/content-audit'

interface SeoGapDraftButtonProps {
  cluster: SeoClusterSlug
  query: string
  topCompetitors: string[]
  peopleAlsoAsk: string[]
  relatedSearches: string[]
  disabled?: boolean
}

type DraftResult = {
  id: string
  title: string
  slug: string
  contentType: 'post' | 'panduan'
  editPath: string
  publicPath: string
  publicUrl: string
  draftNotes: string[]
} | null

export function SeoGapDraftButton({
  cluster,
  query,
  topCompetitors,
  peopleAlsoAsk,
  relatedSearches,
  disabled,
}: SeoGapDraftButtonProps) {
  const [contentType, setContentType] = useState<'auto' | 'post' | 'panduan'>('auto')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftResult>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setDraft(null)

    try {
      const response = await actionGenerateGapDraft({
        cluster,
        query,
        contentType,
        topCompetitors,
        peopleAlsoAsk,
        relatedSearches,
      })

      if (response.success && response.data) {
        setDraft(response.data)
      } else {
        setError(response.error ?? 'Gagal membuat draft.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat draft.')
    } finally {
      setLoading(false)
    }
  }

  if (draft) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
          <CheckCircle2 className="h-3 w-3" />
          Draft
        </span>
        <Link href={draft.editPath} className="max-w-[260px] truncate text-xs font-black text-arkara-green underline decoration-2 underline-offset-4 hover:text-arkara-amber">
          {draft.title}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={contentType}
          onChange={(event) => setContentType(event.target.value as 'auto' | 'post' | 'panduan')}
          disabled={loading || disabled}
          className="h-8 rounded-md border border-gray-100 bg-white px-2 text-xs font-black text-arkara-green outline-none focus:border-arkara-amber disabled:opacity-60"
        >
          <option value="auto">Auto</option>
          <option value="post">Blog</option>
          <option value="panduan">Panduan</option>
        </select>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || disabled}
          className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-arkara-green px-3 text-[10px] font-black uppercase tracking-[0.12em] text-white hover:bg-arkara-amber hover:text-arkara-green disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus2 className="h-3.5 w-3.5" />}
          Draft
        </button>
      </div>
      {error ? <p className="max-w-[360px] text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  )
}
