import { Megaphone } from 'lucide-react'
import { getSocialDashboardData } from './actions'
import { SocialTrackerDashboard } from '@/components/social/social-tracker-dashboard'

export default async function SocialPage({
  searchParams,
}: {
  searchParams?: Promise<{ campaign?: string }>
}) {
  try {
    const params = searchParams ? await searchParams : {}
    const data = await getSocialDashboardData(params.campaign)

    return (
      <div className="space-y-8 pb-20">
        <div className="flex flex-col gap-4 border-b border-arkara-green/5 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3 text-arkara-green uppercase tracking-tighter">
              <div className="bg-arkara-amber p-2.5 rounded-2xl shadow-lg shadow-arkara-amber/20">
                <Megaphone className="w-7 h-7 text-arkara-green" />
              </div>
              Social <span className="text-arkara-amber">Tracker</span>
            </h1>
            <p className="text-gray-500 mt-3 font-medium max-w-2xl leading-relaxed text-sm">
              Siapkan, copy manual, posting, lalu catat performa Facebook tanpa koneksi ke Facebook API.
            </p>
          </div>
        </div>

        <SocialTrackerDashboard initialData={data} />
      </div>
    )
  } catch (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-8 rounded-3xl m-6">
        <h2 className="text-2xl font-bold mb-4">Database Render Error (Social Tracker)</h2>
        <p className="mb-4">Terjadi kesalahan saat memuat modul social tracker.</p>
        <pre className="p-4 bg-white/50 border border-red-100 rounded-xl overflow-x-auto text-sm text-red-900 shadow-sm font-mono">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    )
  }
}
