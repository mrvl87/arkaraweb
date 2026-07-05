"use client"

import type { ClusterSourceContentOption } from '@/app/cms/ai/actions'

interface AIClusterSourceSelectProps {
  clusterSourceContent: ClusterSourceContentOption[]
  clusterSourceContentError?: string | null
  selectedClusterContentKey: string
  selectedClusterContent: ClusterSourceContentOption | null
  onSelect: (contentKey: string) => void
}

function getContentKey(content: ClusterSourceContentOption) {
  return `${content.type}:${content.id}`
}

function formatContentOption(content: ClusterSourceContentOption) {
  const status = content.status === 'published' ? 'published' : 'draft'
  const type = content.type === 'panduan' ? 'panduan' : 'post'
  const category = content.category ? ` - ${content.category}` : ''
  return `[${type}] [${status}] ${content.title}${category}`
}

export function AIClusterSourceSelect({
  clusterSourceContent,
  clusterSourceContentError = null,
  selectedClusterContentKey,
  selectedClusterContent,
  onSelect,
}: AIClusterSourceSelectProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
        Konten Sumber
      </label>
      {clusterSourceContentError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-600">
          {clusterSourceContentError}
        </div>
      ) : clusterSourceContent.length === 0 ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
          Belum ada post atau panduan yang bisa dipakai sebagai sumber cluster.
        </div>
      ) : (
        <>
          <select
            value={selectedClusterContentKey}
            onChange={(event) => onSelect(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
          >
            <option value="">Pilih konten sumber...</option>
            {clusterSourceContent.map((content) => (
              <option key={getContentKey(content)} value={getContentKey(content)}>
                {formatContentOption(content)}
              </option>
            ))}
          </select>

          {selectedClusterContent ? (
            <div className="space-y-1.5 rounded-xl border border-arkara-amber/20 bg-arkara-amber/5 p-3 text-xs text-gray-600">
              <div className="flex flex-wrap gap-2">
                <span className="font-bold uppercase text-arkara-green">
                  {selectedClusterContent.type}
                </span>
                <span className="font-bold uppercase text-arkara-green">
                  {selectedClusterContent.status}
                </span>
                {selectedClusterContent.category ? (
                  <span className="text-gray-400">/{selectedClusterContent.category}</span>
                ) : null}
                <span className="text-gray-400">{selectedClusterContent.path}</span>
              </div>
              {selectedClusterContent.description ? (
                <p className="leading-relaxed text-gray-500">
                  {selectedClusterContent.description}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}