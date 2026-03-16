import { createClient } from '@/lib/supabase/server'
import { FileText, BookOpen, Image as ImageIcon, CheckCircle, Clock, PlusCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'

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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-arkara-green uppercase tracking-tighter">
            Ringkasan <span className="text-arkara-amber">Sistem</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Panel kendali utama pengetahuan Arkara.</p>
        </div>
        <div className="text-right hidden md:block">
           <p className="text-sm font-bold text-arkara-green uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
             {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="group bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20 hover:shadow-2xl hover:shadow-gray-200/40 hover:-translate-y-2 transition-all duration-500 ease-out"
            >
              <div className="flex justify-between items-start mb-8">
                 <div className={`p-4 rounded-2xl bg-gray-50 group-hover:bg-arkara-cream transition-colors duration-500`}>
                    <Icon size={28} className={stat.color} />
                 </div>
                 <span className="text-xs font-black text-gray-200 group-hover:text-arkara-amber transition-colors">0{index + 1}</span>
              </div>
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
              <p className="text-5xl font-black text-arkara-green tracking-tighter">
                {stat.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Recent Section */}
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-arkara-green/5 pb-4">
               <h2 className="text-2xl font-black text-arkara-green tracking-tight italic">KONTEN TERBARU</h2>
               <Link href="/cms/posts" className="text-xs font-bold text-arkara-amber hover:text-arkara-green transition-colors uppercase tracking-widest underline decoration-2 underline-offset-4">Lihat Galeri</Link>
            </div>
            <div className="bg-white rounded-[3rem] border border-gray-100 p-16 text-center shadow-2xl shadow-gray-200/30 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-2 h-full bg-arkara-amber"></div>
               <div className="w-24 h-24 bg-arkara-cream rounded-full mx-auto flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-700">
                  <Clock className="text-arkara-amber w-12 h-12 animate-pulse" />
               </div>
               <p className="text-xl font-black text-arkara-green tracking-tight uppercase">Menunggu Input Data</p>
               <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">Silakan mulai membuat artikel atau panduan baru untuk mengisi timeline ini.</p>
            </div>
         </div>

         {/* Quick Actions Sidebar */}
         <div className="space-y-6">
            <h2 className="text-2xl font-black text-arkara-green uppercase tracking-tight italic">AKSI CEPAT</h2>
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
                   className="flex items-center gap-5 p-6 bg-white rounded-[2rem] border border-gray-100 shadow-md hover:shadow-2xl hover:border-arkara-amber transition-all duration-500 group relative overflow-hidden"
                 >
                    <div className="absolute -right-4 -bottom-4 text-gray-50 scale-150 rotate-12 opacity-10 group-hover:opacity-100 transition-opacity">
                       <action.icon size={100} />
                    </div>
                    <div className={`p-4 rounded-2xl ${action.color} text-white shadow-xl shadow-gray-200 group-hover:scale-110 transition-transform duration-500 relative z-10`}>
                       <action.icon size={24} />
                    </div>
                    <span className="font-black text-arkara-green tracking-tight text-lg relative z-10 uppercase">{action.label}</span>
                 </Link>
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}
