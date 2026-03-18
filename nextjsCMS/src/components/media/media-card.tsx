"use client"

import { useState } from 'react'
import { Trash2, Copy, Check, Maximize2, Info } from 'lucide-react'
import { deleteFile, updateAltText } from '@/app/cms/media/actions'
import { DeleteDialog } from '@/components/delete-dialog'

interface MediaCardProps {
  item: any
}

export function MediaCard({ item }: MediaCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const publicUrl = item.file_path.startsWith('http') 
    ? item.file_path 
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${item.file_path}`

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteFile(item.id, item.file_path)
    } catch (err) {
      alert('Gagal menghapus: ' + (err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
      {/* Thumbnail */}
      <div className="aspect-square relative bg-gray-50 flex items-center justify-center overflow-hidden">
        <img
          src={publicUrl}
          alt={item.alt_text || item.file_name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button 
              onClick={() => window.open(publicUrl, '_blank')}
              className="p-2 bg-white rounded-lg text-gray-900 hover:bg-amber-50 hover:text-amber-600 transition-colors"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button 
              onClick={handleCopy}
              className="p-2 bg-white rounded-lg text-gray-900 hover:bg-amber-50 hover:text-amber-600 transition-colors"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
            </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="text-xs font-bold text-gray-900 truncate" title={item.file_name}>
          {item.file_name}
        </p>
        <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400 font-mono">
              {formatSize(item.file_size)}
            </span>
            <DeleteDialog
                title="Hapus Media"
                description="Apakah Anda yakin ingin menghapus file ini? File akan dihapus permanen dari storage."
                onConfirm={handleDelete}
                trigger={
                   <button className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all">
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                }
            />
        </div>
      </div>
    </div>
  )
}
