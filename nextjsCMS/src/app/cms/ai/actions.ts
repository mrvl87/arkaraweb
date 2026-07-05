"use server"

/**
 * AI Server Actions - /cms/ai workspace.
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

export type AIWorkspaceTargetType = 'workspace' | 'post' | 'panduan'
export type ClusterSourceContentType = 'post' | 'panduan'

export interface AIWorkspaceActionContext {
  targetType?: AIWorkspaceTargetType
}

const CLUSTER_SOURCE_CONTENT_LIMIT = 12000

export interface ClusterSourceContentOption {
  id: string
  type: ClusterSourceContentType
  title: string
  slug: string
  path: string
  category: string | null
  status: 'draft' | 'published'
  description: string | null
  updated_at: string | null
  published_at: string | null
}

type ClusterSourceDetail = ClusterSourceContentOption & {
  content: string | null
}

type SupabaseWorkspaceClient = Awaited<ReturnType<typeof createClient>>

function getWorkspaceCtx(ctx?: AIWorkspaceActionContext): { targetType: AIWorkspaceTargetType } {
  return { targetType: ctx?.targetType ?? 'workspace' }
}

function getPublicPath(type: ClusterSourceContentType, slug: string) {
  return type === 'post' ? `/blog/${slug}` : `/panduan/${slug}`
}

function normalizeStatus(status?: string | null): 'draft' | 'published' {
  return status === 'published' ? 'published' : 'draft'
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

function mapPostSource(row: Record<string, unknown>): ClusterSourceContentOption {
  const slug = String(row.slug ?? '')

  return {
    id: String(row.id ?? ''),
    type: 'post',
    title: String(row.title ?? ''),
    slug,
    path: getPublicPath('post', slug),
    category: typeof row.category === 'string' ? row.category : null,
    status: normalizeStatus(typeof row.status === 'string' ? row.status : null),
    description: typeof row.description === 'string' ? row.description : null,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : null,
    published_at: typeof row.published_at === 'string' ? row.published_at : null,
  }
}

function mapPanduanSource(row: Record<string, unknown>): ClusterSourceContentOption {
  const slug = String(row.slug ?? '')
  const metaDesc = typeof row.meta_desc === 'string' ? row.meta_desc : null
  const quickAnswer = typeof row.quick_answer === 'string' ? row.quick_answer : null

  return {
    id: String(row.id ?? ''),
    type: 'panduan',
    title: String(row.title ?? ''),
    slug,
    path: getPublicPath('panduan', slug),
    category: typeof row.category === 'string' ? row.category : null,
    status: normalizeStatus(typeof row.status === 'string' ? row.status : null),
    description: metaDesc ?? quickAnswer,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : null,
    published_at: typeof row.published_at === 'string' ? row.published_at : null,
  }
}

function sortSourceContent(items: ClusterSourceContentOption[]) {
  return [...items].sort((a, b) => {
    const bTime = Date.parse(b.updated_at ?? b.published_at ?? '') || 0
    const aTime = Date.parse(a.updated_at ?? a.published_at ?? '') || 0
    return bTime - aTime
  })
}

async function getPanduanSourceOptions(supabase: SupabaseWorkspaceClient): Promise<ClusterSourceContentOption[]> {
  const selectWithCategory = 'id, title, slug, category, status, meta_desc, quick_answer, updated_at, published_at'
  const selectFallback = 'id, title, slug, status, meta_desc, quick_answer, updated_at, published_at'
  const first = await supabase
    .from('panduan')
    .select(selectWithCategory)
    .order('updated_at', { ascending: false, nullsFirst: false })

  if (!first.error) {
    return (first.data ?? []).map((row) => mapPanduanSource(row as Record<string, unknown>))
  }

  const fallback = await supabase
    .from('panduan')
    .select(selectFallback)
    .order('updated_at', { ascending: false, nullsFirst: false })

  if (fallback.error) {
    throw new Error(`Gagal memuat daftar panduan: ${fallback.error.message}`)
  }

  return (fallback.data ?? []).map((row) => mapPanduanSource(row as Record<string, unknown>))
}

async function getPanduanSourceDetail(
  supabase: SupabaseWorkspaceClient,
  sourceId: string
): Promise<{ data: ClusterSourceDetail | null; error: string | null }> {
  const selectWithCategory = 'id, title, slug, category, status, meta_desc, quick_answer, content, updated_at, published_at'
  const selectFallback = 'id, title, slug, status, meta_desc, quick_answer, content, updated_at, published_at'
  const first = await supabase
    .from('panduan')
    .select(selectWithCategory)
    .eq('id', sourceId)
    .maybeSingle()

  if (!first.error) {
    const row = first.data as Record<string, unknown> | null
    return {
      data: row ? { ...mapPanduanSource(row), content: typeof row.content === 'string' ? row.content : null } : null,
      error: null,
    }
  }

  const fallback = await supabase
    .from('panduan')
    .select(selectFallback)
    .eq('id', sourceId)
    .maybeSingle()

  if (fallback.error) {
    return { data: null, error: fallback.error.message }
  }

  const row = fallback.data as Record<string, unknown> | null
  return {
    data: row ? { ...mapPanduanSource(row), content: typeof row.content === 'string' ? row.content : null } : null,
    error: null,
  }
}

async function getPostSourceDetail(
  supabase: SupabaseWorkspaceClient,
  sourceId: string
): Promise<{ data: ClusterSourceDetail | null; error: string | null }> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, category, status, description, content, updated_at, published_at')
    .eq('id', sourceId)
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  const row = data as Record<string, unknown> | null
  return {
    data: row ? { ...mapPostSource(row), content: typeof row.content === 'string' ? row.content : null } : null,
    error: null,
  }
}

async function getClusterExistingTitles(
  supabase: SupabaseWorkspaceClient,
  source: { id: string; type: ClusterSourceContentType }
): Promise<{ titles: string[]; error: string | null }> {
  const [postsResult, panduanResult] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(300),
    supabase
      .from('panduan')
      .select('id, title')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(300),
  ])

  if (postsResult.error) {
    return { titles: [], error: `Gagal memuat daftar judul post pembanding: ${postsResult.error.message}` }
  }

  if (panduanResult.error) {
    return { titles: [], error: `Gagal memuat daftar judul panduan pembanding: ${panduanResult.error.message}` }
  }

  const postTitles = (postsResult.data ?? [])
    .filter((row) => !(source.type === 'post' && row.id === source.id) && row.title)
    .map((row) => row.title)
  const panduanTitles = (panduanResult.data ?? [])
    .filter((row) => !(source.type === 'panduan' && row.id === source.id) && row.title)
    .map((row) => row.title)

  return { titles: [...postTitles, ...panduanTitles], error: null }
}

export async function getClusterSourceContent(): Promise<ClusterSourceContentOption[]> {
  const supabase = await createClient()
  const [postsResult, panduanOptions] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, slug, category, status, description, updated_at, published_at')
      .order('updated_at', { ascending: false, nullsFirst: false }),
    getPanduanSourceOptions(supabase),
  ])

  if (postsResult.error) {
    throw new Error(`Gagal memuat daftar artikel: ${postsResult.error.message}`)
  }

  const postOptions = (postsResult.data ?? []).map((row) => mapPostSource(row as Record<string, unknown>))
  return sortSourceContent([...postOptions, ...panduanOptions])
}

export async function actionGenerateSlug(input: GenerateSlugInput, ctx?: AIWorkspaceActionContext) {
  return generateSlug(input, getWorkspaceCtx(ctx))
}

export async function actionGenerateSeoPack(input: GenerateSEOPackInput, ctx?: AIWorkspaceActionContext) {
  return generateSeoPack(input, getWorkspaceCtx(ctx))
}

export async function actionGenerateOutline(input: GenerateOutlineInput, ctx?: AIWorkspaceActionContext) {
  return generateOutline(input, getWorkspaceCtx(ctx))
}

export async function actionGenerateFullDraft(input: GenerateFullDraftInput, ctx?: AIWorkspaceActionContext) {
  return generateFullDraft(input, getWorkspaceCtx(ctx))
}

export async function actionGenerateImagePrompts(input: GenerateImagePromptsInput, ctx?: AIWorkspaceActionContext) {
  return generateImagePrompts(input, getWorkspaceCtx(ctx))
}

export async function actionGenerateClusterIdeas(input: GenerateClusterIdeasInput, ctx?: AIWorkspaceActionContext) {
  return generateClusterIdeas(input, getWorkspaceCtx(ctx))
}

export async function actionGenerateClusterIdeasFromContent(
  input: { sourceId: string; type: ClusterSourceContentType },
  ctx?: AIWorkspaceActionContext
) {
  const sourceId = input.sourceId?.trim()
  const type = input.type === 'post' || input.type === 'panduan' ? input.type : null

  if (!sourceId || !type) {
    return { success: false as const, error: 'Pilih konten sumber terlebih dahulu.' }
  }

  const supabase = await createClient()
  const [sourceResult, titlesResult] = await Promise.all([
    type === 'post' ? getPostSourceDetail(supabase, sourceId) : getPanduanSourceDetail(supabase, sourceId),
    getClusterExistingTitles(supabase, { id: sourceId, type }),
  ])

  if (sourceResult.error) {
    const label = type === 'post' ? 'artikel' : 'panduan'
    return { success: false as const, error: `Gagal memuat ${label} sumber: ${sourceResult.error}` }
  }

  if (!sourceResult.data) {
    return { success: false as const, error: 'Konten sumber tidak ditemukan.' }
  }

  if (titlesResult.error) {
    return { success: false as const, error: titlesResult.error }
  }

  const source = sourceResult.data

  return generateClusterIdeas(
    {
      topic: source.title,
      source_title: source.title,
      source_slug: source.slug,
      source_description: source.description ?? undefined,
      source_content: compactSourceContent(source.content),
      source_category: source.category ?? undefined,
      source_status: source.status,
      existing_titles: titlesResult.titles,
    },
    getWorkspaceCtx(ctx)
  )
}

export async function actionRewriteSection(input: RewriteSectionInput, ctx?: AIWorkspaceActionContext) {
  return rewriteSection(input, getWorkspaceCtx(ctx))
}

export async function actionExpandSection(input: ExpandSectionInput, ctx?: AIWorkspaceActionContext) {
  return expandSection(input, getWorkspaceCtx(ctx))
}

export async function actionGenerateFAQ(input: GenerateFAQInput, ctx?: AIWorkspaceActionContext) {
  return generateFAQ(input, getWorkspaceCtx(ctx))
}

export async function actionResearchWithWeb(input: ResearchWithWebInput, ctx?: AIWorkspaceActionContext) {
  return researchWithWeb(input, getWorkspaceCtx(ctx))
}

export async function actionVerifyLatestFacts(input: VerifyLatestFactsInput, ctx?: AIWorkspaceActionContext) {
  return verifyLatestFacts(input, getWorkspaceCtx(ctx))
}