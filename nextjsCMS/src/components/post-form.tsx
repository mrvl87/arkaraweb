"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, ChevronLeft, Loader2, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { SlugInput } from './slug-input'

const postSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  content: z.string().optional().default(''),
  description: z.string().optional(),
  category: z.enum(['air', 'energi', 'pangan', 'medis', 'keamanan', 'komunitas']),
  status: z.enum(['draft', 'published']),
  cover_image: z.string().optional(),
  meta_title: z.string().optional(),
  meta_desc: z.string().optional(),
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
    defaultValues: initialData || {
      title: '',
      slug: '',
      content: '',
      description: '',
      category: 'pangan',
      status: 'draft',
      cover_image: '',
      meta_title: '',
      meta_desc: '',
    },
  })

  const titleValue = watch('title')
  const slugValue = watch('slug')

  const handleFormSubmit = async (data: PostFormValues) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(data)
      router.push('/cms/posts')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 pb-20">
      <div className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md py-4 z-10 border-b mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/cms/posts"
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
            Simpan Post
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6 text-left">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Judul Artikel</label>
              <input
                type="text"
                {...register('title')}
                className={`w-full px-4 py-2.5 rounded-lg border text-lg font-bold transition-all ${
                  errors.title ? 'border-red-300 focus:ring-red-100 focus:border-red-500' : 'border-gray-200 focus:ring-amber-100 focus:border-amber-500'
                }`}
                placeholder="Masukkan judul artikel..."
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <SlugInput
              titleValue={titleValue}
              value={slugValue}
              onChange={(val) => setValue('slug', val)}
              error={errors.slug?.message}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Ringkasan (Deskripsi Singkat)</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all resize-none"
                placeholder="Tulis ringkasan singkat artikel..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Konten Artikel</label>
              <textarea
                {...register('content')}
                rows={15}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all font-mono text-sm"
                placeholder="Tulis konten artikel di sini (Markdown didukung)..."
              />
              <p className="text-xs text-gray-400">Editor Novel akan diintegrasikan di fase berikutnya.</p>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6 text-left">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-bold text-gray-900 border-b pb-3">Informasi Tambahan</h3>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Kategori</label>
              <select
                {...register('category')}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-amber-100 focus:border-amber-500 transition-all outline-none"
              >
                <option value="air">Air</option>
                <option value="energi">Energi</option>
                <option value="pangan">Pangan</option>
                <option value="medis">Medis</option>
                <option value="keamanan">Keamanan</option>
                <option value="komunitas">Komunitas</option>
              </select>
            </div>

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
              <p className="text-xs text-gray-400 italic">Media Library diintegrasikan di Part 4.</p>
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
