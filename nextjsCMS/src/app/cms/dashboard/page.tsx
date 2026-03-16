import { createClient } from '@/lib/supabase/server'

interface Stat {
  label: string
  value: number
  icon: string
}

async function getStats(): Promise<Stat[]> {
  const supabase = await createClient()

  const stats: Stat[] = []

  try {
    const { count: publishedCount, error: publishedError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    stats.push({
      label: 'Published Posts',
      value: publishedError ? 0 : publishedCount || 0,
      icon: '📝',
    })
  } catch {
    stats.push({ label: 'Published Posts', value: 0, icon: '📝' })
  }

  try {
    const { count: draftCount, error: draftError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')

    stats.push({
      label: 'Draft Posts',
      value: draftError ? 0 : draftCount || 0,
      icon: '✏️',
    })
  } catch {
    stats.push({ label: 'Draft Posts', value: 0, icon: '✏️' })
  }

  try {
    const { count: panduanCount, error: panduanError } = await supabase
      .from('panduan')
      .select('*', { count: 'exact', head: true })

    stats.push({
      label: 'Total Panduan',
      value: panduanError ? 0 : panduanCount || 0,
      icon: '📚',
    })
  } catch {
    stats.push({ label: 'Total Panduan', value: 0, icon: '📚' })
  }

  try {
    const { count: mediaCount, error: mediaError } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true })

    stats.push({
      label: 'Media Files',
      value: mediaError ? 0 : mediaCount || 0,
      icon: '🖼️',
    })
  } catch {
    stats.push({ label: 'Media Files', value: 0, icon: '🖼️' })
  }

  return stats
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#1a2e1a' }}>
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Selamat datang ke Arkara CMS</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-lg shadow border-l-4 bg-white"
            style={{ borderLeftColor: '#d4a017' }}
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <h3 className="text-gray-600 text-sm font-medium">{stat.label}</h3>
            <p
              className="text-3xl font-bold mt-2"
              style={{ color: '#1a2e1a' }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4" style={{ color: '#1a2e1a' }}>
          Konten Terbaru
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p>Tidak ada data terbaru</p>
        </div>
      </div>
    </div>
  )
}
