import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getPanduan } from './actions'
import { PanduanList } from '@/components/panduan-list'

export default async function PanduanPage() {
  const panduan = await getPanduan()

  return (
    <div className="space-y-10 pb-10">
      <div className="flex justify-between items-end border-b border-arkara-green/5 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-arkara-green tracking-tighter uppercase italic">
            Pustaka <span className="text-arkara-amber">Panduan</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Katalog pengetahuan teknis dan bab survival Arkara.</p>
        </div>
        <Link
          href="/cms/panduan/new"
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black bg-arkara-green text-white hover:bg-arkara-amber hover:text-arkara-green transition-all shadow-xl shadow-arkara-green/10 active:scale-95 uppercase tracking-widest text-xs"
        >
          <Plus className="w-5 h-5" />
          Tambah Panduan
        </Link>
      </div>

      <PanduanList initialPanduan={panduan} />
    </div>
  )
}

