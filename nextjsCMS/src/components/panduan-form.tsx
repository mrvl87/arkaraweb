"use client"

import { useEffect, useRef, useState } from 'react'
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
import { ContentAdoptionPanel } from './content-adoption-panel'
import { ImagePromptsPanel } from './ai/image-prompts-panel'
import { MobileReaderFields } from './mobile-reader-fields'
import { MobileReaderPreview } from './mobile-reader-preview'
import {
  panduanAIGenerateSlug,
  panduanAIGenerateSeoPack,
  panduanAIGenerateFullDraft,
  panduanAIGenerateMobileReaderStructure,
  panduanAIGenerateImagePrompts,
  panduanAIRewriteSection,
  panduanAIVerifyLatestFacts,
} from '@/app/cms/panduan/actions-ai'
import { getPanduanInternalLinkSuggestions, getPanduanSlugRoutingState } from '@/app/cms/panduan/actions'
import type {
  GenerateSlugOutput,
  GenerateFullDraftOutput,
  GenerateSEOPackOutput,
} from '@/lib/ai/schemas'
import type { FormAIHistoryState } from '@/lib/ai/history'
import type { PanduanSlugRoutingState } from '@/app/cms/panduan/actions'
import type { InternalLinkOpportunity } from '@/lib/internal-link-opportunities'
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
  quick_answer: z.string().catch(''),
  key_takeaways: z.array(z.string()).catch([]),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).catch([]),
  editorial_format: z.enum(['legacy', 'mobile_reader', 'technical_guide']).catch('legacy'),
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
  const [slugRouting, setSlugRouting] = useState<PanduanSlugRoutingState | null>(null)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const editorApiRef = useRef<RichEditorHandle | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors }
  } = useForm<PanduanFormValues>({
    resolver: zodResolver(panduanSchema),
    defaultValues: {
      id: initialData?.id || recordId,
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      content: initialData?.content || '',
      quick_answer: initialData?.quick_answer || '',
      key_takeaways: initialData?.key_takeaways || [],
      faq: initialData?.faq || [],
      editorial_format: initialData?.editorial_format || 'legacy',
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
  const statusValue = watch('status')
  const contentValue = watch('content')
  const quickAnswerValue = watch('quick_answer')
  const keyTakeawaysValue = watch('key_takeaways')
  const faqValue = watch('faq')
  const editorialFormatValue = watch('editorial_format')
  const coverImageValue = watch('cover_image')
  const metaDescValue = watch('meta_desc')
  const categoryValue = watch('category')
  const effectiveSlugError = errors.slug?.message || slugRouting?.exactConflict?.message
  const submitBlocked = isSubmitting || Boolean(slugRouting?.exactConflict)

  useEffect(() => {
    let isActive = true
    const timer = window.setTimeout(async () => {
      if (!isActive) return

      setIsCheckingSlug(true)

      try {
        const nextState = await getPanduanSlugRoutingState({
          slug: slugValue,
          panduanId: initialData?.id,
          currentSlug: initialData?.slug,
        })

        if (!isActive) return
        setSlugRouting(nextState)

        if (!nextState.exactConflict && !errors.slug?.message) {
          clearErrors('slug')
        }
      } catch {
        if (isActive) {
          setSlugRouting(null)
        }
      } finally {
        if (isActive) {
          setIsCheckingSlug(false)
        }
      }
    }, 250)

    return () => {
      isActive = false
      window.clearTimeout(timer)
    }
  }, [slugValue, initialData?.id, initialData?.slug, errors.slug?.message, clearErrors])

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

  const applyDraftMobileStructure = (data: {
    quick_answer?: string
    key_takeaways?: string[]
    faq?: { question: string; answer: string }[]
    editorial_format?: 'legacy' | 'mobile_reader' | 'technical_guide'
  }) => {
    setValue('quick_answer', data.quick_answer || '', { shouldDirty: true })
    setValue('key_takeaways', data.key_takeaways || [], { shouldDirty: true })
    setValue('faq', data.faq || [], { shouldDirty: true })
    setValue('editorial_format', data.editorial_format || 'mobile_reader', { shouldDirty: true })
  }

  const insertInternalLinkFromSuggestion = (item: InternalLinkOpportunity) => {
    if (!editorApiRef.current) {
      setError('Editor belum siap menerima internal link. Klik area editor lalu coba lagi.')
      return
    }

    setError(null)
    editorApiRef.current.insertContent(`[${item.suggestedAnchor || item.title}](${item.path})`, {
      format: 'markdown',
    })
  }

  const handleFormSubmit = async (data: PanduanFormValues) => {
    setIsSubmitting(true)
    setError(null)
    const sanitizedData: PanduanFormValues = {
      ...data,
      quick_answer: data.quick_answer?.trim() || '',
      key_takeaways: (data.key_takeaways ?? []).map((item) => item.trim()).filter(Boolean),
      faq: (data.faq ?? [])
        .map((item) => ({
          question: item.question.trim(),
          answer: item.answer.trim(),
        }))
        .filter((item) => item.question && item.answer),
    }

    try {
      await onSubmit(sanitizedData)
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
            disabled={submitBlocked}
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
                  error={effectiveSlugError}
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

            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-gray-400">Routing SEO</p>
                  <h3 className="text-sm font-bold text-gray-900">Canonical, redirect, dan historical path</h3>
                </div>
                <div className="text-[11px] font-medium text-gray-500">
                  {isCheckingSlug ? 'Memeriksa slug...' : 'Pemeriksaan real-time aktif'}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">URL Aktif Saat Ini</p>
                  <p className="mt-2 font-mono text-sm text-gray-700">
                    {slugRouting?.currentPath || '/panduan/(baru)'}
                  </p>
                </div>
                <div className="rounded-xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">URL Canonical Setelah Simpan</p>
                  <p className="mt-2 font-mono text-sm text-arkara-green">
                    {slugRouting?.requestedPath || '/panduan/(isi-slug-dulu)'}
                  </p>
                </div>
              </div>

              {slugRouting?.willCreateRedirect ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-bold">Perubahan slug ini akan membuat redirect permanen otomatis.</p>
                  <p className="mt-1 font-mono text-xs">
                    {slugRouting.currentPath} {'->'} {slugRouting.requestedPath}
                  </p>
                  <p className="mt-2 text-xs">
                    {statusValue === 'published'
                      ? 'Karena panduan akan tayang publik, redirect 301 akan aktif saat penyimpanan selesai.'
                      : 'Karena panduan masih draft, historical path akan disimpan dulu sebagai redirect nonaktif sampai panduan dipublish.'}
                  </p>
                </div>
              ) : null}

              {slugRouting?.restoringHistoricalSlug ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                  <p className="font-bold">Slug lama panduan ini sedang dipulihkan sebagai URL aktif.</p>
                  <p className="mt-1 text-xs">
                    Redirect lama untuk path ini akan dimatikan, lalu semua historical path lain akan diarahkan ke canonical yang baru.
                  </p>
                </div>
              ) : null}

              {slugRouting?.exactConflict ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <p className="font-bold">Slug bentrok dan tidak bisa disimpan.</p>
                  <p className="mt-1">{slugRouting.exactConflict.message}</p>
                  <p className="mt-2 font-mono text-xs">{slugRouting.exactConflict.path}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-red-500">{slugRouting.exactConflict.statusLabel}</p>
                </div>
              ) : null}

              {slugRouting?.similarMatches?.length ? (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm font-bold text-yellow-900">Slug ini cukup mirip dengan URL yang sudah ada.</p>
                  <div className="mt-3 space-y-2">
                    {slugRouting.similarMatches.map((match) => (
                      <div
                        key={`${match.source}-${match.slug}`}
                        className="rounded-lg border border-yellow-100 bg-white px-3 py-2 text-xs text-gray-700"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-gray-800">{match.path}</span>
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 font-bold text-yellow-900">
                            mirip {Math.round(match.score * 100)}%
                          </span>
                        </div>
                        <p className="mt-1 uppercase tracking-[0.18em] text-[10px] text-yellow-700">
                          {match.statusLabel}{match.title ? ` • ${match.title}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-800">Daftar Redirect Tersimpan</p>
                  <span className="text-[11px] font-medium text-gray-500">
                    {slugRouting?.redirects?.length ?? 0} historical path
                  </span>
                </div>

                {slugRouting?.redirects?.length ? (
                  <div className="space-y-2">
                    {slugRouting.redirects.map((redirect) => (
                      <div
                        key={redirect.id}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-mono text-xs text-gray-700">{redirect.sourcePath}</p>
                            <p className="mt-1 font-mono text-xs text-arkara-green">{redirect.targetPath}</p>
                          </div>
                          <span
                            className={`inline-flex h-fit items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                              redirect.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {redirect.isActive ? 'aktif' : 'nonaktif'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-4 text-sm text-gray-500">
                    Belum ada historical path untuk panduan ini. Begitu slug diubah, URL lama akan muncul di sini sebagai redirect permanen.
                  </div>
                )}
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
                streamTargetType="panduan"
                streamTargetId={recordId}
                initialState={initialAIState?.fullDraft ? {
                  input: initialAIState.fullDraft.input,
                  result: initialAIState.fullDraft.output,
                  model: initialAIState.fullDraft.model,
                } : undefined}
                generateDraft={(input) => panduanAIGenerateFullDraft(input, { panduanId: recordId })}
                onReplaceContent={(markdown) => applyDraftToEditor('replace', markdown)}
                onAppendContent={(markdown) => applyDraftToEditor('append', markdown)}
                onApplyMetadata={applyDraftMetadata}
                onApplyMobileStructure={applyDraftMobileStructure}
              />

              <RichEditor
                value={contentValue || ''}
                onEditorReady={handleEditorReady}
                aiConfig={{
                  title: titleValue,
                  verifyLatestFacts: (input) => panduanAIVerifyLatestFacts(input, { panduanId: recordId }),
                  rewriteSection: (input) => panduanAIRewriteSection(input, { panduanId: recordId }),
                  getInternalLinkSuggestions: (input) =>
                    getPanduanInternalLinkSuggestions({
                      panduanId: initialData?.id,
                      title: input.title,
                      content: input.content,
                      category: categoryValue,
                      publishedAt: initialData?.published_at || initialData?.created_at || null,
                    }),
                }}
                onChange={(val: string) => setValue('content', val, { shouldValidate: true, shouldDirty: true })}
              />

              <ContentAdoptionPanel
                entityLabel="panduan"
                sourceTitle={titleValue}
                sourceContent={contentValue || ''}
                sourceDescription={metaDescValue || undefined}
                editorReady={isEditorReady}
                generateStructure={(input) => panduanAIGenerateMobileReaderStructure(input, { panduanId: recordId })}
                findInternalLinks={(input) =>
                  getPanduanInternalLinkSuggestions({
                    panduanId: initialData?.id,
                    title: input.title,
                    content: input.content,
                    category: categoryValue,
                    publishedAt: initialData?.published_at || initialData?.created_at || null,
                  })
                }
                onApplyMobileStructure={applyDraftMobileStructure}
                onInsertInternalLink={insertInternalLinkFromSuggestion}
              />

              <MobileReaderFields
                quickAnswer={quickAnswerValue || ''}
                keyTakeaways={keyTakeawaysValue || []}
                faq={faqValue || []}
                editorialFormat={editorialFormatValue || 'legacy'}
                onQuickAnswerChange={(value) => setValue('quick_answer', value, { shouldDirty: true })}
                onKeyTakeawaysChange={(value) => setValue('key_takeaways', value, { shouldDirty: true })}
                onFaqChange={(value) => setValue('faq', value, { shouldDirty: true })}
                onEditorialFormatChange={(value) => setValue('editorial_format', value, { shouldDirty: true })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 text-left">
          <MobileReaderPreview
            title={titleValue}
            entityLabel="Panduan"
            description={metaDescValue || undefined}
            quickAnswer={quickAnswerValue || undefined}
            keyTakeaways={keyTakeawaysValue || []}
            faq={faqValue || []}
            editorialFormat={editorialFormatValue || 'legacy'}
            contentHtml={contentValue || ''}
            imageUrl={coverImageValue || undefined}
            category={categoryValue}
          />

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
