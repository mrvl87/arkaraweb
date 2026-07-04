import { KeywordOpportunityRow } from './keyword-opportunity-row'
import type { SerperKeywordOpportunity } from '@/lib/seo/serper'

interface KeywordGapSectionProps {
  opportunities: SerperKeywordOpportunity[]
  serper: {
    configured: boolean
    gl: string
    hl: string
    cacheHours: number
  }
}

export function KeywordGapSection({ opportunities, serper }: KeywordGapSectionProps) {
  return (
    <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Serper automation</p>
          <h2 className="text-xl font-black text-arkara-green">Keyword gap otomatis</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-md border px-3 py-2 text-xs font-black uppercase tracking-widest ${
              serper.configured
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            {serper.configured ? 'Serper aktif' : 'SERPER_API_KEY kosong'}
          </span>
          <span className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-gray-500">
            {serper.gl}/{serper.hl} / cache {serper.cacheHours} jam
          </span>
        </div>
      </div>
      <div className="max-h-[520px] divide-y divide-gray-100 overflow-y-auto">
        {opportunities.map((item) => (
          <KeywordOpportunityRow key={`${item.cluster}:${item.query}`} item={item} />
        ))}
      </div>
    </section>
  )
}
