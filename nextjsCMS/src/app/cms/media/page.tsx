import { getMedia } from './actions'
import { MediaGallery } from '@/components/media/media-gallery'
import { Image as ImageIcon } from 'lucide-react'

export default async function MediaPage() {
  const mediaItems = await getMedia()

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end text-left">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1a2e1a' }}>
            Media Library
          </h1>
          <p className="text-gray-500 mt-1">Kelola aset gambar dan file media Arkara.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-xl">
           <ImageIcon className="w-4 h-4" />
           STORAGE: SUPABASE
        </div>
      </div>

      <MediaGallery initialMedia={mediaItems} />
    </div>
  )
}

