"use client"

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Database, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import {
  actionDeleteSeoKeywordSignal,
  actionImportSeoKeywordSignals,
  actionUpdateSeoKeywordSignal,
} from '@/app/cms/seo/actions'
import {
  SEO_KEYWORD_SIGNAL_CLUSTERS,
  SEO_KEYWORD_SIGNAL_PRIORITIES,
  SEO_KEYWORD_SIGNAL_SOURCES,
  SEO_KEYWORD_SIGNAL_STATUSES,
  type SeoKeywordSignal,
  type SeoKeywordSignalCluster,
  type SeoKeywordSignalPriority,
  type SeoKeywordSignalSource,
  type SeoKeywordSignalStatus,
} from '@/lib/seo/keyword-signals.shared'

interface SeoKeywordSignalsPanelProps {
  items: SeoKeywordSignal[]
}

interface EditableKeywordSignal {
  query: string
  source: SeoKeywordSignalSource
  cluster: SeoKeywordSignalCluster | ''
  landingPage: string
  impressions: string
  clicks: string
  ctr: string
  averagePosition: string
  intent: string
  priority: SeoKeywordSignalPriority
  status: SeoKeywordSignalStatus
  notes: string
}

const sourceLabels: Record<SeoKeywordSignalSource, string> = {
  google_search_console: 'Google Search Console',
  bing_webmaster: 'Bing Webmaster',
  manual: 'Manual',
}

const clusterLabels: Record<SeoKeywordSignalCluster, string> = {
  air: 'Air',
  energi: 'Energi',
  pangan: 'Pangan',
  medis: 'Medis',
  keamanan: 'Keamanan',
  komunitas: 'Komunitas',
}

const priorityLabels: Record<SeoKeywordSignalPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const statusLabels: Record<SeoKeywordSignalStatus, string> = {
  active: 'Active',
  ignored: 'Ignored',
  used: 'Used',
}

function toEditable(item: SeoKeywordSignal): EditableKeywordSignal {
  return {
    query: item.query,
    source: item.source,
    cluster: item.cluster ?? '',
    landingPage: item.landingPage,
    impressions: String(item.impressions),
    clicks: String(item.clicks),
    ctr: item.ctr === null ? '' : String(Number((item.ctr * 100).toFixed(2))),
    averagePosition: item.averagePosition === null ? '' : String(item.averagePosition),
    intent: item.intent ?? '',
    priority: item.priority,
    status: item.status,
    notes: item.notes ?? '',
  }
}

function numberValue(value: string): number {
  const normalized = value.trim().replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function SeoKeywordSignalsPanel({ items }: SeoKeywordSignalsPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [source, setSource] = useState<SeoKeywordSignalSource>('google_search_console')
  const [cluster, setCluster] = useState<SeoKeywordSignalCluster | ''>('')
  const [rawText, setRawText] = useState('')
  const [rows, setRows] = useState(items)
  const [editing, setEditing] = useState<Record<string, EditableKeywordSignal>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setRows(items)
    setEditing({})
  }, [items])

  const importSignals = () => {
    setError(null)
    setMessage(null)

    startTransition(async () => {
      const response = await actionImportSeoKeywordSignals({
        source,
        cluster: cluster || null,
        rawText,
      })

      if (!response.success) {
        setError(response.error ?? 'Gagal menyimpan keyword.')
        return
      }

      setRawText('')
      setMessage(`${response.data?.importedCount ?? 0} keyword tersimpan.`)
      router.refresh()
    })
  }

  const updateDraft = (id: string, patch: Partial<EditableKeywordSignal>) => {
    setEditing((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? toEditable(rows.find((item) => item.id === id)!)),
        ...patch,
      },
    }))
  }

  const saveRow = (item: SeoKeywordSignal) => {
    const draft = editing[item.id] ?? toEditable(item)
    setError(null)
    setMessage(null)

    startTransition(async () => {
      const response = await actionUpdateSeoKeywordSignal({
        id: item.id,
        query: draft.query,
        source: draft.source,
        cluster: draft.cluster || null,
        landingPage: draft.landingPage,
        impressions: numberValue(draft.impressions),
        clicks: numberValue(draft.clicks),
        ctr: draft.ctr.trim() ? numberValue(draft.ctr) / 100 : null,
        averagePosition: draft.averagePosition.trim() ? numberValue(draft.averagePosition) : null,
        intent: draft.intent.trim() || null,
        priority: draft.priority,
        status: draft.status,
        notes: draft.notes.trim() || null,
      })

      if (!response.success) {
        setError(response.error ?? 'Gagal update keyword.')
        return
      }

      setEditing((current) => {
        const next = { ...current }
        delete next[item.id]
        return next
      })
      setMessage('Keyword diperbarui.')
      router.refresh()
    })
  }

  const deleteRow = (item: SeoKeywordSignal) => {
    setError(null)
    setMessage(null)

    startTransition(async () => {
      const response = await actionDeleteSeoKeywordSignal({ id: item.id })

      if (!response.success) {
        setError(response.error ?? 'Gagal hapus keyword.')
        return
      }

      setRows((current) => current.filter((row) => row.id !== item.id))
      setMessage('Keyword dihapus.')
      router.refresh()
    })
  }

  return (
    <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">GSC / Bing</p>
          <h2 className="text-xl font-black text-arkara-green">Keyword intelligence</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-gray-500">
          <Database className="h-4 w-4" />
          {rows.length} keyword
        </div>
      </div>

      <div className="grid gap-4 border-b border-gray-100 p-5 xl:grid-cols-[1fr_220px]">
        <textarea
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          rows={5}
          className="min-h-[140px] rounded-md border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-arkara-amber"
          placeholder="query, clicks, impressions, ctr, position, page"
        />
        <div className="space-y-3">
          <select
            value={source}
            onChange={(event) => setSource(event.target.value as SeoKeywordSignalSource)}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-arkara-green outline-none focus:border-arkara-amber"
          >
            {SEO_KEYWORD_SIGNAL_SOURCES.map((item) => (
              <option key={item} value={item}>{sourceLabels[item]}</option>
            ))}
          </select>
          <select
            value={cluster}
            onChange={(event) => setCluster(event.target.value as SeoKeywordSignalCluster | '')}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-arkara-green outline-none focus:border-arkara-amber"
          >
            <option value="">Tanpa cluster</option>
            {SEO_KEYWORD_SIGNAL_CLUSTERS.map((item) => (
              <option key={item} value={item}>{clusterLabels[item]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={importSignals}
            disabled={isPending || !rawText.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-arkara-green px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-arkara-amber hover:text-arkara-green disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Simpan
          </button>
        </div>
      </div>

      {message ? (
        <div className="mx-5 mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mx-5 mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              <th className="px-5 py-3">Keyword</th>
              <th className="px-5 py-3">Source</th>
              <th className="px-5 py-3">Metrics</th>
              <th className="px-5 py-3">Page</th>
              <th className="px-5 py-3">Intent</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm font-semibold text-gray-400">
                  Belum ada keyword signal.
                </td>
              </tr>
            ) : rows.map((item) => {
              const draft = editing[item.id] ?? toEditable(item)

              return (
                <tr key={item.id} className="align-top">
                  <td className="px-5 py-4">
                    <input
                      value={draft.query}
                      onChange={(event) => updateDraft(item.id, { query: event.target.value })}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-bold text-arkara-green outline-none focus:border-arkara-amber"
                    />
                    <textarea
                      value={draft.notes}
                      onChange={(event) => updateDraft(item.id, { notes: event.target.value })}
                      rows={2}
                      className="mt-2 w-full rounded-md border border-gray-100 px-3 py-2 text-xs font-semibold text-gray-500 outline-none focus:border-arkara-amber"
                      placeholder="catatan"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      <select
                        value={draft.source}
                        onChange={(event) => updateDraft(item.id, { source: event.target.value as SeoKeywordSignalSource })}
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-arkara-amber"
                      >
                        {SEO_KEYWORD_SIGNAL_SOURCES.map((option) => (
                          <option key={option} value={option}>{sourceLabels[option]}</option>
                        ))}
                      </select>
                      <select
                        value={draft.cluster}
                        onChange={(event) => updateDraft(item.id, { cluster: event.target.value as SeoKeywordSignalCluster | '' })}
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-arkara-amber"
                      >
                        <option value="">No cluster</option>
                        {SEO_KEYWORD_SIGNAL_CLUSTERS.map((option) => (
                          <option key={option} value={option}>{clusterLabels[option]}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={draft.impressions}
                        onChange={(event) => updateDraft(item.id, { impressions: event.target.value })}
                        className="rounded-md border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-arkara-amber"
                        aria-label="Impressions"
                      />
                      <input
                        value={draft.clicks}
                        onChange={(event) => updateDraft(item.id, { clicks: event.target.value })}
                        className="rounded-md border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-arkara-amber"
                        aria-label="Clicks"
                      />
                      <input
                        value={draft.ctr}
                        onChange={(event) => updateDraft(item.id, { ctr: event.target.value })}
                        className="rounded-md border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-arkara-amber"
                        aria-label="CTR percent"
                        placeholder="CTR %"
                      />
                      <input
                        value={draft.averagePosition}
                        onChange={(event) => updateDraft(item.id, { averagePosition: event.target.value })}
                        className="rounded-md border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-arkara-amber"
                        aria-label="Average position"
                        placeholder="Posisi"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <input
                      value={draft.landingPage}
                      onChange={(event) => updateDraft(item.id, { landingPage: event.target.value })}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 outline-none focus:border-arkara-amber"
                      placeholder="/blog/slug"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <input
                      value={draft.intent}
                      onChange={(event) => updateDraft(item.id, { intent: event.target.value })}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 outline-none focus:border-arkara-amber"
                      placeholder="informational"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      <select
                        value={draft.priority}
                        onChange={(event) => updateDraft(item.id, { priority: event.target.value as SeoKeywordSignalPriority })}
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-arkara-amber"
                      >
                        {SEO_KEYWORD_SIGNAL_PRIORITIES.map((option) => (
                          <option key={option} value={option}>{priorityLabels[option]}</option>
                        ))}
                      </select>
                      <select
                        value={draft.status}
                        onChange={(event) => updateDraft(item.id, { status: event.target.value as SeoKeywordSignalStatus })}
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-arkara-amber"
                      >
                        {SEO_KEYWORD_SIGNAL_STATUSES.map((option) => (
                          <option key={option} value={option}>{statusLabels[option]}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => saveRow(item)}
                        disabled={isPending}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-arkara-green text-white hover:bg-arkara-amber hover:text-arkara-green disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Simpan ${item.query}`}
                      >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(item)}
                        disabled={isPending}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-100 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Hapus ${item.query}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
