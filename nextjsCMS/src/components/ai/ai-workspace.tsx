"use client"

/**
 * AI Workspace — Full editorial planning workspace.
 * Replaces the old generic chatbot interface with typed operations:
 * - SEO Pack Generator
 * - Outline Generator
 * - Full Draft Generator
 * - Cluster Ideas Generator
 */

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
  actionGenerateClusterIdeas,
} from '@/app/cms/ai/actions'
import { AIResultPreview } from './ai-result-preview'
import type {
  GenerateSEOPackOutput,
  GenerateOutlineOutput,
  GenerateFullDraftOutput,
  GenerateClusterIdeasOutput,
} from '@/lib/ai/schemas'

// ─── Operation Definitions ───────────────────────────────────────
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
    description: 'Meta title, description, excerpt & keywords',
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
    description: 'Ide konten dari topik pillar',
    icon: Lightbulb,
    color: 'text-amber-500',
  },
]

export function AIWorkspace() {
  const [activeOp, setActiveOp] = useState<WorkspaceOperation>('seo_pack')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<unknown>(null)
  const [resultOp, setResultOp] = useState<WorkspaceOperation | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [keyword, setKeyword] = useState('')
  const [angle, setAngle] = useState('')
  const [audience, setAudience] = useState('')
  const [notes, setNotes] = useState('')
  const [topic, setTopic] = useState('')

  const resetResult = () => {
    setResult(null)
    setResultOp(null)
    setError(null)
  }

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      let res
      switch (activeOp) {
        case 'seo_pack':
          res = await actionGenerateSeoPack({ title, content, description: '' })
          break
        case 'outline':
          res = await actionGenerateOutline({ title, keyword, angle, audience, notes })
          break
        case 'full_draft':
          res = await actionGenerateFullDraft({ title, keyword, angle, audience, notes })
          break
        case 'cluster_ideas':
          res = await actionGenerateClusterIdeas({ topic: topic || title })
          break
      }

      if (res.success) {
        setResult(res.data)
        setResultOp(activeOp)
      } else {
        setError(res.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.')
    } finally {
      setIsLoading(false)
    }
  }

  const activeOpDef = OPERATIONS.find((o) => o.id === activeOp)!

  // ─── Render result based on operation type ─────────────────────
  const renderResult = () => {
    if (!result || !resultOp) return null

    switch (resultOp) {
      case 'seo_pack': {
        const data = result as GenerateSEOPackOutput
        return (
          <AIResultPreview
            title="✨ SEO Pack"
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
        const data = result as GenerateOutlineOutput
        return (
          <AIResultPreview
            title="📋 Outline"
            rawJson={data}
            fields={[
              { label: 'Judul', value: data.outline_title },
              ...data.sections.map((s, i) => ({
                label: `Section ${i + 1}`,
                value: `**${s.heading}**${s.subheadings?.length ? '\n  - ' + s.subheadings.join('\n  - ') : ''}${s.notes ? '\n  _' + s.notes + '_' : ''}`,
              })),
              ...(data.estimated_word_count
                ? [{ label: 'Estimasi Kata', value: `${data.estimated_word_count} kata` }]
                : []),
            ]}
          />
        )
      }
      case 'full_draft': {
        const data = result as GenerateFullDraftOutput
        return (
          <div className="space-y-4">
            <AIResultPreview
              title="📝 Draft Metadata"
              rawJson={data}
              fields={[
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
                  📝 Konten Draft
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
        const data = result as GenerateClusterIdeasOutput
        return (
          <AIResultPreview
            title="💡 Cluster Ideas"
            rawJson={data}
            fields={[
              { label: 'Pillar Topic', value: data.pillar_topic },
              ...data.ideas.map((idea, i) => ({
                label: `Ide ${i + 1} (${idea.content_type || 'post'})`,
                value: `**${idea.title}**\nAngle: ${idea.angle}\nKeyword: ${idea.target_keyword}`,
              })),
            ]}
          />
        )
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Operation Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {OPERATIONS.map((op) => {
          const Icon = op.icon
          const isActive = activeOp === op.id
          return (
            <button
              key={op.id}
              type="button"
              onClick={() => {
                setActiveOp(op.id)
                resetResult()
              }}
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
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'text-arkara-amber' : op.color}`}
                  />
                </div>
                <span className={`text-sm font-bold ${isActive ? 'text-arkara-green' : 'text-gray-700'}`}>
                  {op.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-snug">{op.description}</p>
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
        {/* Input Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <activeOpDef.icon className={`w-5 h-5 ${activeOpDef.color}`} />
              <h3 className="text-lg font-bold text-arkara-green">{activeOpDef.label} Generator</h3>
            </div>

            {/* Title — used by all ops */}
            {activeOp !== 'cluster_ideas' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Judul Artikel
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masukkan judul artikel..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-arkara-amber/30 focus:border-arkara-amber transition-all outline-none text-sm"
                />
              </div>
            )}

            {/* Topic — cluster ideas only */}
            {activeOp === 'cluster_ideas' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Topik Pillar
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Pangan darurat, Survival medis..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-arkara-amber/30 focus:border-arkara-amber transition-all outline-none text-sm"
                />
              </div>
            )}

            {/* Content — SEO Pack only */}
            {activeOp === 'seo_pack' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Konten / Ringkasan (opsional)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="Tempel sebagian konten untuk hasil SEO yang lebih akurat..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-arkara-amber/30 focus:border-arkara-amber transition-all outline-none resize-none text-sm"
                />
              </div>
            )}

            {/* Extra fields for outline and draft */}
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
                      onChange={(e) => setKeyword(e.target.value)}
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
                      onChange={(e) => setAngle(e.target.value)}
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
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Contoh: pemula, prepper berpengalaman..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-arkara-amber/30 focus:border-arkara-amber transition-all outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Catatan Tambahan
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Poin khusus yang harus dicover, tone, referensi..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-arkara-amber/30 focus:border-arkara-amber transition-all outline-none resize-none text-sm"
                  />
                </div>
              </>
            )}

            {/* Generate Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={
                isLoading ||
                (activeOp === 'cluster_ideas' ? !topic.trim() : !title.trim())
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

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Hasil Generate
            </span>
            {result !== null && (
              <button
                type="button"
                onClick={resetResult}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {result !== null ? (
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
