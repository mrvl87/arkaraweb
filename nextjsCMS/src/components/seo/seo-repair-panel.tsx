"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { actionApplySeoRepairPlan, actionGenerateSeoRepairPlan } from '@/app/cms/seo/actions'
import type { GenerateSeoRepairPlanOutput } from '@/lib/ai/schemas'
import type { SeoAuditItem } from '@/lib/seo/content-audit'
import type { SerperKeywordOpportunity } from '@/lib/seo/serper'
import { RecentlyFixedLinks, type RecentlyFixedLink } from './recently-fixed-links'
import { RepairDiffPreview } from './repair-diff-preview'
import { RepairSelectionDetails, RepairSelector } from './repair-selector'
import { RepairStatusMessages, type RepairApplyResult } from './repair-status-messages'

interface SeoRepairPanelProps {
  repairItems: SeoAuditItem[]
  keywordOpportunities: SerperKeywordOpportunity[]
}

type RepairResult = GenerateSeoRepairPlanOutput | null
type ApplyResult = RepairApplyResult | null
type FixedLink = RecentlyFixedLink

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

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setResult(null)
    setError(null)
    setApplyError(null)
    setApplyResult(null)
    setApproved(false)
  }

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
    <section id="repair-panel" className="scroll-mt-6 rounded-lg border border-arkara-green/10 bg-white shadow-sm">
      <RepairSelector
        repairItems={visibleRepairItems}
        selectedId={selectedId}
        selectedItem={selectedItem}
        loading={loading}
        getItemKey={getItemKey}
        onSelect={handleSelect}
        onGenerate={handleGenerate}
      />

      <RecentlyFixedLinks fixedLinks={fixedLinks} toCanonicalPublicUrl={toCanonicalPublicUrl} />

      <RepairSelectionDetails selectedItem={selectedItem} selectedKeywords={selectedKeywords} />

      <RepairStatusMessages
        hasRepairItems={visibleRepairItems.length > 0}
        error={error}
        applyError={applyError}
        applyResult={applyResult}
        showReadyMessage={false}
      />

      {result && selectedItem ? (
        <div className="space-y-4 p-5">
          <RepairStatusMessages
            hasRepairItems
            error={null}
            applyError={null}
            applyResult={null}
            showReadyMessage
          />

          <RepairDiffPreview item={selectedItem} result={result} />

          <div className="grid gap-4 lg:grid-cols-2">
            {fieldBlock('Summary', result.summary)}
            {fieldBlock('Target keyword', [result.target_keyword, ...result.secondary_keywords].join('\n'))}
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
              Saya sudah memeriksa before/after proposal dan setuju artikel diperbarui otomatis.
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