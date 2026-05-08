"use client"

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, ChevronLeft, Loader2, Image as ImageIcon, Layout, X } from 'lucide-react'
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
  postAIGenerateSlug,
  postAIGenerateSeoPack,
  postAIGenerateFullDraft,
  postAIGenerateMobileReaderStructure,
  postAIGenerateImagePrompts,
  postAIRewriteSection,
  postAIVerifyLatestFacts,
} from '@/app/cms/posts/actions-ai'
import { getPostInternalLinkSuggestions, getPostSlugRoutingState } from '@/app/cms/posts/actions'
import type { FormAIHistoryState } from '@/lib/ai/history'
import type { GenerateFullDraftOutput, GenerateSlugOutput, GenerateSEOPackOutput } from '@/lib/ai/schemas'
import type { PostSlugRoutingState } from '@/app/cms/posts/actions'
import type { InternalLinkOpportunity } from '@/lib/internal-link-opportunities'
import dynamic from 'next/dynamic'
import type { RichEditorHandle } from './editor/RichEditor'

const RichEditor = dynamic(() => import('./editor/RichEditor').then(mod => mod.RichEditor), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center text-gray-400">Loading Editor...</div>
})
const postSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  content: z.string().catch(''),
  description: z.string().catch(''),
  quick_answer: z.string().catch(''),
  key_takeaways: z.array(z.string()).catch([]),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).catch([]),
  editorial_format: z.enum(['legacy', 'mobile_reader', 'technical_guide']).catch('legacy'),
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
  initialAIState?: FormAIHistoryState
  onSubmit: (data: PostFormValues) => Promise<void>
  title: string
}

export function PostForm({ initialData, initialAIState, onSubmit, title }: PostFormProps) {
  const [recordId] = useState(() => initialData?.id ?? crypto.randomUUID())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugMode, setSlugMode] = useState<'auto' | 'manual'>(initialData ? 'manual' : 'auto')
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [slugRouting, setSlugRouting] = useState<PostSlugRoutingState | null>(null)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const editorApiRef = useRef<RichEditorHandle | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors }
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      id: initialData?.id || recordId,
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      content: initialData?.content || '',
      description: initialData?.description || '',
      quick_answer: initialData?.quick_answer || '',
      key_takeaways: initialData?.key_takeaways || [],
      faq: initialData?.faq || [],
      editorial_format: initialData?.editorial_format || 'legacy',
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
  const statusValue = watch('status')
  const contentValue = watch('content')
  const descriptionValue = watch('description')
  const quickAnswerValue = watch('quick_answer')
  const keyTakeawaysValue = watch('key_takeaways')
  const faqValue = watch('faq')
  const editorialFormatValue = watch('editorial_format')
  const coverImageValue = watch('cover_image')
  const watchThumbnail = watch('thumbnail_image')
  const watchBanner = watch('banner_image')
  const effectiveSlugError = errors.slug?.message || slugRouting?.exactConflict?.message
  const submitBlocked = isSubmitting || Boolean(slugRouting?.exactConflict)

  useEffect(() => {
    let isActive = true
    const timer = window.setTimeout(async () => {
      if (!isActive) return

      setIsCheckingSlug(true)

      try {
        const nextState = await getPostSlugRoutingState({
          slug: slugValue,
          postId: initialData?.id,
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

  const handleFormSubmit = async (data: PostFormValues) => {
    setIsSubmitting(true)
    setError(null)

    const sanitizedData: PostFormValues = {
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
    
    // For backwards compatibility, if we have a thumbnail but no cover image, use its URL
    if (sanitizedData.thumbnail_image && !sanitizedData.cover_image) {
       sanitizedData.cover_image = sanitizedData.thumbnail_image.url || undefined
    }

    try {
      await onSubmit(sanitizedData)
      // We don't push immediately here if the parent action throws
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const ImagePreview = ({ label, data, onRemove }: { label: string, data: any, onRemove: () => void }) => {
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

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 pb-20">
      <input type="hidden" {...register('id')} />
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
            disabled={submitBlocked}
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
                  generate={() => postAIGenerateSlug({ title: titleValue }, { postId: recordId })}
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
                    {slugRouting?.currentPath || '/blog/(baru)'}
                  </p>
                </div>
                <div className="rounded-xl border border-white bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">URL Canonical Setelah Simpan</p>
                  <p className="mt-2 font-mono text-sm text-arkara-green">
                    {slugRouting?.requestedPath || '/blog/(isi-slug-dulu)'}
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
                      ? 'Karena artikel akan tayang publik, redirect 301 akan aktif saat penyimpanan selesai.'
                      : 'Karena artikel masih draft, historical path akan disimpan dulu sebagai redirect nonaktif sampai artikel dipublish.'}
                  </p>
                </div>
              ) : null}

              {slugRouting?.restoringHistoricalSlug ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                  <p className="font-bold">Slug lama artikel ini sedang dipulihkan sebagai URL aktif.</p>
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
                    Belum ada historical path untuk artikel ini. Begitu slug diubah, URL lama akan muncul di sini sebagai redirect permanen.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Ringkasan (Dilihat di Google & Kartu Artikel)</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-amber-200 focus:border-amber-500 transition-all resize-none shadow-sm text-sm"
                placeholder="Tulis paragraf singkat 2-3 baris yang membuat orang penasaran untuk membaca..."
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center mb-1">
                 <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    Konten Artikel Utama
                    <span className="text-[10px] font-bold tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded">WYSIWYG / Notion-Style</span>
                 </label>
                 <div className="text-[10px] text-gray-400 font-medium">Ketikan "/" untuk menu konten cepat</div>
              </div>

              <DraftGeneratorPanel
                title={titleValue}
                entityLabel="artikel"
                editorReady={isEditorReady}
                streamTargetType="post"
                streamTargetId={recordId}
                initialState={initialAIState?.fullDraft ? {
                  input: initialAIState.fullDraft.input,
                  result: initialAIState.fullDraft.output,
                  model: initialAIState.fullDraft.model,
                } : undefined}
                generateDraft={(input) => postAIGenerateFullDraft(input, { postId: recordId })}
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
                  verifyLatestFacts: (input) => postAIVerifyLatestFacts(input, { postId: recordId }),
                  rewriteSection: (input) => postAIRewriteSection(input, { postId: recordId }),
                  getInternalLinkSuggestions: (input) =>
                    getPostInternalLinkSuggestions({
                      postId: initialData?.id,
                      title: input.title,
                      content: input.content,
                      publishedAt: initialData?.published_at || initialData?.created_at || null,
                    }),
                }}
                onChange={(val: string) => {
                  setValue('content', val, { 
                    shouldValidate: true,
                    shouldDirty: true 
                  })
                }} 
              />
              {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content.message}</p>}

              <ContentAdoptionPanel
                entityLabel="artikel"
                sourceTitle={titleValue}
                sourceContent={contentValue || ''}
                sourceDescription={descriptionValue || undefined}
                editorReady={isEditorReady}
                generateStructure={(input) => postAIGenerateMobileReaderStructure(input, { postId: recordId })}
                findInternalLinks={(input) =>
                  getPostInternalLinkSuggestions({
                    postId: initialData?.id,
                    title: input.title,
                    content: input.content,
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

        {/* Sidebar Settings */}
        <div className="space-y-6 text-left">
          <MobileReaderPreview
            title={titleValue}
            entityLabel="Artikel"
            description={descriptionValue || undefined}
            quickAnswer={quickAnswerValue || undefined}
            keyTakeaways={keyTakeawaysValue || []}
            faq={faqValue || []}
            editorialFormat={editorialFormatValue || 'legacy'}
            contentHtml={contentValue || ''}
            imageUrl={watchBanner?.url || watchThumbnail?.url || coverImageValue || undefined}
          />
          
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

          <ImagePromptsPanel
            title={titleValue}
            content={contentValue || ''}
            excerpt={descriptionValue || undefined}
            entityLabel="artikel blog"
            initialResult={initialAIState?.imagePrompts?.output ?? null}
            initialModel={initialAIState?.imagePrompts?.model ?? null}
            initialGeneratedFrom={initialAIState?.imagePrompts ? {
              title: initialAIState.imagePrompts.input.title,
              content: initialAIState.imagePrompts.input.content,
              excerpt: initialAIState.imagePrompts.input.excerpt,
              focusKeyword: initialAIState.imagePrompts.input.focus_keyword,
              category: initialAIState.imagePrompts.input.category,
            } : null}
            generatePrompts={(input) => postAIGenerateImagePrompts(input, { postId: recordId })}
          />

          {/* META & KATEGORI */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="font-bold text-gray-900">Taksonomi & SEO</h3>
              <AIFieldAssist<GenerateSEOPackOutput>
                label="AI SEO Pack"
                compact
                disabled={!titleValue}
                generate={() => postAIGenerateSeoPack(
                  { title: titleValue, content: contentValue, description: descriptionValue },
                  { postId: recordId }
                )}
                onApply={(data) => {
                  setValue('meta_title', data.meta_title, { shouldDirty: true })
                  setValue('meta_desc', data.meta_desc, { shouldDirty: true })
                  setValue('description', data.excerpt, { shouldDirty: true })
                }}
                renderPreview={(data) => (
                  <div className="space-y-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Meta Title</span>
                      <p className="text-xs text-gray-800">{data.meta_title}</p>
                      <span className="text-[10px] text-gray-400">{data.meta_title.length}/60</span>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Meta Description</span>
                      <p className="text-xs text-gray-800">{data.meta_desc}</p>
                      <span className="text-[10px] text-gray-400">{data.meta_desc.length}/155</span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Excerpt</span>
                      <p className="text-xs text-gray-800">{data.excerpt}</p>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Focus Keyword</span>
                      <p className="text-xs font-bold text-arkara-green">{data.focus_keyword}</p>
                      {data.secondary_keywords && (
                        <p className="text-[10px] text-gray-500 mt-1">{data.secondary_keywords.join(', ')}</p>
                      )}
                    </div>
                  </div>
                )}
              />
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
