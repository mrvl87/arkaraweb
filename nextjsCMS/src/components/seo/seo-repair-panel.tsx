"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ExternalLink, Loader2, Save, Sparkles } from 'lucide-react'
import { actionApplySeoRepairPlan, actionGenerateSeoRepairPlan } from '@/app/cms/seo/actions'
import type { GenerateSeoRepairPlanOutput } from '@/lib/ai/schemas'
import type { SeoAuditItem } from '@/lib/seo/content-audit'
import type { SerperKeywordOpportunity } from '@/lib/seo/serper'

interface SeoRepairPanelProps {
  repairItems: SeoAuditItem[]
  keywordOpportunities: SerperKeywordOpportunity[]
}

type RepairResult = GenerateSeoRepairPlanOutput | null
type ApplyResult = {
  title: string
  slug: string
  publicPath: string
  editPath: string
  updatedAt: string
  appliedFields: string[]
  indexingQueued: boolean
  indexingQueueError?: string
} | null
type FixedLink = NonNullable<ApplyResult> & {
  id: string
  type: SeoAuditItem['type']
}

const FIXED_LINKS_STORAGE_KEY = 'arkara.seo.recent-fixed-links'
const PUBLIC_SITE_URL = normalizePublicOrigin(process.env.NEXT_PUBLIC_FRONTEND_SITE_URL || 'https://arkaraweb.com')

function normalizePublicOrigin(value: string): string {
  try {
    return new URL(value).origin
  } catch {
    return 'https://arkaraweb.com'
  }
}

function normalizePublicPath(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '/'

  try {
    const url = new URL(trimmed, PUBLIC_SITE_URL)
    return `${url.pathname}${url.search}${url.hash}` || '/'
  } catch {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }
}

function toCanonicalPublicUrl(value: string): string {
  return new URL(normalizePublicPath(value), PUBLIC_SITE_URL).href
}

function getRelevantKeywordOpportunities(
  item: SeoAuditItem | null,
  opportunities: SerperKeywordOpportunity[]
) {
  if (!item) return []

  const sameCluster = opportunities.filter((opportunity) => opportunity.cluster === item.category)
  const gapsFirst = [...sameCluster].sort((left, right) => {
    const leftRank = left.arkaraRank ?? 999
    const rightRank = right.arkaraRank ?? 999
    return rightRank - leftRank || left.query.localeCompare(right.query)
  })

  return gapsFirst.slice(0, 4)
}

function fieldBlock(label: string, value: string | string[]) {
  const text = Array.isArray(value) ? value.join('\n') : value

  if (!text.trim()) return null

  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-gray-700">{text}</p>
    </div>
  )
}

function getItemKey(item: Pick<SeoAuditItem, 'type' | 'id'>): string {
  return `${item.type}:${item.id}`
}

function loadFixedLinks(): FixedLink[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(FIXED_LINKS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is FixedLink => Boolean(item?.id && item?.type && item?.publicPath))
      .map((item) => ({
        ...item,
        publicPath: normalizePublicPath(item.publicPath),
      }))
      .slice(0, 8)
  } catch {
    return []
  }
}

function saveFixedLinks(items: FixedLink[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FIXED_LINKS_STORAGE_KEY, JSON.stringify(items.slice(0, 8)))
}

export function SeoRepairPanel({ repairItems, keywordOpportunities }: SeoRepairPanelProps) {
  const router = useRouter()
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [fixedLinks, setFixedLinks] = useState<FixedLink[]>([])
  const visibleRepairItems = useMemo(
    () => repairItems.filter((item) => !hiddenIds.includes(getItemKey(item))),
    [hiddenIds, repairItems]
  )
  const [selectedId, setSelectedId] = useState(visibleRepairItems[0] ? getItemKey(visibleRepairItems[0]) : '')
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [approved, setApproved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applyResult, setApplyResult] = useState<ApplyResult>(null)
  const [result, setResult] = useState<RepairResult>(null)

  const selectedItem = useMemo(
    () => visibleRepairItems.find((item) => getItemKey(item) === selectedId) ?? null,
    [selectedId, visibleRepairItems]
  )
  const selectedKeywords = useMemo(
    () => getRelevantKeywordOpportunities(selectedItem, keywordOpportunities),
    [keywordOpportunities, selectedItem]
  )

  useEffect(() => {
    const storedLinks = loadFixedLinks()
    setFixedLinks(storedLinks)
    saveFixedLinks(storedLinks)
  }, [])

  useEffect(() => {
    if (visibleRepairItems.length === 0) {
      setSelectedId('')
      return
    }

    if (!visibleRepairItems.some((item) => getItemKey(item) === selectedId)) {
      setSelectedId(getItemKey(visibleRepairItems[0]))
      setResult(null)
      setError(null)
      setApplyError(null)
      setApplyResult(null)
      setApproved(false)
    }
  }, [selectedId, visibleRepairItems])

  const handleGenerate = async () => {
    if (!selectedItem) return

    setLoading(true)
    setError(null)
    setApplyError(null)
    setApplyResult(null)
    setApproved(false)
    setResult(null)

    try {
      const response = await actionGenerateSeoRepairPlan({
        contentType: selectedItem.type,
        contentId: selectedItem.id,
        issues: selectedItem.issues,
        keywordOpportunities: selectedKeywords.map((item) => ({
          query: item.query,
          arkaraRank: item.arkaraRank,
          topCompetitors: item.topCompetitors,
          peopleAlsoAsk: item.peopleAlsoAsk,
          relatedSearches: item.relatedSearches,
        })),
      })

      if (response.success) {
        setResult(response.data)
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat proposal repair.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!selectedItem || !result || !approved) return

    setApplying(true)
    setApplyError(null)
    setApplyResult(null)

    try {
      const response = await actionApplySeoRepairPlan({
        contentType: selectedItem.type,
        contentId: selectedItem.id,
        proposal: result,
        baseUpdatedAt: selectedItem.updatedAt,
        approved: true,
      })

      if (response.success && response.data) {
        const fixedItem: FixedLink = {
          ...response.data,
          id: selectedItem.id,
          type: selectedItem.type,
        }
        const nextFixedLinks = [
          fixedItem,
          ...fixedLinks.filter((item) => getItemKey(item) !== getItemKey(selectedItem)),
        ].slice(0, 8)
        setFixedLinks(nextFixedLinks)
        saveFixedLinks(nextFixedLinks)
        setHiddenIds((current) => [...new Set([...current, getItemKey(selectedItem)])])
        setApplyResult(response.data)
        setResult(null)
        setApproved(false)
        router.refresh()
      } else {
        setApplyError(response.error ?? 'Gagal menerapkan proposal SEO.')
      }
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Gagal menerapkan proposal SEO.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <section className="rounded-lg border border-arkara-green/10 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Approval gate</p>
          <h2 className="text-xl font-black text-arkara-green">Generate repair proposal</h2>
          <p className="mt-1 text-sm font-semibold text-gray-500">
            Generate proposal, cek hasilnya, lalu apply setelah disetujui.
          </p>
        </div>
        {visibleRepairItems.length > 0 ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedId}
              onChange={(event) => {
                setSelectedId(event.target.value)
                setResult(null)
                setError(null)
                setApplyError(null)
                setApplyResult(null)
                setApproved(false)
              }}
              className="min-w-[280px] rounded-md border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-arkara-green outline-none focus:border-arkara-amber"
            >
              {visibleRepairItems.map((item) => (
                <option key={getItemKey(item)} value={getItemKey(item)}>
                  [{item.type}] {item.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedItem || loading}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-arkara-green px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-arkara-amber hover:text-arkara-green disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate Fix
            </button>
          </div>
        ) : null}
      </div>

      {fixedLinks.length > 0 ? (
        <div className="border-b border-gray-100 bg-emerald-50/40 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Recently fixed</p>
              <h3 className="text-sm font-black text-arkara-green">Link yang baru diperbaiki</h3>
            </div>
            <span className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs font-black text-emerald-700">
              {fixedLinks.length}
            </span>
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            {fixedLinks.map((item) => (
              <div key={`${item.type}:${item.id}:${item.updatedAt}`} className="flex items-center justify-between gap-3 rounded-md border border-emerald-100 bg-white px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-arkara-green">{item.title}</p>
                  <p className="truncate text-xs font-semibold text-gray-500">{toCanonicalPublicUrl(item.publicPath)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={item.editPath}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-arkara-green text-white hover:bg-arkara-amber hover:text-arkara-green"
                    aria-label={`Edit ${item.title}`}
                  >
                    <Save className="h-4 w-4" />
                  </Link>
                  <a
                    href={toCanonicalPublicUrl(item.publicPath)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-100 bg-white text-arkara-green hover:border-arkara-amber hover:text-arkara-amber"
                    aria-label={`Buka ${item.title}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {visibleRepairItems.length === 0 ? (
        <div className="p-5 text-sm font-semibold text-gray-500">Tidak ada proposal repair aktif.</div>
      ) : null}

      {selectedItem ? (
        <div className="grid gap-4 border-b border-gray-100 p-5 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Issue aktif</p>
            <div className="flex flex-wrap gap-2">
              {selectedItem.issues.map((issue) => (
                <span key={`${issue.code}:${issue.label}`} className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600">
                  {issue.label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Data Serper yang dipakai</p>
            <div className="flex flex-wrap gap-2">
              {selectedKeywords.length > 0 ? selectedKeywords.map((item) => (
                <span key={item.query} className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600">
                  {item.query}
                </span>
              )) : (
                <span className="text-xs font-semibold text-gray-400">Belum ada data Serper untuk cluster ini.</span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="m-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {applyError ? (
        <div className="m-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {applyError}
        </div>
      ) : null}

      {applyResult ? (
        <div className="m-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Proposal sudah diterapkan ke "{applyResult.title}". Field: {applyResult.appliedFields.join(', ')}.
          {applyResult.indexingQueued ? ' URL masuk indexing queue.' : applyResult.indexingQueueError ? ` Indexing queue: ${applyResult.indexingQueueError}` : ''}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-black">Proposal siap dievaluasi. Klik apply untuk update database.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {fieldBlock('Summary', result.summary)}
            {fieldBlock('Target keyword', [result.target_keyword, ...result.secondary_keywords].join('\n'))}
            {fieldBlock('Meta title', result.proposed_meta_title)}
            {fieldBlock('Meta description', result.proposed_meta_desc)}
            {fieldBlock('Quick answer', result.proposed_quick_answer)}
            {fieldBlock('Key takeaways', result.proposed_key_takeaways.map((item) => `- ${item}`))}
            {fieldBlock('FAQ', result.proposed_faq.map((item) => `Q: ${item.question}\nA: ${item.answer}`))}
            {fieldBlock(
              `Content patch: ${result.content_patch.mode}`,
              [result.content_patch.placement_note ?? '', result.content_patch.markdown].filter(Boolean).join('\n\n')
            )}
            {fieldBlock('Internal link notes', result.internal_link_notes.map((item) => `- ${item}`))}
            {fieldBlock('Fact-check notes', result.fact_check_notes.map((item) => `- ${item}`))}
            {fieldBlock('Approval notes', result.approval_notes.map((item) => `- ${item}`))}
          </div>
          <div className="flex flex-col gap-4 rounded-md border border-arkara-green/10 bg-arkara-cream/40 p-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex items-start gap-3 text-sm font-bold leading-relaxed text-arkara-green">
              <input
                type="checkbox"
                checked={approved}
                onChange={(event) => setApproved(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-arkara-green focus:ring-arkara-amber"
              />
              Saya sudah evaluasi proposal dan setuju artikel diperbarui otomatis.
            </label>
            <button
              type="button"
              onClick={handleApply}
              disabled={!approved || applying || Boolean(applyResult)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-arkara-amber px-5 py-3 text-xs font-black uppercase tracking-widest text-arkara-green shadow-sm hover:bg-arkara-green hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Apply Proposal
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
