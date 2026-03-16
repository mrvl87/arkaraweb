import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getPanduan } from './actions'
import { PanduanList } from '@/components/panduan-list'

export default async function PanduanPage() {
  const panduan = await getPanduan()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-left">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1a2e1a' }}>
            Panduan Teknis
          </h1>
          <p className="text-gray-500 mt-1">Kelola panduan teknis survival dan bab referensi.</p>
        </div>
        <Link
          href="/cms/panduan/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90 shadow-sm"
          style={{ backgroundColor: '#d4a017', color: '#1a2e1a' }}
        >
          <Plus className="w-4 h-4" />
          Panduan Baru
        </Link>
      </div>

      <PanduanList initialPanduan={panduan} />
    </div>
  )
}

