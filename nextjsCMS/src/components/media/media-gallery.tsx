"use client"

import { useState } from 'react'
import { UploadZone } from './upload-zone'
import { MediaCard } from './media-card'
import { Search, Filter, Image as ImageIcon } from 'lucide-react'

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
      {/* Search & Upload Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari file media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all outline-none"
          />
        </div>
      </div>

      <div className="space-y-12">
        {/* Upload Full Width Section */}
        <div className="bg-white/50 border border-gray-100 rounded-3xl p-6 lg:p-8 shadow-sm">
           <div className="mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                 <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Pusat Unggahan</h3>
                <p className="text-sm text-gray-500">Mendukung konversi dan optimasi WebP otomatis.</p>
              </div>
           </div>
           <UploadZone />
        </div>

        {/* Gallery Grid Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-3 text-xl" style={{ color: '#1a2e1a' }}>
              Koleksi Media Anda
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-bold">
                {filteredMedia.length} File
              </span>
            </h3>
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
