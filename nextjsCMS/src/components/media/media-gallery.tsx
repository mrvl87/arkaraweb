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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Upload Sidebar */}
        <div className="lg:col-span-1 border-r border-gray-100 pr-0 lg:pr-8 space-y-6">
           <div className="text-left">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Unggah Baru</h3>
              <p className="text-xs text-gray-500 mt-1">Upload gambar untuk digunakan di artikel atau panduan.</p>
           </div>
           <UploadZone />
        </div>

        {/* Gallery Grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2" style={{ color: '#1a2e1a' }}>
              Semua Media
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">
                {filteredMedia.length}
              </span>
            </h3>
          </div>

          {filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
               <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                  <ImageIcon className="w-8 h-8 text-gray-300" />
               </div>
               <p className="text-gray-500 font-medium">
                {search ? 'Tidak ada media yang cocok dengan pencarian.' : 'Belum ada media yang diunggah.'}
               </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
