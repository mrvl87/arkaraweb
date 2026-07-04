import { SeoGapDraftButton } from '@/components/seo/seo-gap-draft-button'
import type { SerperKeywordOpportunity } from '@/lib/seo/serper'

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

interface KeywordOpportunityRowProps {
  item: SerperKeywordOpportunity
}

export function KeywordOpportunityRow({ item }: KeywordOpportunityRowProps) {
  const competitors = visibleItems(item.topCompetitors, 3)
  const related = visibleItems([...item.peopleAlsoAsk, ...item.relatedSearches], 2)
  const isUnavailable = item.source === 'missing-key' || item.source === 'error'

  return (
    <div className="grid gap-3 px-5 py-3 xl:grid-cols-[minmax(240px,0.8fr)_minmax(0,1fr)_auto] xl:items-center">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-arkara-green/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-arkara-green">
            {item.cluster}
          </span>
          <span
            className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
              isUnavailable
                ? 'border-gray-200 bg-gray-50 text-gray-500'
                : item.arkaraRank
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {isUnavailable ? 'pending' : item.arkaraRank ? `rank ${item.arkaraRank}` : 'gap'}
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
        disabled={isUnavailable}
      />
    </div>
  )
}
