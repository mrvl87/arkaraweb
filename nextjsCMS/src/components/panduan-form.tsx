"use client"

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, ChevronLeft, Loader2, Image as ImageIcon, QrCode, Book } from 'lucide-react'
import Link from 'next/link'
import { SlugInput } from './slug-input'
import { MediaPicker } from './media/media-picker'
import { AIFieldAssist } from './ai/ai-field-assist'
import { DraftGeneratorPanel } from './ai/draft-generator-panel'
import { ImagePromptsPanel } from './ai/image-prompts-panel'
import {
  panduanAIGenerateSlug,
  panduanAIGenerateSeoPack,
  panduanAIGenerateFullDraft,
  panduanAIGenerateImagePrompts,
  panduanAIVerifyLatestFacts,
} from '@/app/cms/panduan/actions-ai'
import type {
  GenerateSlugOutput,
  GenerateSEOPackOutput,
} from '@/lib/ai/schemas'
import type { FormAIHistoryState } from '@/lib/ai/history'
import dynamic from 'next/dynamic'
import type { RichEditorHandle } from './editor/RichEditor'

const RichEditor = dynamic(() => import('./editor/RichEditor').then(mod => mod.RichEditor), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center text-gray-400">Loading Editor...</div>
})

const panduanSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  content: z.string().catch(''),
  bab_ref: z.string().catch(''),
  qr_slug: z.string().catch(''),
  cover_image: z.string().catch(''),
  meta_title: z.string().catch(''),
  meta_desc: z.string().catch(''),
  category: z.enum(['air', 'energi', 'pangan', 'medis', 'keamanan', 'komunitas']),
  status: z.enum(['draft', 'published']),
})

type PanduanFormValues = z.infer<typeof panduanSchema>

interface PanduanFormProps {
  initialData?: any
  initialAIState?: FormAIHistoryState
  onSubmit: (data: PanduanFormValues) => Promise<void>
  title: string
}

export function PanduanForm({ initialData, initialAIState, onSubmit, title }: PanduanFormProps) {
  const [recordId] = useState(() => initialData?.id ?? crypto.randomUUID())
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugMode, setSlugMode] = useState<'auto' | 'manual'>(initialData ? 'manual' : 'auto')
  const [isEditorReady, setIsEditorReady] = useState(false)
  const editorApiRef = useRef<RichEditorHandle | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PanduanFormValues>({
    resolver: zodResolver(panduanSchema),
    defaultValues: {
      id: initialData?.id || recordId,
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      content: initialData?.content || '',
      bab_ref: initialData?.bab_ref || '',
      qr_slug: initialData?.qr_slug || '',
      status: initialData?.status || 'draft',
      cover_image: initialData?.cover_image || '',
      meta_title: initialData?.meta_title || '',
      meta_desc: initialData?.meta_desc || '',
      category: initialData?.category || 'pangan',
    },
  })

  const titleValue = watch('title')
  const slugValue = watch('slug')
  const contentValue = watch('content')
  const metaDescValue = watch('meta_desc')
  const categoryValue = watch('category')

  const handleEditorReady = (api: RichEditorHandle | null) => {
    editorApiRef.current = api
    setIsEditorReady(Boolean(api))
  }

  const applyDraftToEditor = (mode: 'replace' | 'append', markdown: string) => {
    if (!editorApiRef.current) {
      setError('Editor belum siap menerima draft AI. Coba lagi dalam beberapa detik.')
      return
    }

    setError(null)

    if (mode === 'replace') {
      editorApiRef.current.replaceContent(markdown, { format: 'markdown' })
      return
    }

    editorApiRef.current.appendContent(markdown, { format: 'markdown' })
  }

  const applyDraftMetadata = (data: { suggested_slug?: string; suggested_meta_title?: string; suggested_meta_desc?: string }) => {
    if (data.suggested_slug) {
      setSlugMode('manual')
      setValue('slug', data.suggested_slug, { shouldDirty: true, shouldValidate: true })
    }

    if (data.suggested_meta_title) {
      setValue('meta_title', data.suggested_meta_title, { shouldDirty: true })
    }

    if (data.suggested_meta_desc) {
      setValue('meta_desc', data.suggested_meta_desc, { shouldDirty: true })
    }
  }

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
      <input type="hidden" {...register('id')} />
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

            <div className="flex items-start gap-3">
              <div className="flex-1">
                <SlugInput
                  titleValue={titleValue}
                  value={slugValue}
                  mode={initialData ? 'edit' : 'create'}
                  modePreference={slugMode}
                  onModeChange={setSlugMode}
                  onChange={(val) => setValue('slug', val, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })}
                  error={errors.slug?.message}
                />
              </div>
              <div className="pt-6">
                <AIFieldAssist<GenerateSlugOutput>
                  label="AI Slug"
                  compact
                  disabled={!titleValue}
                  generate={() => panduanAIGenerateSlug({ title: titleValue }, { panduanId: recordId })}
                  onApply={(data) => {
                    setSlugMode('manual')
                    setValue('slug', data.slug, { shouldDirty: true, shouldValidate: true })
                  }}
                  renderPreview={(data) => (
                    <div className="space-y-2">
                      <div className="p-2 bg-arkara-amber/10 rounded-lg">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Utama</span>
                        <p className="text-sm font-bold text-arkara-green">{data.slug}</p>
                      </div>
                      {data.alternatives && data.alternatives.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Alternatif</span>
                          {data.alternatives.map((alt, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setSlugMode('manual')
                                setValue('slug', alt, { shouldDirty: true, shouldValidate: true })
                              }}
                              className="block w-full text-left p-1.5 text-xs bg-gray-50 hover:bg-arkara-amber/10 rounded transition-colors"
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

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

            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center mb-1">
                 <label className="text-sm font-medium text-gray-700">Konten Panduan Teknis</label>
                 <span className="text-[10px] font-bold tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded">WYSIWYG</span>
              </div>

              <DraftGeneratorPanel
                title={titleValue}
                entityLabel="panduan"
                editorReady={isEditorReady}
                initialState={initialAIState?.fullDraft ? {
                  input: initialAIState.fullDraft.input,
                  result: initialAIState.fullDraft.output,
                  model: initialAIState.fullDraft.model,
                } : undefined}
                generateDraft={(input) => panduanAIGenerateFullDraft(input, { panduanId: recordId })}
                onReplaceContent={(markdown) => applyDraftToEditor('replace', markdown)}
                onAppendContent={(markdown) => applyDraftToEditor('append', markdown)}
                onApplyMetadata={applyDraftMetadata}
              />

              <RichEditor
                value={contentValue || ''}
                onEditorReady={handleEditorReady}
                aiConfig={{
                  title: titleValue,
                  verifyLatestFacts: (input) => panduanAIVerifyLatestFacts(input, { panduanId: recordId }),
                }}
                onChange={(val: string) => setValue('content', val, { shouldValidate: true, shouldDirty: true })}
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
                <MediaPicker 
                  onSelect={(data) => setValue('cover_image', data.url || data.file_path, { shouldValidate: true })} 
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-bold text-gray-900 border-b pb-3">Taksonomi</h3>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Topik Kategori Utama</label>
              <select
                {...register('category')}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition-all outline-none font-semibold text-gray-700"
              >
                <option value="air">Air (Sistem & Filtrasi)</option>
                <option value="energi">Energi & Daya</option>
                <option value="pangan">Pangan & Tani</option>
                <option value="medis">Medis & P3K</option>
                <option value="keamanan">Keamanan Pertahanan</option>
                <option value="komunitas">Komunitas / Logistik</option>
              </select>
            </div>
          </div>

          <ImagePromptsPanel
            title={titleValue}
            content={contentValue || ''}
            excerpt={metaDescValue || undefined}
            category={categoryValue}
            entityLabel="panduan teknis"
            initialResult={initialAIState?.imagePrompts?.output ?? null}
            initialModel={initialAIState?.imagePrompts?.model ?? null}
            initialGeneratedFrom={initialAIState?.imagePrompts ? {
              title: initialAIState.imagePrompts.input.title,
              content: initialAIState.imagePrompts.input.content,
              excerpt: initialAIState.imagePrompts.input.excerpt,
              focusKeyword: initialAIState.imagePrompts.input.focus_keyword,
              category: initialAIState.imagePrompts.input.category,
            } : null}
            generatePrompts={(input) => panduanAIGenerateImagePrompts(input, { panduanId: recordId })}
          />

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900">SEO Settings</h3>
              <AIFieldAssist<GenerateSEOPackOutput>
                label="AI SEO Pack"
                compact
                disabled={!titleValue}
                generate={() => panduanAIGenerateSeoPack(
                  { title: titleValue, content: contentValue },
                  { panduanId: recordId }
                )}
                onApply={(data) => {
                  setValue('meta_title', data.meta_title, { shouldDirty: true })
                  setValue('meta_desc', data.meta_desc, { shouldDirty: true })
                }}
                renderPreview={(data) => (
                  <div className="space-y-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Meta Title</span>
                      <p className="text-xs text-gray-800">{data.meta_title}</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Meta Description</span>
                      <p className="text-xs text-gray-800">{data.meta_desc}</p>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Focus Keyword</span>
                      <p className="text-xs font-bold text-arkara-green">{data.focus_keyword}</p>
                    </div>
                  </div>
                )}
              />
            </div>
            
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
