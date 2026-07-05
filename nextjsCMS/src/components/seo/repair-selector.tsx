import { Loader2, Sparkles } from 'lucide-react'
import type { SeoAuditItem } from '@/lib/seo/content-audit'

interface RepairSelectorProps {
  repairItems: SeoAuditItem[]
  selectedId: string
  selectedItem: SeoAuditItem | null
  loading: boolean
  getItemKey: (item: Pick<SeoAuditItem, 'type' | 'id'>) => string
  onSelect: (id: string) => void
  onGenerate: () => void
}

interface RepairSelectionDetailsProps {
  selectedItem: SeoAuditItem | null
  selectedKeywords: Array<{ query: string }>
}

export function RepairSelector({
  repairItems,
  selectedId,
  selectedItem,
  loading,
  getItemKey,
  onSelect,
  onGenerate,
}: RepairSelectorProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Approval gate</p>
        <h2 className="text-xl font-black text-arkara-green">Generate repair proposal</h2>
        <p className="mt-1 text-sm font-semibold text-gray-500">
          Generate proposal, cek hasilnya, lalu apply setelah disetujui.
        </p>
      </div>
      {repairItems.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={selectedId}
            onChange={(event) => onSelect(event.target.value)}
            className="min-w-[280px] rounded-md border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-arkara-green outline-none focus:border-arkara-amber"
          >
            {repairItems.map((item) => (
              <option key={getItemKey(item)} value={getItemKey(item)}>
                [{item.type}] {item.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onGenerate}
            disabled={!selectedItem || loading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-arkara-green px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-arkara-amber hover:text-arkara-green disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Fix
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function RepairSelectionDetails({ selectedItem, selectedKeywords }: RepairSelectionDetailsProps) {
  if (!selectedItem) return null

  return (
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
  )
}