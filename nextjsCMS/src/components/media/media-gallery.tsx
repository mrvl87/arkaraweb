"use client"

import { useState } from 'react'
import { UploadZone } from './upload-zone'
import { AIGenerator } from './ai-generator'
import { MediaCard } from './media-card'
import { Search, Image as ImageIcon, UploadCloud } from 'lucide-react'

interface MediaGalleryProps {
  initialMedia: any[]
}

export function MediaGallery({ initialMedia }: MediaGalleryProps) {
  const [search, setSearch] = useState('')

  const filteredMedia = initialMedia.filter(item => 
    item.file_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="rounded-[28px] border border-gray-100 bg-white/70 p-6 shadow-sm lg:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-gray-900">Pusat Unggahan</h3>
              <p className="text-sm text-gray-500">
                Area utama untuk upload, crop, dan optimasi gambar sebelum masuk ke library.
              </p>
            </div>
          </div>
          <UploadZone />
        </div>

        <AIGenerator />

        <div className="space-y-5">
          <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <h3 className="flex items-center gap-3 text-xl font-bold text-gray-900" style={{ color: '#1a2e1a' }}>
              Koleksi Media Anda
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-bold">
                {filteredMedia.length} File
              </span>
            </h3>

            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari file media..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-gray-100 bg-white py-2.5 pl-11 pr-4 shadow-sm outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          {filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
               <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                  <ImageIcon className="w-8 h-8 text-gray-300" />
               </div>
               <p className="text-gray-500 font-medium px-4 text-center">
                {search ? 'Tidak ada media yang cocok dengan pencarian Anda saat ini.' : 'Belum ada daftar media yang tersedia di library.'}
               </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {filteredMedia.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
