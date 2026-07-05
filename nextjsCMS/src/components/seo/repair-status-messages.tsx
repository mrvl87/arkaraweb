import { CheckCircle2 } from 'lucide-react'

export type RepairApplyResult = {
  title: string
  slug: string
  publicPath: string
  editPath: string
  updatedAt: string
  appliedFields: string[]
  indexingQueued: boolean
  indexingQueueError?: string
}

interface RepairStatusMessagesProps {
  hasRepairItems: boolean
  error: string | null
  applyError: string | null
  applyResult: RepairApplyResult | null
  showReadyMessage: boolean
}

export function RepairStatusMessages({
  hasRepairItems,
  error,
  applyError,
  applyResult,
  showReadyMessage,
}: RepairStatusMessagesProps) {
  return (
    <>
      {!hasRepairItems ? (
        <div className="p-5 text-sm font-semibold text-gray-500">Tidak ada proposal repair aktif.</div>
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

      {showReadyMessage ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-black">Proposal siap dievaluasi. Periksa before/after sebelum apply.</p>
        </div>
      ) : null}
    </>
  )
}
