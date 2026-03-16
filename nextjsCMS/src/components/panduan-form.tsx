"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, ChevronLeft, Loader2, Image as ImageIcon, QrCode, Book } from 'lucide-react'
import Link from 'next/link'
import { SlugInput } from './slug-input'

const panduanSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  content: z.string().optional().default(''),
  bab_ref: z.string().optional(),
  qr_slug: z.string().optional(),
  cover_image: z.string().optional(),
  meta_title: z.string().optional(),
  meta_desc: z.string().optional(),
  status: z.enum(['draft', 'published']),
})

type PanduanFormValues = z.infer<typeof panduanSchema>

interface PanduanFormProps {
  initialData?: any
  onSubmit: (data: PanduanFormValues) => Promise<void>
  title: string
}

export function PanduanForm({ initialData, onSubmit, title }: PanduanFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PanduanFormValues>({
    resolver: zodResolver(panduanSchema),
    defaultValues: initialData || {
      title: '',
      slug: '',
      content: '',
      bab_ref: '',
      qr_slug: '',
      status: 'draft',
      cover_image: '',
      meta_title: '',
      meta_desc: '',
    },
  })

  const titleValue = watch('title')
  const slugValue = watch('slug')

  const handleFormSubmit = async (data: PanduanFormValues) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(data)
      router.push('/cms/panduan')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 pb-20">
      <div className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md py-4 z-10 border-b mb-6 text-left">
        <div className="flex items-center gap-4">
          <Link
            href="/cms/panduan"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            {...register('status')}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-amber-100 focus:border-amber-500 transition-all outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#d4a017', color: '#1a2e1a' }}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Panduan
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6 text-left">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Judul Panduan</label>
              <input
                type="text"
                {...register('title')}
                className={`w-full px-4 py-2.5 rounded-lg border text-lg font-bold transition-all ${
                  errors.title ? 'border-red-300 focus:ring-red-100 focus:border-red-500' : 'border-gray-200 focus:ring-amber-100 focus:border-amber-500'
                }`}
                placeholder="Masukkan judul panduan..."
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <SlugInput
              titleValue={titleValue}
              value={slugValue}
              onChange={(val) => setValue('slug', val)}
              error={errors.slug?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Book className="w-4 h-4 text-gray-400" />
                  Bab Referensi (Optional)
                </label>
                <input
                  type="text"
                  {...register('bab_ref')}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all font-mono"
                  placeholder="Contoh: Bab 4.2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-gray-400" />
                  QR Slug (Optional)
                </label>
                <input
                  type="text"
                  {...register('qr_slug')}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all font-mono"
                  placeholder="Contoh: srv-01"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Konten Panduan</label>
              <textarea
                {...register('content')}
                rows={15}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all font-mono text-sm"
                placeholder="Tulis konten panduan teknis di sini..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 text-left">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-bold text-gray-900 border-b pb-3">Informasi Tambahan</h3>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Cover Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  {...register('cover_image')}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 hover:text-amber-600 hover:border-amber-200 transition-all"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-bold text-gray-900 border-b pb-3">SEO Settings</h3>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Meta Title</label>
              <input
                type="text"
                {...register('meta_title')}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all"
                placeholder="Judul SEO..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Meta Description</label>
              <textarea
                {...register('meta_desc')}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all resize-none"
                placeholder="Deskripsi SEO..."
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
