import type { SeoClusterStatus } from '@/lib/seo/content-audit'
import { readinessClass } from './seo-style-utils'


interface ClusterPanelProps {
  cluster: SeoClusterStatus
}

export function ClusterPanel({ cluster }: ClusterPanelProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cluster</p>
          <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-arkara-green">{cluster.label}</h3>
        </div>
        <span className={`rounded-md border px-2.5 py-1 text-xs font-black ${readinessClass(cluster.averageScore)}`}>
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
