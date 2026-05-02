"use server"

/**
 * AI Server Actions — /cms/ai workspace.
 *
 * Thin server action layer that delegates to src/lib/ai/operations.
 * These are callable from client components in the AI workspace.
 */

import {
  generateSlug,
  generateSeoPack,
  generateOutline,
  generateFullDraft,
  generateImagePrompts,
  generateClusterIdeas,
  rewriteSection,
  expandSection,
  generateFAQ,
  researchWithWeb,
  verifyLatestFacts,
} from '@/lib/ai/operations'
import { createClient } from '@/lib/supabase/server'
import type {
  GenerateSlugInput,
  GenerateSEOPackInput,
  GenerateOutlineInput,
  GenerateFullDraftInput,
  GenerateImagePromptsInput,
  GenerateClusterIdeasInput,
  RewriteSectionInput,
  ExpandSectionInput,
  GenerateFAQInput,
  ResearchWithWebInput,
  VerifyLatestFactsInput,
} from '@/lib/ai/schemas'

// ─── Workspace context (no specific target) ──────────────────────
const workspaceCtx = { targetType: 'workspace' as const }
const CLUSTER_SOURCE_CONTENT_LIMIT = 12000

export interface ClusterSourcePostOption {
  id: string
  title: string
  slug: string
  category: string | null
  status: 'draft' | 'published'
  description: string | null
  updated_at: string | null
  published_at: string | null
}

function compactSourceContent(content?: string | null) {
  const value = (content ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (value.length <= CLUSTER_SOURCE_CONTENT_LIMIT) {
    return value
  }

  return `${value.slice(0, CLUSTER_SOURCE_CONTENT_LIMIT)}\n\n[Konten dipotong untuk efisiensi token.]`
}

export async function getClusterSourcePosts(): Promise<ClusterSourcePostOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, category, status, description, updated_at, published_at')
    .order('updated_at', { ascending: false, nullsFirst: false })

  if (error) {
    throw new Error(`Gagal memuat daftar artikel: ${error.message}`)
  }

  return (data ?? []).map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category ?? null,
    status: post.status,
    description: post.description ?? null,
    updated_at: post.updated_at ?? null,
    published_at: post.published_at ?? null,
  }))
}

export async function actionGenerateSlug(input: GenerateSlugInput) {
  return generateSlug(input, workspaceCtx)
}

export async function actionGenerateSeoPack(input: GenerateSEOPackInput) {
  return generateSeoPack(input, workspaceCtx)
}

export async function actionGenerateOutline(input: GenerateOutlineInput) {
  return generateOutline(input, workspaceCtx)
}

export async function actionGenerateFullDraft(input: GenerateFullDraftInput) {
  return generateFullDraft(input, workspaceCtx)
}

export async function actionGenerateImagePrompts(input: GenerateImagePromptsInput) {
  return generateImagePrompts(input, workspaceCtx)
}

export async function actionGenerateClusterIdeas(input: GenerateClusterIdeasInput) {
  return generateClusterIdeas(input, workspaceCtx)
}

export async function actionGenerateClusterIdeasFromPost(input: { postId: string }) {
  const postId = input.postId?.trim()

  if (!postId) {
    return { success: false as const, error: 'Pilih artikel sumber terlebih dahulu.' }
  }

  const supabase = await createClient()
  const [{ data: post, error: postError }, { data: titleRows, error: titlesError }] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, slug, category, status, description, content')
      .eq('id', postId)
      .maybeSingle(),
    supabase
      .from('posts')
      .select('id, title')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(300),
  ])

  if (postError) {
    return { success: false as const, error: `Gagal memuat artikel sumber: ${postError.message}` }
  }

  if (!post) {
    return { success: false as const, error: 'Artikel sumber tidak ditemukan.' }
  }

  if (titlesError) {
    return { success: false as const, error: `Gagal memuat daftar judul pembanding: ${titlesError.message}` }
  }

  return generateClusterIdeas(
    {
      topic: post.title,
      source_title: post.title,
      source_slug: post.slug,
      source_description: post.description ?? undefined,
      source_content: compactSourceContent(post.content),
      source_category: post.category ?? undefined,
      source_status: post.status,
      existing_titles: (titleRows ?? [])
        .filter((row) => row.id !== post.id && row.title)
        .map((row) => row.title),
    },
    workspaceCtx
  )
}

export async function actionRewriteSection(input: RewriteSectionInput) {
  return rewriteSection(input, workspaceCtx)
}

export async function actionExpandSection(input: ExpandSectionInput) {
  return expandSection(input, workspaceCtx)
}

export async function actionGenerateFAQ(input: GenerateFAQInput) {
  return generateFAQ(input, workspaceCtx)
}

export async function actionResearchWithWeb(input: ResearchWithWebInput) {
  return researchWithWeb(input, workspaceCtx)
}

export async function actionVerifyLatestFacts(input: VerifyLatestFactsInput) {
  return verifyLatestFacts(input, workspaceCtx)
}
