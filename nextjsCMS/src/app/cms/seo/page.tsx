import Link from 'next/link'
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  FileText,
  Gauge,
  Globe2,
  ListChecks,
  Radar,
  Search,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getSeoCockpitData, type SeoAuditItem, type SeoClusterStatus, type SeoIssue } from '@/lib/seo/content-audit'
import { SeoRepairPanel } from '@/components/seo/seo-repair-panel'
import { SeoGapDraftButton } from '@/components/seo/seo-gap-draft-button'
import { SeoIndexingQueuePanel } from '@/components/seo/seo-indexing-queue-panel'
import { SeoKeywordSignalsPanel } from '@/components/seo/seo-keyword-signals-panel'
import { getSeoIndexingQueue } from '@/lib/seo/indexing-queue'

const formatter = new Intl.NumberFormat('id-ID')

function scoreClass(score: number): string {
  if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (score >= 70) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-red-700 bg-red-50 border-red-200'
}

function severityClass(severity: SeoIssue['severity']): string {
  if (severity === 'critical') return 'bg-red-50 text-red-700 border-red-200'
  if (severity === 'warning') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-slate-50 text-slate-600 border-slate-200'
}

function typeLabel(type: SeoAuditItem['type']): string {
  return type === 'post' ? 'Blog' : 'Panduan'
}

function sourceLabel(source: string): string {
  switch (source) {
    case 'live':
      return 'live'
    case 'cache':
      return 'cache'
    case 'stale-cache':
      return 'stale'
    case 'missing-key':
      return 'no key'
    case 'error':
      return 'error'
    default:
      return source
  }
}

function visibleItems<T>(items: T[], limit: number) {
  return {
    visible: items.slice(0, limit),
    remaining: Math.max(0, items.length - limit),
  }
}

function MetricCard({
  label,
  value,
  suffix,
  icon: Icon,
}: {
  label: string
  value: number
  suffix?: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="rounded-md bg-arkara-cream p-2 text-arkara-green">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-300">SEO</span>
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-arkara-green">
        {formatter.format(value)}
        {suffix ? <span className="text-lg text-arkara-amber">{suffix}</span> : null}
      </p>
    </div>
  )
}

function ClusterPanel({ cluster }: { cluster: SeoClusterStatus }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cluster</p>
          <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-arkara-green">{cluster.label}</h3>
        </div>
        <span className={`rounded-md border px-2.5 py-1 text-xs font-black ${scoreClass(cluster.averageScore)}`}>
          {cluster.averageScore}
        </span>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-gray-50 p-2">
          <p className="text-lg font-black text-arkara-green">{cluster.publishedCount}</p>
          <p className="text-[10px] font-bold uppercase text-gray-400">Published</p>
        </div>
        <div className="rounded-md bg-gray-50 p-2">
          <p className="text-lg font-black text-arkara-green">{cluster.draftCount}</p>
          <p className="text-[10px] font-bold uppercase text-gray-400">Draft</p>
        </div>
        <div className="rounded-md bg-gray-50 p-2">
          <p className="text-lg font-black text-arkara-green">{cluster.weakContentCount}</p>
          <p className="text-[10px] font-bold uppercase text-gray-400">Weak</p>
        </div>
      </div>
      <div className="space-y-2">
        {cluster.seedKeywords.map((keyword) => (
          <div key={keyword} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
            {keyword}
          </div>
        ))}
      </div>
    </div>
  )
}

function FixRow({ item }: { item: SeoAuditItem }) {
  const firstIssue = item.issues[0]

  return (
    <div className="grid gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0 md:grid-cols-[1fr_160px_110px] md:items-center">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-arkara-green/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-arkara-green">
            {typeLabel(item.type)}
          </span>
          <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">
            {item.status}
          </span>
          {firstIssue ? (
            <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${severityClass(firstIssue.severity)}`}>
              {firstIssue.severity}
            </span>
          ) : null}
        </div>
        <h3 className="truncate text-base font-black text-arkara-green">{item.title}</h3>
        <p className="mt-1 text-sm text-gray-500">{firstIssue?.label ?? 'Siap'}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs md:grid-cols-1 md:text-left">
        <span className="rounded-md bg-gray-50 px-2 py-1 font-bold text-gray-600">{formatter.format(item.wordCount)} kata</span>
        <span className="rounded-md bg-gray-50 px-2 py-1 font-bold text-gray-600">{item.faqCount} FAQ</span>
        <span className="rounded-md bg-gray-50 px-2 py-1 font-bold text-gray-600">{item.internalLinkCount} link</span>
      </div>
      <div className="flex items-center justify-between gap-3 md:justify-end">
        <span className={`rounded-md border px-3 py-2 text-sm font-black ${scoreClass(item.score)}`}>
          {item.score}
        </span>
        <Link
          href={item.editHref}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-arkara-green text-white hover:bg-arkara-amber hover:text-arkara-green"
          aria-label={`Edit ${item.title}`}
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

export default async function SEOCockpitPage() {
  const [data, indexingQueue] = await Promise.all([
    getSeoCockpitData(),
    getSeoIndexingQueue(),
  ])

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col gap-5 border-b border-arkara-green/5 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-arkara-green px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
            <Radar className="h-4 w-4" />
            Agentic SEO
          </div>
          <h1 className="text-4xl font-extrabold uppercase italic tracking-tighter text-arkara-green">
            SEO <span className="text-arkara-amber">Cockpit</span>
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-gray-500">
            Audit kesiapan konten untuk schema, answer-first structure, internal link, dan prompt visibility Arkara.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/cms/ai"
            className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-arkara-green shadow-sm ring-1 ring-gray-100 hover:text-arkara-amber"
          >
            <Bot className="h-4 w-4" />
            AI Workspace
          </Link>
          <Link
            href="/cms/posts/new"
            className="inline-flex items-center gap-2 rounded-md bg-arkara-green px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-arkara-amber hover:text-arkara-green"
          >
            <FileText className="h-4 w-4" />
            Draft Baru
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Rata-rata score" value={data.summary.averageScore} icon={Gauge} />
        <MetricCard label="Quick answer" value={data.summary.quickAnswerCoverage} suffix="%" icon={CheckCircle2} />
        <MetricCard label="FAQ coverage" value={data.summary.faqCoverage} suffix="%" icon={ListChecks} />
        <MetricCard label="Keyword gaps" value={data.summary.keywordGapCount} icon={Globe2} />
      </div>

      <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Serper automation</p>
            <h2 className="text-xl font-black text-arkara-green">Keyword gap otomatis</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-md border px-3 py-2 text-xs font-black uppercase tracking-widest ${
              data.serper.configured
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              {data.serper.configured ? 'Serper aktif' : 'SERPER_API_KEY kosong'}
            </span>
            <span className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-gray-500">
              {data.serper.gl}/{data.serper.hl} · cache {data.serper.cacheHours} jam
            </span>
          </div>
        </div>
        <div className="max-h-[520px] divide-y divide-gray-100 overflow-y-auto">
          {data.keywordOpportunities.map((item) => {
            const competitors = visibleItems(item.topCompetitors, 3)
            const related = visibleItems([...item.peopleAlsoAsk, ...item.relatedSearches], 2)

            return (
              <div key={`${item.cluster}:${item.query}`} className="grid gap-3 px-5 py-3 xl:grid-cols-[minmax(240px,0.8fr)_minmax(0,1fr)_auto] xl:items-center">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-arkara-green/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-arkara-green">
                      {item.cluster}
                    </span>
                    <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                      item.source === 'missing-key' || item.source === 'error'
                        ? 'border-gray-200 bg-gray-50 text-gray-500'
                        : item.arkaraRank
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}>
                      {item.source === 'missing-key' || item.source === 'error'
                        ? 'pending'
                        : item.arkaraRank
                          ? `rank ${item.arkaraRank}`
                          : 'gap'}
                    </span>
                    <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
                      {sourceLabel(item.source)}
                    </span>
                  </div>
                  <h3 className="truncate text-base font-black text-arkara-green">{item.query}</h3>
                  {item.error ? <p className="mt-1 text-xs font-semibold text-red-600">{item.error}</p> : null}
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Kompetitor</span>
                    {competitors.visible.length > 0 ? competitors.visible.map((domain) => (
                      <span key={domain} className="max-w-[180px] truncate rounded-md bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600">
                        {domain}
                      </span>
                    )) : (
                      <span className="text-xs font-semibold text-gray-400">Belum ada data</span>
                    )}
                    {competitors.remaining > 0 ? (
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-black text-gray-500">+{competitors.remaining}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">PAA / related</span>
                    {related.visible.length > 0 ? related.visible.map((query) => (
                      <span key={query} className="max-w-[320px] truncate rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600">
                        {query}
                      </span>
                    )) : (
                      <span className="text-xs font-semibold text-gray-400">Belum ada data</span>
                    )}
                    {related.remaining > 0 ? (
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-black text-gray-500">+{related.remaining}</span>
                    ) : null}
                  </div>
                </div>
                <SeoGapDraftButton
                  cluster={item.cluster}
                  query={item.query}
                  topCompetitors={item.topCompetitors}
                  peopleAlsoAsk={item.peopleAlsoAsk}
                  relatedSearches={item.relatedSearches}
                  disabled={item.source === 'missing-key' || item.source === 'error'}
                />
              </div>
            )
          })}
        </div>
      </section>

      <SeoRepairPanel
        repairItems={data.topFixes}
        keywordOpportunities={data.keywordOpportunities}
      />

      <SeoIndexingQueuePanel
        items={indexingQueue.items}
        error={indexingQueue.error}
      />

      <SeoKeywordSignalsPanel items={data.keywordSignals} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Prioritas</p>
              <h2 className="text-xl font-black text-arkara-green">Konten yang perlu dibenahi</h2>
            </div>
            <p className="text-sm font-semibold text-gray-500">
              {data.summary.publishedContent} published, {data.summary.draftContent} draft
            </p>
          </div>
          {data.topFixes.length > 0 ? (
            <div>
              {data.topFixes.map((item) => (
                <FixRow key={`${item.type}:${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-sm font-semibold text-gray-500">Tidak ada issue besar.</div>
          )}
        </section>

        <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Visibility tracker</p>
            <h2 className="text-xl font-black text-arkara-green">Prompt set mingguan</h2>
          </div>
          <div className="space-y-3">
            {data.visibilityPrompts.map((item) => (
              <div key={`${item.cluster}:${item.prompt}`} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-arkara-green">
                  <Search className="h-3 w-3" />
                  {item.cluster}
                </div>
                <p className="text-sm font-bold leading-snug text-gray-700">{item.prompt}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Keyword gap seed</p>
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-arkara-green">Cluster Arkara</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.clusters.map((cluster) => (
            <ClusterPanel key={cluster.slug} cluster={cluster} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-md bg-arkara-cream p-2 text-arkara-green">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Pipeline</p>
            <h2 className="text-xl font-black text-arkara-green">Urutan kerja berikutnya</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {[
            'Audit konten',
            'Keyword gap',
            'Content brief',
            'Writer agent',
            'Visibility check',
          ].map((step, index) => (
            <div key={step} className="rounded-md border border-gray-100 bg-gray-50 p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-arkara-amber">Step {index + 1}</p>
              <p className="text-sm font-black text-arkara-green">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
