"use client"

import { useState, useEffect } from 'react'
import { Image as ImageIcon, Search, Loader2, X, Check } from 'lucide-react'
import { getMedia } from '@/app/cms/media/actions'

interface MediaPickerProps {
  onSelect: (url: string) => void
  disabled?: boolean
}

export function MediaPicker({ onSelect, disabled }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [media, setMedia] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')

  const loadMedia = async () => {
    setIsLoading(true)
    try {
      const data = await getMedia()
      setMedia(data || [])
    } catch (error) {
      console.error("Failed to load media:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    if (media.length === 0) {
      loadMedia()
    }
  }

  const handleSelect = (filePath: string) => {
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${filePath}`
    onSelect(publicUrl)
    setIsOpen(false)
  }

  const filteredMedia = media.filter(item => 
    item.file_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all disabled:opacity-50 flex items-center gap-2"
        title="Pilih Gambar dari Media Library"
      >
        <ImageIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2" style={{ color: '#1a2e1a' }}>
                <ImageIcon className="w-6 h-6 text-amber-500" />
                Media Library
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search & Toolbar */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari file media..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all outline-none text-sm"
                />
              </div>
              <button 
                onClick={loadMedia}
                className="text-xs font-bold text-gray-500 hover:text-gray-900 border px-3 py-2 rounded-lg transition-all"
              >
                Refresh
              </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="text-sm text-gray-500 mt-4">Memuat media...</p>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Buka menu Media untuk mengunggah gambar baru.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredMedia.map((item) => {
                    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${item.file_path}`
                    
                    return (
                      <div 
                        key={item.id}
                        onClick={() => handleSelect(item.file_path)}
                        className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:border-amber-400 hover:shadow-md transition-all active:scale-95"
                      >
                        <div className="aspect-square bg-gray-50 relative">
                          <img
                            src={publicUrl}
                            alt={item.file_name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white p-2 rounded-full shadow-sm text-amber-600 scale-50 group-hover:scale-100 transition-transform">
                               <Check className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                        <div className="p-2 border-t border-gray-100">
                          <p className="text-[10px] font-medium text-gray-700 truncate" title={item.file_name}>
                             {item.file_name}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
