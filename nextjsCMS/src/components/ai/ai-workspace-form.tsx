"use client"

import { Loader2, Sparkles } from 'lucide-react'
import type { ClusterSourceContentOption } from '@/app/cms/ai/actions'
import type { OperationDef } from './ai-operation-tabs'
import { AIClusterSourceSelect } from './ai-cluster-source-select'
import type { WorkspaceOperation } from './use-ai-workspace'

interface AIWorkspaceFormProps {
  activeOp: WorkspaceOperation
  activeOperation: OperationDef
  title: string
  content: string
  keyword: string
  angle: string
  audience: string
  notes: string
  outline: string
  excerpt: string
  focusArea: string
  category: string
  selectedClusterContentKey: string
  selectedClusterContent: ClusterSourceContentOption | null
  clusterSourceContent: ClusterSourceContentOption[]
  clusterSourceContentError?: string | null
  isLoading: boolean
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onKeywordChange: (value: string) => void
  onAngleChange: (value: string) => void
  onAudienceChange: (value: string) => void
  onNotesChange: (value: string) => void
  onOutlineChange: (value: string) => void
  onExcerptChange: (value: string) => void
  onFocusAreaChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSelectClusterContent: (contentKey: string) => void
  onGenerate: () => void
}

export function AIWorkspaceForm({
  activeOp,
  activeOperation,
  title,
  content,
  keyword,
  angle,
  audience,
  notes,
  outline,
  excerpt,
  focusArea,
  category,
  selectedClusterContentKey,
  selectedClusterContent,
  clusterSourceContent,
  clusterSourceContentError = null,
  isLoading,
  onTitleChange,
  onContentChange,
  onKeywordChange,
  onAngleChange,
  onAudienceChange,
  onNotesChange,
  onOutlineChange,
  onExcerptChange,
  onFocusAreaChange,
  onCategoryChange,
  onSelectClusterContent,
  onGenerate,
}: AIWorkspaceFormProps) {
  const ActiveIcon = activeOperation.icon
  const needsContent = activeOp === 'seo_pack' || activeOp === 'verify_latest_facts' || activeOp === 'image_prompts'
  const requiresContent = activeOp === 'verify_latest_facts' || activeOp === 'image_prompts'
  const isGenerateDisabled = isLoading || (
    activeOp === 'cluster_ideas'
      ? !selectedClusterContentKey || Boolean(clusterSourceContentError)
      : !title.trim() || (requiresContent && !content.trim())
  )
  const contentLabel = activeOp === 'verify_latest_facts'
    ? 'Konten Untuk Dicek'
    : activeOp === 'image_prompts'
      ? 'Konten Referensi Visual'
      : 'Konten / Ringkasan'
  const contentPlaceholder = activeOp === 'verify_latest_facts'
    ? 'Tempel konten yang perlu dicek klaim terbarunya...'
    : activeOp === 'image_prompts'
      ? 'Tempel isi artikel agar prompt visual sesuai konteks...'
      : 'Tempel konten atau ringkasan untuk hasil SEO yang lebih akurat...'

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <ActiveIcon className={`h-5 w-5 ${activeOperation.color}`} />
        <h3 className="text-lg font-bold text-arkara-green">{activeOperation.label} Generator</h3>
      </div>

      {activeOp !== 'cluster_ideas' ? (
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Judul Artikel
          </label>
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Masukkan judul artikel..."
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
          />
        </div>
      ) : null}

      {activeOp === 'cluster_ideas' ? (
        <AIClusterSourceSelect
          clusterSourceContent={clusterSourceContent}
          clusterSourceContentError={clusterSourceContentError}
          selectedClusterContentKey={selectedClusterContentKey}
          selectedClusterContent={selectedClusterContent}
          onSelect={onSelectClusterContent}
        />
      ) : null}

      {needsContent ? (
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {contentLabel}
          </label>
          <textarea
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            rows={activeOp === 'seo_pack' ? 4 : 7}
            placeholder={contentPlaceholder}
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
          />
        </div>
      ) : null}

      {activeOp === 'verify_latest_facts' ? (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Excerpt Opsional
            </label>
            <textarea
              value={excerpt}
              onChange={(event) => onExcerptChange(event.target.value)}
              rows={2}
              placeholder="Ringkasan singkat jika tersedia..."
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Focus Area
            </label>
            <input
              type="text"
              value={focusArea}
              onChange={(event) => onFocusAreaChange(event.target.value)}
              placeholder="Contoh: data harga, regulasi, klaim produk..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
            />
          </div>
        </>
      ) : null}

      {activeOp === 'image_prompts' ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Focus Keyword
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(event) => onKeywordChange(event.target.value)}
                placeholder="Keyword visual"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(event) => onCategoryChange(event.target.value)}
                placeholder="Kategori artikel"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Excerpt Opsional
            </label>
            <textarea
              value={excerpt}
              onChange={(event) => onExcerptChange(event.target.value)}
              rows={2}
              placeholder="Ringkasan singkat untuk memperjelas konteks visual..."
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
            />
          </div>
        </>
      ) : null}

      {activeOp === 'outline' || activeOp === 'full_draft' ? (
        <>
         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Keyword
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(event) => onKeywordChange(event.target.value)}
                placeholder="Target keyword"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Sudut Pandang
              </label>
              <input
                type="text"
                value={angle}
                onChange={(event) => onAngleChange(event.target.value)}
                placeholder="Angle unik"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Audiens Target
            </label>
            <input
              type="text"
              value={audience}
              onChange={(event) => onAudienceChange(event.target.value)}
              placeholder="Contoh: pemula, survivalist rumahan..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Catatan Tambahan
            </label>
            <textarea
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              rows={3}
              placeholder="Poin penting, tone, atau batasan konten..."
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
            />
          </div>
          {activeOp === 'full_draft' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Outline Opsional
              </label>
              <textarea
                value={outline}
                onChange={(event) => onOutlineChange(event.target.value)}
                rows={4}
                placeholder="Tempel outline yang ingin dipakai sebagai struktur draft..."
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/30"
              />
            </div>
          ) : null}
        </>
      ) : null}

      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerateDisabled}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-arkara-amber py-3.5 font-bold text-arkara-green shadow-lg shadow-arkara-amber/20 transition-all hover:bg-arkara-amber/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Sedang Berpikir...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate {activeOperation.label}
          </>
        )}
      </button>
    </div>
  )
}