"use client"

import { RotateCcw, Sparkles } from 'lucide-react'
import type { ClusterSourcePostOption } from '@/app/cms/ai/actions'
import { AIOperationTabs, AI_WORKSPACE_OPERATIONS } from './ai-operation-tabs'
import { AIWorkspaceForm } from './ai-workspace-form'
import { AIResultRenderer } from './ai-result-renderer'
import { useAIWorkspace } from './use-ai-workspace'

interface AIWorkspacePanelProps {
  clusterSourcePosts: ClusterSourcePostOption[]
  clusterSourcePostsError?: string | null
}

export function AIWorkspacePanel({
  clusterSourcePosts,
  clusterSourcePostsError = null,
}: AIWorkspacePanelProps) {
  const workspace = useAIWorkspace()
  const activeOperation = AI_WORKSPACE_OPERATIONS.find((item) => item.id === workspace.activeOp) ?? AI_WORKSPACE_OPERATIONS[0]
  const currentResult = workspace.results[workspace.activeOp] ?? null
  const currentError = workspace.errors[workspace.activeOp] ?? null
  const isLoading = workspace.loadingOp === workspace.activeOp
  const selectedClusterPost =
    clusterSourcePosts.find((post) => post.id === workspace.selectedClusterPostId) ?? null

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <AIOperationTabs
        activeOp={workspace.activeOp}
        targetType={workspace.targetType}
        onSelectOperation={workspace.setActiveOp}
        onSelectTargetType={workspace.setTargetType}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <AIWorkspaceForm
            activeOp={workspace.activeOp}
            activeOperation={activeOperation}
            title={workspace.title}
            content={workspace.content}
            keyword={workspace.keyword}
            angle={workspace.angle}
            audience={workspace.audience}
            notes={workspace.notes}
            excerpt={workspace.excerpt}
            focusArea={workspace.focusArea}
            category={workspace.category}
            selectedClusterPostId={workspace.selectedClusterPostId}
            selectedClusterPost={selectedClusterPost}
            clusterSourcePosts={clusterSourcePosts}
            clusterSourcePostsError={clusterSourcePostsError}
            isLoading={isLoading}
            onTitleChange={workspace.setTitle}
            onContentChange={workspace.setContent}
            onKeywordChange={workspace.setKeyword}
            onAngleChange={workspace.setAngle}
            onAudienceChange={workspace.setAudience}
            onNotesChange={workspace.setNotes}
            onExcerptChange={workspace.setExcerpt}
            onFocusAreaChange={workspace.setFocusArea}
            onCategoryChange={workspace.setCategory}
            onSelectClusterPost={workspace.setSelectedClusterPostId}
            onGenerate={workspace.handleGenerate}
          />

          {currentError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-600">
              {currentError}
            </div>
          ) : null}
        </div>

        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Hasil Generate
            </span>
            {currentResult !== null ? (
              <button
                type="button"
                onClick={() => workspace.resetResult(workspace.activeOp)}
                className="rounded-lg p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
                title="Reset"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {currentResult !== null ? (
            <AIResultRenderer activeOp={workspace.activeOp} result={currentResult} />
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                <Sparkles className="h-8 w-8 text-gray-200" />
              </div>
              <p className="text-sm font-bold text-gray-400">Belum ada hasil.</p>
              <p className="mt-1 max-w-xs text-xs text-gray-300">
                Pilih operasi di atas, isi form, lalu klik Generate untuk memulai.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}