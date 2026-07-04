import { CheckCircle2, Gauge, Globe2, ListChecks } from 'lucide-react'
import { getSeoCockpitData } from '@/lib/seo/content-audit'
import { getSeoIndexingQueue } from '@/lib/seo/indexing-queue'
import { SeoRepairPanel } from '@/components/seo/seo-repair-panel'
import { SeoIndexingQueuePanel } from '@/components/seo/seo-indexing-queue-panel'
import { SeoKeywordSignalsPanel } from '@/components/seo/seo-keyword-signals-panel'
import { ClusterPanel } from './_components/cluster-panel'
import { ContentFixSection } from './_components/content-fix-section'
import { KeywordGapSection } from './_components/keyword-gap-section'
import { SeoMetricCard } from './_components/seo-metric-card'
import { SeoPageHeader } from './_components/seo-page-header'
import { SeoPipeline } from './_components/seo-pipeline'
import { TodaysSeoActions } from './_components/todays-seo-actions'

export default async function SEOCockpitPage() {
  const [data, indexingQueue] = await Promise.all([
    getSeoCockpitData(),
    getSeoIndexingQueue(),
  ])

  return (
    <div className="space-y-8 pb-16">
      <SeoPageHeader />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SeoMetricCard
          label="SEO Readiness"
          value={data.summary.averageScore}
          icon={Gauge}
          helperText="Content readiness internal, bukan ranking Google aktual."
        />
        <SeoMetricCard label="Quick answer" value={data.summary.quickAnswerCoverage} suffix="%" icon={CheckCircle2} />
        <SeoMetricCard label="FAQ coverage" value={data.summary.faqCoverage} suffix="%" icon={ListChecks} />
        <SeoMetricCard label="Keyword gaps" value={data.summary.keywordGapCount} icon={Globe2} />
      </div>

      <TodaysSeoActions data={data} indexingQueue={indexingQueue} />

      <KeywordGapSection
        opportunities={data.keywordOpportunities}
        serper={data.serper}
      />

      <SeoRepairPanel
        repairItems={data.topFixes}
        keywordOpportunities={data.keywordOpportunities}
      />

      <div id="indexing-queue" className="scroll-mt-6">
        <SeoIndexingQueuePanel
          items={indexingQueue.items}
          error={indexingQueue.error}
        />
      </div>

      <div id="keyword-signals" className="scroll-mt-6">
        <SeoKeywordSignalsPanel items={data.keywordSignals} />
      </div>

      <ContentFixSection
        items={data.topFixes}
        visibilityPrompts={data.visibilityPrompts}
        publishedContent={data.summary.publishedContent}
        draftContent={data.summary.draftContent}
      />

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

      <SeoPipeline />
    </div>
  )
}
