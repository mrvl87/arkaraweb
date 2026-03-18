"use client"

import { useState, useRef } from 'react'
import { Upload, X, Loader2, FileImage, Type, CheckCircle, Crop, Image as ImageIcon } from 'lucide-react'
import { uploadFile } from '@/app/cms/media/actions'
import ReactCrop, { type Crop as CropType, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  )
}

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [imgSrc, setImgSrc] = useState('')
  const [contextName, setContextName] = useState('')
  
  const [crop, setCrop] = useState<CropType>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [aspect, setAspect] = useState<number | undefined>(16 / 9) // Default 16:9

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
       setError('Hanya file gambar yang diizinkan untuk saat ini.')
       return
    }
    setPendingFile(file)
    setError(null)
    setCrop(undefined)
    
    const reader = new FileReader()
    reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''))
    reader.readAsDataURL(file)
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    if (aspect) {
      setCrop(centerAspectCrop(width, height, aspect))
    }
  }

  const handleAspectChange = (newAspect: number | undefined) => {
      setAspect(newAspect)
      if (newAspect && imgRef.current) {
          setCrop(centerAspectCrop(imgRef.current.width, imgRef.current.height, newAspect))
      } else {
          setCrop(undefined)
      }
  }

  // Get cropped image blob
  const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    
    canvas.width = crop.width * scaleX
    canvas.height = crop.height * scaleY
    
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2d context')
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    )
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Canvas is empty'))
        else resolve(blob)
      }, pendingFile?.type || 'image/jpeg', 1)
    })
  }

  const confirmUpload = async () => {
    if (!pendingFile) return
    if (!contextName.trim()) {
       setError('Mohon isi konteks gambar (Alt Text) untuk kebaikan SEO.')
       return
    }

    setIsUploading(true)
    setError(null)
    
    let fileToUpload = pendingFile;
    
    // If we have a crop and aspect ratio is enforced or user cropped
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0 && imgRef.current) {
        try {
            const croppedBlob = await getCroppedImg(imgRef.current, completedCrop)
            fileToUpload = new File([croppedBlob], pendingFile.name, { type: pendingFile.type })
        } catch (e) {
            console.error('Failed to crop image', e)
            setError('Gagal memotong gambar.')
            setIsUploading(false)
            return
        }
    }

    const formData = new FormData()
    formData.append('file', fileToUpload)
    formData.append('contextName', contextName)

    try {
      await uploadFile(formData)
      // Reset
      setPendingFile(null)
      setImgSrc('')
      setContextName('')
      setCrop(undefined)
      setCompletedCrop(undefined)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsUploading(false)
    }
  }

  const generatedName = contextName.trim() 
    ? contextName.trim().replace(/\s+/g, '-').toLowerCase() + '.webp'
    : 'nama_seo_anda.webp'

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="space-y-6">
      {!pendingFile ? (
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
              <Upload className={`w-8 h-8 ${isDragging ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
            
            <div>
              <p className="text-lg font-bold text-gray-900" style={{ color: '#1a2e1a' }}>
                Tarik foto ke sini atau klik
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Mendukung JPG, PNG, WEBP (Max 5MB)
              </p>
              <p className="text-xs text-amber-600 font-medium mt-2">
                *Gambar otomatis dipotong & dikompres ke WebP untuk SEO.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-3xl p-8 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FileImage className="w-8 h-8 text-amber-600" />
               </div>
               <div>
                  <h4 className="font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs">{pendingFile.name}</h4>
                  <p className="text-sm text-gray-500">{(pendingFile.size / 1024 / 1024).toFixed(2)} MB</p>
               </div>
            </div>
            <button 
               onClick={() => { setPendingFile(null); setImgSrc(''); setError(null); }}
               className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-full"
               disabled={isUploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              {/* CROPPER */}
              <div className="space-y-3">
                  <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                         <Crop className="w-4 h-4 text-amber-500"/>
                         Potong Gambar (Wajib)
                      </label>
                      <div className="flex flex-wrap gap-2">
                          <button onClick={() => handleAspectChange(16/9)} className={`text-xs px-2 py-1 rounded transition-colors ${aspect === 16/9 ? 'bg-amber-100 text-amber-700 font-bold border border-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'}`}>16:9 (Hero)</button>
                          <button onClick={() => handleAspectChange(4/3)} className={`text-xs px-2 py-1 rounded transition-colors ${aspect === 4/3 ? 'bg-amber-100 text-amber-700 font-bold border border-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'}`}>4:3 (Thumb)</button>
                          <button onClick={() => handleAspectChange(undefined)} className={`text-xs px-2 py-1 rounded transition-colors ${aspect === undefined ? 'bg-amber-100 text-amber-700 font-bold border border-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'}`}>Bebas</button>
                      </div>
                  </div>
                  <div className="bg-gray-50/80 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200 p-2 min-h-[300px]">
                      {imgSrc && (
                        <ReactCrop
                          crop={crop}
                          onChange={(_, percentCrop) => setCrop(percentCrop)}
                          onComplete={(c) => setCompletedCrop(c)}
                          aspect={aspect}
                          className="max-h-[400px] shadow-sm"
                        >
                          <img
                            ref={imgRef}
                            alt="Crop preview"
                            src={imgSrc}
                            onLoad={onImageLoad}
                            className="max-h-[400px] w-auto object-contain"
                          />
                        </ReactCrop>
                      )}
                  </div>
              </div>
              
              {/* METADATA */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                     <Type className="w-4 h-4 text-amber-500"/>
                     Konteks Gambar (Alt Text) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Deskripsi singkat yang relevan. Digunakan untuk aksesibilitas, SEO, dan penamaan file final. (Misal: "Senter LED Taktis Hitam")
                  </p>
                  <input 
                    type="text" 
                    value={contextName}
                    onChange={(e) => setContextName(e.target.value)}
                    placeholder="Deskripsikan gambar..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all outline-none"
                    disabled={isUploading}
                  />
                </div>
                
                <div className="bg-blue-50/50 p-4 border border-blue-100/50 rounded-xl">
                    <h5 className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wider">Preview Nama File (SEO friendly):</h5>
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-mono bg-white px-3 py-2 rounded-lg border border-blue-100 shadow-sm">
                        <ImageIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{generatedName}</span>
                    </div>
                </div>

                <div className="pt-2">
                  <button
                     onClick={confirmUpload}
                     disabled={!contextName.trim() || isUploading}
                     className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all
                                disabled:opacity-50 disabled:cursor-not-allowed
                                bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 active:scale-95"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Memproses & Mengunggah...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Konfirmasi Unggah
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-3">
                     Gambar akan otomatis dikonversi ke resolusi multi-ukuran (.WebP).
                  </p>
                </div>
              </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}
