import { createClient } from '@/lib/supabase/server'
import { BookOpen, Image as ImageIcon, CheckCircle, Clock, PlusCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

interface Stat {
  label: string
  value: number
  icon: any
  color: string
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
      icon: CheckCircle,
      color: 'text-green-600',
    })
  } catch {
    stats.push({ label: 'Published Posts', value: 0, icon: CheckCircle, color: 'text-green-600' })
  }

  try {
    const { count: draftCount, error: draftError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')

    stats.push({
      label: 'Draft Posts',
      value: draftError ? 0 : draftCount || 0,
      icon: Clock,
      color: 'text-amber-500',
    })
  } catch {
    stats.push({ label: 'Draft Posts', value: 0, icon: Clock, color: 'text-amber-500' })
  }

  try {
    const { count: panduanCount, error: panduanError } = await supabase
      .from('panduan')
      .select('*', { count: 'exact', head: true })

    stats.push({
      label: 'Total Panduan',
      value: panduanError ? 0 : panduanCount || 0,
      icon: BookOpen,
      color: 'text-blue-600',
    })
  } catch {
    stats.push({ label: 'Total Panduan', value: 0, icon: BookOpen, color: 'text-blue-600' })
  }

  try {
    const { count: mediaCount, error: mediaError } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true })

    stats.push({
      label: 'Media Files',
      value: mediaError ? 0 : mediaCount || 0,
      icon: ImageIcon,
      color: 'text-purple-600',
    })
  } catch {
    stats.push({ label: 'Media Files', value: 0, icon: ImageIcon, color: 'text-purple-600' })
  }

  return stats
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="space-y-10 pb-10">
      <PageHeader
        title="Ringkasan"
        accent="Sistem"
        description="Panel kendali utama pengetahuan Arkara."
        action={(
          <p className="hidden rounded-xl border border-gray-100 bg-white px-4 py-2 text-sm font-bold uppercase tracking-widest text-arkara-green shadow-sm md:block">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.label}
              interactive
              className="group"
            >
              <CardContent className="p-8">
                <div className="mb-8 flex items-start justify-between">
                  <div className="rounded-2xl bg-gray-50 p-4 transition-colors duration-500 group-hover:bg-arkara-cream">
                    <Icon size={28} className={stat.color} />
                  </div>
                  <span className="text-xs font-black text-gray-200 transition-colors group-hover:text-arkara-amber">0{index + 1}</span>
                </div>
                <h3 className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{stat.label}</h3>
                <p className="text-5xl font-black tracking-tight text-arkara-green">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
         {/* Recent Section */}
         <div className="space-y-6 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-arkara-green/5 pb-4">
               <h2 className="text-2xl font-black italic tracking-tight text-arkara-green">KONTEN TERBARU</h2>
               <Link href="/cms/posts" className="text-xs font-bold uppercase tracking-widest text-arkara-amber underline decoration-2 underline-offset-4 transition-colors hover:text-arkara-green">Lihat Galeri</Link>
            </div>
            <Card className="relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-2 bg-arkara-amber" />
              <EmptyState
                icon={<Clock className="h-9 w-9 animate-pulse" />}
                title="Menunggu Input Data"
                description="Silakan mulai membuat artikel atau panduan baru untuk mengisi timeline ini."
                className="py-16"
              />
            </Card>
         </div>

         {/* Quick Actions Sidebar */}
         <div className="space-y-6">
            <h2 className="text-2xl font-black italic uppercase tracking-tight text-arkara-green">AKSI CEPAT</h2>
            <div className="space-y-4">
               {[
                 { label: 'Buat Post Baru', href: '/cms/posts/new', icon: PlusCircle, color: 'bg-green-600' },
                 { label: 'Update Panduan', href: '/cms/panduan', icon: BookOpen, color: 'bg-blue-600' },
                 { label: 'Unggah Media', href: '/cms/media', icon: ImageIcon, color: 'bg-purple-600' },
                 { label: 'Bantuan AI', href: '/cms/ai', icon: Sparkles, color: 'bg-arkara-amber' },
               ].map((action) => (
                 <Link 
                   key={action.label}
                   href={action.href}
                   className="block"
                 >
                    <Card interactive className="group relative overflow-hidden">
                      <CardContent className="flex items-center gap-5 p-6">
                        <div className="absolute -bottom-4 -right-4 scale-150 rotate-12 text-gray-50 opacity-10 transition-opacity group-hover:opacity-100">
                          <action.icon size={100} />
                        </div>
                        <div className={`relative z-10 rounded-2xl p-4 ${action.color} text-white shadow-xl shadow-gray-200 transition-transform duration-500 group-hover:scale-110`}>
                          <action.icon size={24} />
                        </div>
                        <span className="relative z-10 text-lg font-black uppercase tracking-tight text-arkara-green">{action.label}</span>
                      </CardContent>
                    </Card>
                 </Link>
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}