"use client"

import { useState } from 'react'
import {
  Sparkles,
  Search,
  List,
  FileText,
  Lightbulb,
  Loader2,
  RotateCcw,
  Zap,
} from 'lucide-react'
import {
  actionGenerateSeoPack,
  actionGenerateOutline,
  actionGenerateFullDraft,
  actionGenerateClusterIdeasFromPost,
} from '@/app/cms/ai/actions'
import { AIResultPreview } from './ai-result-preview'
import type {
  GenerateSEOPackOutput,
  GenerateOutlineOutput,
  GenerateFullDraftOutput,
  GenerateClusterIdeasOutput,
} from '@/lib/ai/schemas'
import type { ClusterSourcePostOption } from '@/app/cms/ai/actions'

type WorkspaceOperation = 'seo_pack' | 'outline' | 'full_draft' | 'cluster_ideas'

interface OperationDef {
  id: WorkspaceOperation
  label: string
  description: string
  icon: typeof Sparkles
  color: string
}

const OPERATIONS: OperationDef[] = [
  {
    id: 'seo_pack',
    label: 'SEO Pack',
    description: 'Meta title, description, excerpt, dan keywords',
    icon: Search,
    color: 'text-blue-500',
  },
  {
    id: 'outline',
    label: 'Outline',
    description: 'Kerangka artikel terstruktur',
    icon: List,
    color: 'text-emerald-500',
  },
  {
    id: 'full_draft',
    label: 'Full Draft',
    description: 'Artikel lengkap dari brief',
    icon: FileText,
    color: 'text-purple-500',
  },
  {
    id: 'cluster_ideas',
    label: 'Cluster Ideas',
    description: 'Ide konten dari artikel sumber',
    icon: Lightbulb,
    color: 'text-amber-500',
  },
]

interface AIWorkspacePanelProps {
  clusterSourcePosts: ClusterSourcePostOption[]
  clusterSourcePostsError?: string | null
}

function formatPostOption(post: ClusterSourcePostOption) {
  const status = post.status === 'published' ? 'published' : 'draft'
  const category = post.category ? ` — ${post.category}` : ''
  return `[${status}] ${post.title}${category}`
}

export function AIWorkspacePanel({
  clusterSourcePosts,
  clusterSourcePostsError = null,
}: AIWorkspacePanelProps) {
  const [activeOp, setActiveOp] = useState<WorkspaceOperation>('seo_pack')
  const [loadingOp, setLoadingOp] = useState<WorkspaceOperation | null>(null)
  const [results, setResults] = useState<Partial<Record<WorkspaceOperation, unknown>>>({})
  const [errors, setErrors] = useState<Partial<Record<WorkspaceOperation, string>>>({})

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [keyword, setKeyword] = useState('')
  const [angle, setAngle] = useState('')
  const [audience, setAudience] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedClusterPostId, setSelectedClusterPostId] = useState('')

  const resetResult = (operation: WorkspaceOperation) => {
    setResults((current) => {
      const next = { ...current }
      delete next[operation]
      return next
    })
    setErrors((current) => {
      const next = { ...current }
      delete next[operation]
      return next
    })
  }

  const handleGenerate = async () => {
    setLoadingOp(activeOp)
    setErrors((current) => {
      const next = { ...current }
      delete next[activeOp]
      return next
    })

    try {
      let response

      switch (activeOp) {
        case 'seo_pack':
          response = await actionGenerateSeoPack({ title, content, description: '' })
          break
        case 'outline':
          response = await actionGenerateOutline({ title, keyword, angle, audience, notes })
          break
        case 'full_draft':
          response = await actionGenerateFullDraft({ title, keyword, angle, audience, notes })
          break
        case 'cluster_ideas':
          response = await actionGenerateClusterIdeasFromPost({ postId: selectedClusterPostId })
          break
      }

      if (response.success) {
        setResults((current) => ({
          ...current,
          [activeOp]: response.data,
        }))
      } else {
        setErrors((current) => ({
          ...current,
          [activeOp]: response.error,
        }))
      }
    } catch (err) {
      setErrors((current) => ({
        ...current,
        [activeOp]: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      }))
    } finally {
      setLoadingOp(null)
    }
  }

  const activeOpDef = OPERATIONS.find((item) => item.id === activeOp)!
  const currentResult = results[activeOp] ?? null
  const currentError = errors[activeOp] ?? null
  const isLoading = loadingOp === activeOp
  const selectedClusterPost =
    clusterSourcePosts.find((post) => post.id === selectedClusterPostId) ?? null

  const renderResult = () => {
    if (!currentResult) return null

    switch (activeOp) {
      case 'seo_pack': {
        const data = currentResult as GenerateSEOPackOutput
        return (
          <AIResultPreview
            title="SEO Pack"
            rawJson={data}
            fields={[
              { label: 'Meta Title', value: data.meta_title },
              { label: 'Meta Description', value: data.meta_desc },
              { label: 'Excerpt', value: data.excerpt },
              { label: 'Focus Keyword', value: data.focus_keyword },
              ...(data.secondary_keywords?.length
                ? [{ label: 'Secondary Keywords', value: data.secondary_keywords.join(', ') }]
                : []),
            ]}
          />
        )
      }
      case 'outline': {
        const data = currentResult as GenerateOutlineOutput
        return (
          <AIResultPreview
            title="Outline"
            rawJson={data}
            fields={[
              { label: 'Judul', value: data.outline_title },
              ...data.sections.map((section, index) => ({
                label: `Section ${index + 1}`,
                value: [
                  section.heading,
                  ...(section.subheadings?.map((item) => `- ${item}`) ?? []),
                  ...(section.notes ? [`Catatan: ${section.notes}`] : []),
                ].join('\n'),
              })),
              ...(data.estimated_word_count
                ? [{ label: 'Estimasi Kata', value: `${data.estimated_word_count} kata` }]
                : []),
            ]}
          />
        )
      }
      case 'full_draft': {
        const data = currentResult as GenerateFullDraftOutput
        return (
          <div className="space-y-4">
            <AIResultPreview
              title="Draft Metadata"
              rawJson={data}
              fields={[
                ...(data.editorial_format ? [{ label: 'Format Editorial', value: data.editorial_format }] : []),
                ...(data.quick_answer ? [{ label: 'Jawaban Singkat', value: data.quick_answer }] : []),
                ...(data.key_takeaways?.length
                  ? [{ label: 'Inti Artikel', value: data.key_takeaways.join('\n') }]
                  : []),
                ...(data.faq?.length
                  ? [{ label: 'FAQ', value: data.faq.map((item) => `${item.question}\n${item.answer}`).join('\n\n') }]
                  : []),
                ...(data.suggested_slug ? [{ label: 'Slug', value: data.suggested_slug }] : []),
                ...(data.suggested_meta_title
                  ? [{ label: 'Meta Title', value: data.suggested_meta_title }]
                  : []),
                ...(data.suggested_meta_desc
                  ? [{ label: 'Meta Desc', value: data.suggested_meta_desc }]
                  : []),
                ...(data.word_count ? [{ label: 'Jumlah Kata', value: `${data.word_count}` }] : []),
              ]}
            />
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-gradient-to-r from-arkara-green to-arkara-green/90">
                <h4 className="text-sm font-bold text-arkara-amber tracking-wide">
                  Konten Draft
                </h4>
              </div>
              <div className="p-5 max-h-[600px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                  {data.content}
                </pre>
              </div>
            </div>
          </div>
        )
      }
      case 'cluster_ideas': {
        const data = currentResult as GenerateClusterIdeasOutput
        return (
          <AIResultPreview
            title="Cluster Ideas"
            rawJson={data}
            fields={[
              { label: 'Pillar Topic', value: data.pillar_topic },
              ...data.ideas.map((idea, index) => ({
                label: `Ide ${index + 1} (${idea.content_type || 'post'})`,
                value: `Title: ${idea.title}\nAngle: ${idea.angle}\nKeyword: ${idea.target_keyword}`,
              })),
            ]}
          />
        )
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {OPERATIONS.map((operation) => {
          const Icon = operation.icon
          const isActive = activeOp === operation.id

          return (
            <button
              key={operation.id}
              type="button"
              onClick={() => setActiveOp(operation.id)}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all group ${
                isActive
                  ? 'border-arkara-amber bg-arkara-amber/5 shadow-md shadow-arkara-amber/10'
                  : 'border-gray-100 bg-white hover:border-arkara-amber/30 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isActive ? 'bg-arkara-amber/20' : 'bg-gray-50 group-hover:bg-arkara-amber/10'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-arkara-amber' : operation.color}`} />
                </div>
                <span className={`text-sm font-bold ${isActive ? 'text-arkara-green' : 'text-gray-700'}`}>
                  {operation.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-snug">{operation.description}</p>
              {isActive && (
                <div className="absolute top-2 right-2">
                  <Zap className="w-4 h-4 text-arkara-amber fill-arkara-amber" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <activeOpDef.icon className={`w-5 h-5 ${activeOpDef.color}`} />
              <h3 className="text-lg font-bold text-arkara-green">{activeOpDef.label} Generator</h3>
            </div>

            {activeOp !== 'cluster_ideas' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Judul Artikel
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Masukkan judul artikel..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-arkara-amber/30 focus:border-arkara-amber transition-all outline-none text-sm"
                />
              </div>
            )}

            {activeOp === 'cluster_ideas' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Artikel Sumber
                </label>
                {clusterSourcePostsError ? (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs">
                    {clusterSourcePostsError}
                  </div>
                ) : clusterSourcePosts.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-xs">
                    Belum ada artikel yang bisa dipakai sebagai sumber cluster.
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedClusterPostId}
                      onChange={(event) => setSelectedClusterPostId(event.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-arkara-amber/30 focus:border-arkara-amber transition-all outline-none text-sm bg-white"
                    >
                      <option value="">Pilih artikel sumber...</option>
                      {clusterSourcePosts.map((post) => (
                        <option key={post.id} value={post.id}>
                          {formatPostOption(post)}
                        </option>
                      ))}
                    </select>

                    {selectedClusterPost && (
                      <div className="rounded-xl border border-arkara-amber/20 bg-arkara-amber/5 p-3 text-xs text-gray-600 space-y-1.5">
                        <div className="flex flex-wrap gap-2">
                          <span className="font-bold text-arkara-green uppercase">
                            {selectedClusterPost.status}
                          </span>
                          {selectedClusterPost.category && (
                            <span className="text-gray-400">/{selectedClusterPost.category}</span>
                          )}
                          <span className="text-gray-400">/blog/{selectedClusterPost.slug}</span>
                        </div>
                        {selectedClusterPost.description && (
                          <p className="leading-relaxed text-gray-500">
                            {selectedClusterPost.description}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeOp === 'seo_pack' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Konten / Ringkasan
                </label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={4}
                  placeholder="Tempel konten atau ringkasan untuk hasil SEO yang lebih akurat..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-arkara-amber/30 focus:border-arkara-amber transition-all outline-none resize-none text-sm"
                />
              </div>
            )}

            {(activeOp === 'outline' || activeOp === 'full_draft') && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Keyword
                    </label>
                    <input
                      type="text"
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="Target keyword"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-arkara-amber/30 focus:border-arkara-amber transition-all outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Sudut Pandang
                    </label>
                    <input
                      type="text"
                      value={angle}
                      onChange={(event) => setAngle(event.target.value)}
                      placeholder="Angle unik"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-arkara-amber/30 focus:border-arkara-amber transition-all outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Audiens Target
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(event) => setAudience(event.target.value)}
                    placeholder="Contoh: pemula, survivalist rumahan..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-arkara-amber/30 focus:border-arkara-amber transition-all outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Catatan Tambahan
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    placeholder="Poin penting, tone, atau batasan konten..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-arkara-amber/30 focus:border-arkara-amber transition-all outline-none resize-none text-sm"
                  />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={
                isLoading ||
                (activeOp === 'cluster_ideas'
                  ? !selectedClusterPostId || Boolean(clusterSourcePostsError)
                  : !title.trim())
              }
              className="w-full py-3.5 bg-arkara-amber hover:bg-arkara-amber/90 disabled:opacity-50 disabled:cursor-not-allowed text-arkara-green rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-arkara-amber/20 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sedang Berpikir...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate {activeOpDef.label}
                </>
              )}
            </button>

            {currentError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs">
                {currentError}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Hasil Generate
            </span>
            {currentResult !== null && (
              <button
                type="button"
                onClick={() => resetResult(activeOp)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {currentResult !== null ? (
            renderResult()
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-sm font-bold text-gray-400">Belum ada hasil.</p>
              <p className="text-xs text-gray-300 mt-1 max-w-xs">
                Pilih operasi di atas, isi form, lalu klik Generate untuk memulai.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
