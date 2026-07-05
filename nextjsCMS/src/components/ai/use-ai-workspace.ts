"use client"

import { useState } from 'react'
import {
  actionGenerateSeoPack,
  actionGenerateOutline,
  actionGenerateFullDraft,
  actionGenerateClusterIdeasFromPost,
  actionGenerateImagePrompts,
  actionVerifyLatestFacts,
} from '@/app/cms/ai/actions'
import type { AIWorkspaceActionContext, AIWorkspaceTargetType } from '@/app/cms/ai/actions'
import type {
  GenerateSEOPackOutput,
  GenerateOutlineOutput,
  GenerateFullDraftOutput,
  GenerateClusterIdeasOutput,
  GenerateImagePromptsOutput,
  VerifyLatestFactsOutput,
} from '@/lib/ai/schemas'

export type WorkspaceOperation =
  | 'seo_pack'
  | 'outline'
  | 'full_draft'
  | 'cluster_ideas'
  | 'verify_latest_facts'
  | 'image_prompts'

export type WorkspaceResultMap = {
  seo_pack: GenerateSEOPackOutput
  outline: GenerateOutlineOutput
  full_draft: GenerateFullDraftOutput
  cluster_ideas: GenerateClusterIdeasOutput
  verify_latest_facts: VerifyLatestFactsOutput
  image_prompts: GenerateImagePromptsOutput
}

export type WorkspaceResult = WorkspaceResultMap[WorkspaceOperation]
export type WorkspaceResults = Partial<WorkspaceResultMap>
export type WorkspaceErrors = Partial<Record<WorkspaceOperation, string>>

export function useAIWorkspace() {
  const [activeOp, setActiveOp] = useState<WorkspaceOperation>('seo_pack')
  const [targetType, setTargetType] = useState<AIWorkspaceTargetType>('workspace')
  const [loadingOp, setLoadingOp] = useState<WorkspaceOperation | null>(null)
  const [results, setResults] = useState<WorkspaceResults>({})
  const [errors, setErrors] = useState<WorkspaceErrors>({})

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [keyword, setKeyword] = useState('')
  const [angle, setAngle] = useState('')
  const [audience, setAudience] = useState('')
  const [notes, setNotes] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [focusArea, setFocusArea] = useState('')
  const [category, setCategory] = useState('')
  const [selectedClusterPostId, setSelectedClusterPostId] = useState('')

  const resetResult = (operation: WorkspaceOperation = activeOp) => {
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

    const ctx: AIWorkspaceActionContext = { targetType }

    try {
      let response:
        | { success: true; data: WorkspaceResult }
        | { success: false; error: string }

      switch (activeOp) {
        case 'seo_pack':
          response = await actionGenerateSeoPack({ title, content, description: '' }, ctx)
          break
        case 'outline':
          response = await actionGenerateOutline({ title, keyword, angle, audience, notes }, ctx)
          break
        case 'full_draft':
          response = await actionGenerateFullDraft({ title, keyword, angle, audience, notes }, ctx)
          break
        case 'cluster_ideas':
          response = await actionGenerateClusterIdeasFromPost({ postId: selectedClusterPostId }, ctx)
          break
        case 'verify_latest_facts':
          response = await actionVerifyLatestFacts({ title, content, excerpt, focus_area: focusArea }, ctx)
          break
        case 'image_prompts':
          response = await actionGenerateImagePrompts({ title, content, excerpt, focus_keyword: keyword, category }, ctx)
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

  return {
    activeOp,
    setActiveOp,
    targetType,
    setTargetType,
    loadingOp,
    results,
    errors,
    title,
    setTitle,
    content,
    setContent,
    keyword,
    setKeyword,
    angle,
    setAngle,
    audience,
    setAudience,
    notes,
    setNotes,
    excerpt,
    setExcerpt,
    focusArea,
    setFocusArea,
    category,
    setCategory,
    selectedClusterPostId,
    setSelectedClusterPostId,
    resetResult,
    handleGenerate,
  }
}