import Link from 'next/link'
import {
  AlertTriangle,
  ArrowUpRight,
  FilePlus2,
  Radar,
  SearchCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SeoCockpitData } from '@/lib/seo/content-audit'
import type { SeoIndexingQueueItem } from '@/lib/seo/indexing-queue'

interface TodaysSeoActionsProps {
  data: SeoCockpitData
  indexingQueue: {
    items: SeoIndexingQueueItem[]
    error?: string
  }
}

interface DailySeoAction {
  id: string
  icon: LucideIcon
  label: string
  title: string
  description: string
  meta: string[]
  href: string
  cta: string
  tone: 'critical' | 'draft' | 'indexing' | 'signal'
  rank: number
}

const formatter = new Intl.NumberFormat('id-ID')

function getCriticalRepairActions(data: SeoCockpitData): DailySeoAction[] {
  return data.topFixes
    .filter((item) => item.issues.some((issue) => issue.severity === 'critical'))
    .sort((left, right) => left.score - right.score || right.issues.length - left.issues.length)
    .slice(0, 2)
    .map((item) => {
      const criticalCount = item.issues.filter((issue) => issue.severity === 'critical').length

      return {
        id: `repair:${item.type}:${item.id}`,
        icon: AlertTriangle,
        label: 'Repair critical',
        title: item.title,
        description: item.issues[0]?.label ?? 'Konten punya issue critical yang perlu diperbaiki.',
        meta: [
          item.type,
          `${criticalCount} critical`,
          `Readiness ${item.score}`,
        ],
        href: '#repair-panel',
        cta: 'Buka repair',
        tone: 'critical',
        rank: 10 + item.score,
      }
    })
}

function getKeywordGapActions(data: SeoCockpitData): DailySeoAction[] {
  return data.keywordOpportunities
    .filter((item) => item.arkaraRank === null && item.source !== 'missing-key' && item.source !== 'error')
    .sort((left, right) => {
      const leftSignals = left.topCompetitors.length + left.peopleAlsoAsk.length + left.relatedSearches.length
      const rightSignals = right.topCompetitors.length + right.peopleAlsoAsk.length + right.relatedSearches.length

      return rightSignals - leftSignals || left.query.localeCompare(right.query)
    })
    .slice(0, 2)
    .map((item, index) => ({
      id: `gap:${item.cluster}:${item.query}`,
      icon: FilePlus2,
      label: 'Draft opportunity',
      title: item.query,
      description: 'Keyword gap belum punya ranking Arkara. Layak dibuat draft dari data Serper.',
      meta: [
        item.cluster,
        `${formatter.format(item.topCompetitors.length)} kompetitor`,
        item.source,
      ],
      href: '#keyword-gap',
      cta: 'Buat draft',
      tone: 'draft',
      rank: 40 + index,
    }))
}

function getPendingIndexingActions(indexingQueue: TodaysSeoActionsProps['indexingQueue']): DailySeoAction[] {
  return indexingQueue.items
    .filter((item) => item.status === 'pending')
    .slice(0, 2)
    .map((item, index) => ({
      id: `indexing:${item.id}`,
      icon: SearchCheck,
      label: 'Pending indexing',
      title: item.title,
      description: 'URL sudah masuk queue dan masih menunggu submit indexing.',
      meta: [
        item.content_type,
        item.source.replace(/_/g, ' '),
        item.indexing_type,
      ],
      href: '#indexing-queue',
      cta: 'Buka queue',
      tone: 'indexing',
      rank: 60 + index,
    }))
}

function getKeywordSignalActions(data: SeoCockpitData): DailySeoAction[] {
  return data.keywordSignals
    .filter((item) => item.priority === 'high' && item.status !== 'used')
    .sort((left, right) => right.clicks - left.clicks || right.impressions - left.impressions)
    .slice(0, 2)
    .map((item, index) => ({
      id: `signal:${item.id}`,
      icon: Radar,
      label: 'High signal',
      title: item.query,
      description: item.intent ?? 'Keyword signal high priority belum ditandai used.',
      meta: [
        item.cluster ?? 'unknown',
        `${formatter.format(item.impressions)} impresi`,
        `${formatter.format(item.clicks)} klik`,
      ],
      href: '#keyword-signals',
      cta: 'Lihat signal',
      tone: 'signal',
      rank: 80 + index,
    }))
}

function getTodaysActions(data: SeoCockpitData, indexingQueue: TodaysSeoActionsProps['indexingQueue']) {
  const criticalActions = getCriticalRepairActions(data)
  const gapActions = getKeywordGapActions(data)
  const indexingActions = getPendingIndexingActions(indexingQueue)
  const signalActions = getKeywordSignalActions(data)
  const firstByCategory = [
    criticalActions[0],
    gapActions[0],
    indexingActions[0],
    signalActions[0],
  ].filter((item): item is DailySeoAction => Boolean(item))
  const extraActions = [
    ...criticalActions.slice(1),
    ...gapActions.slice(1),
    ...indexingActions.slice(1),
    ...signalActions.slice(1),
  ].sort((left, right) => left.rank - right.rank)

  return [...firstByCategory, ...extraActions].slice(0, 5)
}

function toneClass(tone: DailySeoAction['tone']): string {
  switch (tone) {
    case 'critical':
      return 'border-red-100 bg-red-50 text-red-700'
    case 'draft':
      return 'border-amber-100 bg-amber-50 text-amber-700'
    case 'indexing':
      return 'border-sky-100 bg-sky-50 text-sky-700'
    case 'signal':
      return 'border-emerald-100 bg-emerald-50 text-emerald-700'
  }
}

export function TodaysSeoActions({ data, indexingQueue }: TodaysSeoActionsProps) {
  const actions = getTodaysActions(data, indexingQueue)

  return (
    <section className="rounded-lg border border-arkara-green/10 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Daily workflow</p>
          <h2 className="text-xl font-black text-arkara-green">Today's SEO Actions</h2>
          <p className="mt-1 text-sm font-semibold text-gray-500">
            Prioritas kerja hari ini dari repair critical, keyword gap, indexing queue, dan keyword signal.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-gray-500">
          {actions.length} aksi
        </span>
      </div>

      {actions.length > 0 ? (
        <div className="grid gap-3 p-5 xl:grid-cols-5">
          {actions.map((action) => {
            const Icon = action.icon

            return (
              <article key={action.id} className="flex min-h-full flex-col rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneClass(action.tone)}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {action.label}
                  </span>
                </div>
                <h3 className="line-clamp-2 text-sm font-black leading-snug text-arkara-green">{action.title}</h3>
                <p className="mt-2 line-clamp-3 text-xs font-semibold leading-relaxed text-gray-500">{action.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {action.meta.map((item) => (
                    <span key={item} className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-gray-500">
                      {item}
                    </span>
                  ))}
                </div>
                <Link
                  href={action.href}
                  className="mt-auto inline-flex w-fit items-center gap-2 pt-5 text-xs font-black uppercase tracking-widest text-arkara-green hover:text-arkara-amber"
                >
                  {action.cta}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="p-5">
          <div className="rounded-md border border-gray-100 bg-gray-50 p-5 text-sm font-semibold text-gray-500">
            Tidak ada aksi prioritas baru. Pantau metric readiness, keyword gap, dan indexing queue berikutnya.
          </div>
        </div>
      )}

      {indexingQueue.error ? (
        <div className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-xs font-bold text-amber-700">
          Indexing queue belum bisa dibaca: {indexingQueue.error}
        </div>
      ) : null}
    </section>
  )
}
