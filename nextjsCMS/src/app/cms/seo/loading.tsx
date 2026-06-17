import { Loader2 } from 'lucide-react'

export default function SeoCockpitLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto flex max-w-7xl items-center gap-3 rounded-lg border border-gray-100 bg-white p-5 text-sm text-gray-600 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-arkara-green" />
        <span>Memuat SEO Cockpit...</span>
      </div>
    </div>
  )
}
