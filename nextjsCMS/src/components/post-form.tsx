"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, ChevronLeft, Loader2, Image as ImageIcon, Layout, X } from 'lucide-react'
import Link from 'next/link'
import { SlugInput } from './slug-input'
import { MediaPicker } from './media/media-picker'

const postSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  content: z.string().catch(''),
  description: z.string().catch(''),
  category: z.enum(['air', 'energi', 'pangan', 'medis', 'keamanan', 'komunitas']),
  status: z.enum(['draft', 'published']),
  cover_image: z.string().optional(),
  thumbnail_image: z.any().optional(),
  banner_image: z.any().optional(),
  meta_title: z.string().catch(''),
  meta_desc: z.string().catch(''),
})

type PostFormValues = z.infer<typeof postSchema>

interface PostFormProps {
  initialData?: any
  onSubmit: (data: PostFormValues) => Promise<void>
  title: string
}

export function PostForm({ initialData, onSubmit, title }: PostFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      content: initialData?.content || '',
      description: initialData?.description || '',
      category: initialData?.category || 'pangan',
      status: initialData?.status || 'draft',
      cover_image: initialData?.cover_image || '',
      thumbnail_image: initialData?.thumbnail_image || null,
      banner_image: initialData?.banner_image || null,
      meta_title: initialData?.meta_title || '',
      meta_desc: initialData?.meta_desc || '',
    },
  })

  const titleValue = watch('title')
  const slugValue = watch('slug')
  const watchThumbnail = watch('thumbnail_image')
  const watchBanner = watch('banner_image')

  const handleFormSubmit = async (data: PostFormValues) => {
    setIsSubmitting(true)
    setError(null)
    
    // For backwards compatibility, if we have a thumbnail but no cover image, use its URL
    if (data.thumbnail_image && !data.cover_image) {
       data.cover_image = data.thumbnail_image.url || undefined
    }

    try {
      await onSubmit(data)
      // We don't push immediately here if the parent action throws
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const ImagePreview = ({ fieldName, label, data, onRemove }: { fieldName: string, label: string, data: any, onRemove: () => void }) => {
     if (!data) return null;
     return (
       <div className="relative rounded-xl border-2 border-amber-500/50 overflow-hidden bg-gray-50 flex flex-col group">
         <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={onRemove} className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md">
               <X className="w-4 h-4" />
            </button>
         </div>
         <div className="aspect-video relative overflow-hidden flex items-center justify-center bg-gray-100">
             <img src={data.url} alt={data.alt_text || 'Preview'} className="w-full h-full object-cover" />
         </div>
         <div className="p-2 border-t text-xs font-semibold text-amber-900 bg-amber-50 flex justify-between items-center">
             <span className="truncate flex-1">{label} Terpilih</span>
             {data.aspect_ratio && <span className="bg-amber-200 px-1.5 py-0.5 rounded text-[10px] ml-2 shrink-0">{data.aspect_ratio}</span>}
         </div>
       </div>
     )
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 pb-20">
      <div className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md py-4 z-10 border-b mb-6 px-2">
        <div className="flex items-center gap-4">
          <Link
            href="/cms/posts"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 leading-none">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            {...register('status')}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-amber-100 focus:border-amber-500 transition-all outline-none"
          >
            <option value="draft">BOD Draft</option>
            <option value="published">Tayang Publik</option>
          </select>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
            style={{ backgroundColor: '#d4a017', color: '#1a2e1a' }}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Final
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center gap-3">
           <X className="w-5 h-5 text-red-500 shrink-0" />
           <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50 space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-amber-500" />  
                  Judul Artikel
              </label>
              <input
                type="text"
                {...register('title')}
                className={`w-full px-5 py-3 rounded-xl border text-xl font-bold transition-all shadow-sm ${
                  errors.title ? 'border-red-300 focus:ring-red-100 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:ring-amber-200 focus:border-amber-500'
                }`}
                placeholder="Masukkan judul panduan atau post..."
              />
              {errors.title && <p className="text-xs text-red-500 mt-1 font-medium">{errors.title.message}</p>}
            </div>

            <SlugInput
              titleValue={titleValue}
              value={slugValue}
              onChange={(val) => setValue('slug', val)}
              error={errors.slug?.message}
            />

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Ringkasan (Dilihat di Google & Kartu Artikel)</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-amber-200 focus:border-amber-500 transition-all resize-none shadow-sm text-sm"
                placeholder="Tulis paragraf singkat 2-3 baris yang membuat orang penasaran untuk membaca..."
              />
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between items-center mb-1">
                 <label className="text-sm font-bold text-gray-700">Konten Artikel Utama</label>
                 <span className="text-[10px] font-bold tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded">MARKDOWN KETAT</span>
              </div>
              <textarea
                {...register('content')}
                rows={20}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition-all font-mono text-sm shadow-inner"
                placeholder="Tulis konten artikel di sini.&#10;&#10;## Subjudul 1&#10;Gunakan heading, **teks tebal**, dan struktur markdown.&#10;&#10;- Poin 1&#10;- Poin 2"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6 text-left">
          
          {/* VISUALS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-t-amber-500 space-y-6">
            <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
               <ImageIcon className="w-5 h-5 text-amber-500" /> Visual Utama
            </h3>
            
            <div className="space-y-4">
              {/* Thumbnail Image */}
              <div className="space-y-2 bg-gray-50 p-4 rounded-xl border">
                <label className="text-sm font-bold text-gray-800">Thumbnail Artikel (Rasio 4:3 / 16:9)</label>
                <p className="text-[11px] text-gray-500 leading-tight mb-3">Tampil di beranda dan halaman daftar panduan.</p>
                
                {watchThumbnail ? (
                  <ImagePreview 
                     fieldName="thumbnail_image" 
                     label="Thumbnail" 
                     data={watchThumbnail} 
                     onRemove={() => setValue('thumbnail_image', null)} 
                  />
                ) : (
                  <MediaPicker 
                    label="Pilih Thumbnail dari Media"
                    onSelect={(data) => {
                       setValue('thumbnail_image', data, { shouldValidate: true })
                       // Helper: Jika banner kosong, isi dengan yang sama agar cepat
                       if (!watchBanner) setValue('banner_image', data)
                    }} 
                  />
                )}
              </div>

              {/* Banner/Hero Image */}
              <div className="space-y-2 p-4 rounded-xl border border-dashed border-gray-300">
                <label className="text-sm font-bold text-gray-800">Hero Banner (Lebar 16:9)</label>
                <p className="text-[11px] text-gray-500 leading-tight mb-3">Gambar lebar pemanis saat artikel sedang dibaca di halaman penuh.</p>
                
                {watchBanner ? (
                  <ImagePreview 
                     fieldName="banner_image" 
                     label="Hero Banner" 
                     data={watchBanner} 
                     onRemove={() => setValue('banner_image', null)} 
                  />
                ) : (
                  <MediaPicker 
                    label="Pilih Banner dari Media"
                    onSelect={(data) => setValue('banner_image', data, { shouldValidate: true })} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* META & KATEGORI */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-bold text-gray-900 border-b pb-3 border-gray-100">Taksonomi & SEO</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Topik Kategori Utama</label>
              <select
                {...register('category')}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition-all outline-none font-semibold text-gray-700"
              >
                <option value="air">Air (Sistem & Filtrasi)</option>
                <option value="energi">Energi & Daya</option>
                <option value="pangan">Pangan & Tani</option>
                <option value="medis">Medis & P3K</option>
                <option value="keamanan">Keamanan Pertahanan</option>
                <option value="komunitas">Komunitas / Logistik</option>
              </select>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-sm font-bold text-gray-700">Meta Title Spesifik (Opsional)</label>
              <input
                type="text"
                {...register('meta_title')}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all text-sm"
                placeholder="Gunakan ini jika ingin judul Google berbeda"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Meta Description Spesifik</label>
              <textarea
                {...register('meta_desc')}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all resize-none text-sm"
                placeholder="Jika kosong, akan mengambil ringkasan artikel di atas otomatis."
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
