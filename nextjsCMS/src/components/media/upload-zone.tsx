"use client"

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { uploadFile } from '@/app/cms/media/actions'

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
       setError('Hanya file gambar yang diizinkan untuk saat ini.')
       return
    }

    setIsUploading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      await uploadFile(formData)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsUploading(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0])
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer text-center
          ${isDragging 
            ? 'border-amber-500 bg-amber-50' 
            : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
          }
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
          accept="image/*"
        />

        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-amber-100' : 'bg-gray-100'}`}>
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            ) : (
              <Upload className={`w-8 h-8 ${isDragging ? 'text-amber-600' : 'text-gray-400'}`} />
            )}
          </div>
          
          <div>
            <p className="text-lg font-bold text-gray-900" style={{ color: '#1a2e1a' }}>
              {isUploading ? 'Sedang Mengunggah...' : 'Tarik foto ke sini atau klik'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Mendukung JPG, PNG, WEBP (Max 5MB)
            </p>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-3xl flex items-center justify-center">
             <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-xl border border-gray-100">
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                <span className="font-bold text-gray-900">Mengunggah File...</span>
             </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}
