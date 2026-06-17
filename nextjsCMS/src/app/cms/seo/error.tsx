'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function SeoCockpitError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl rounded-lg border border-red-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-red-50 p-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">SEO Cockpit gagal dimuat</h2>
              <p className="mt-1 text-sm text-gray-600">Coba muat ulang. Jika masih gagal, cek koneksi Supabase atau layanan keyword.</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-md bg-arkara-green px-3 py-2 text-sm font-medium text-white hover:bg-arkara-green/90"
            >
              <RefreshCw className="h-4 w-4" />
              Muat ulang
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
