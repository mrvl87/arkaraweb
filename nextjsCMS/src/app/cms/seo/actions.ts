"use server"

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateGapDraft, generateSeoRepairPlan } from '@/lib/ai/operations'
import { triggerFrontendRevalidate } from '@/lib/revalidate'
import { getPanduanPath, getPostPath, normalizeSlug } from '@/lib/slugs'
import { enqueueSeoIndexingUrl, getContentPath, getContentUrl } from '@/lib/seo/indexing-queue'
import {
  deleteSeoKeywordSignal,
  parseKeywordSignalPaste,
  updateSeoKeywordSignal,
  upsertSeoKeywordSignals,
  SEO_KEYWORD_SIGNAL_CLUSTERS,
  SEO_KEYWORD_SIGNAL_PRIORITIES,
  SEO_KEYWORD_SIGNAL_SOURCES,
  SEO_KEYWORD_SIGNAL_STATUSES,
} from '@/lib/seo/keyword-signals'
import { GenerateSeoRepairPlanOutputSchema } from '@/lib/ai/schemas'
import type {
  GenerateGapDraftOutput,
  GenerateSeoRepairPlanInput,
  GenerateSeoRepairPlanOutput,
  SeoRepairKeywordOpportunitySchema,
} from '@/lib/ai/schemas'
import type { OperationResponse } from '@/lib/ai/operations'

const repairIssueInputSchema = z.object({
  code: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(240),
  severity: z.enum(['critical', 'warning', 'info']).default('warning'),
})

const repairKeywordOpportunityInputSchema = z.object({
  query: z.string().trim().min(1).max(180),
  arkaraRank: z.number().int().positive().nullable().optional(),
  topCompetitors: z.array(z.string().trim().min(1).max(180)).max(5).default([]),
  peopleAlsoAsk: z.array(z.string().trim().min(1).max(240)).max(6).default([]),
  relatedSearches: z.array(z.string().trim().min(1).max(240)).max(6).default([]),
})

const generateRepairInputSchema = z.object({
  contentType: z.enum(['post', 'panduan']),
  contentId: z.string().uuid(),
  issues: z.array(repairIssueInputSchema).min(1).max(10),
  keywordOpportunities: z.array(repairKeywordOpportunityInputSchema).max(8).default([]),
})

const applyRepairInputSchema = z.object({
  contentType: z.enum(['post', 'panduan']),
  contentId: z.string().uuid(),
  proposal: GenerateSeoRepairPlanOutputSchema,
  baseUpdatedAt: z.string().nullable().optional(),
  approved: z.literal(true),
})

const generateGapDraftInputSchema = z.object({
  cluster: z.enum(['air', 'energi', 'pangan', 'medis', 'keamanan', 'komunitas']),
  query: z.string().trim().min(1).max(180),
  contentType: z.enum(['post', 'panduan', 'auto']).default('auto'),
  topCompetitors: z.array(z.string().trim().min(1).max(180)).max(5).default([]),
  peopleAlsoAsk: z.array(z.string().trim().min(1).max(240)).max(6).default([]),
  relatedSearches: z.array(z.string().trim().min(1).max(240)).max(6).default([]),
})

const nullableClusterSchema = z.enum(SEO_KEYWORD_SIGNAL_CLUSTERS).nullable().optional()

const importKeywordSignalsInputSchema = z.object({
  source: z.enum(SEO_KEYWORD_SIGNAL_SOURCES).default('google_search_console'),
  cluster: nullableClusterSchema,
  rawText: z.string().trim().min(1, 'Tempel minimal 1 keyword.').max(180000),
})

const updateKeywordSignalInputSchema = z.object({
  id: z.string().uuid(),
  query: z.string().trim().min(1).max(220),
  source: z.enum(SEO_KEYWORD_SIGNAL_SOURCES),
  cluster: nullableClusterSchema,
  landingPage: z.string().trim().max(500).optional().default(''),
  impressions: z.coerce.number().int().min(0).max(100000000).default(0),
  clicks: z.coerce.number().int().min(0).max(100000000).default(0),
  ctr: z.coerce.number().min(0).max(1).nullable().optional(),
  averagePosition: z.coerce.number().min(0).max(1000).nullable().optional(),
  intent: z.string().trim().max(120).nullable().optional(),
  priority: z.enum(SEO_KEYWORD_SIGNAL_PRIORITIES).default('medium'),
  status: z.enum(SEO_KEYWORD_SIGNAL_STATUSES).default('active'),
  notes: z.string().trim().max(1000).nullable().optional(),
})

const deleteKeywordSignalInputSchema = z.object({
  id: z.string().uuid(),
})

type RepairKeywordOpportunityInput = z.infer<typeof SeoRepairKeywordOpportunitySchema>

interface ContentRow {
  id: string
  title: string
  slug: string
  content?: string | null
  description?: string | null
  category?: string | null
  quick_answer?: string | null
  key_takeaways?: string[] | null
  faq?: Array<{ question?: string; answer?: string }> | null
  editorial_format?: 'legacy' | 'mobile_reader' | 'technical_guide' | null
  meta_title?: string | null
  meta_desc?: string | null
  status?: 'draft' | 'published' | null
  updated_at?: string | null
}

function compactContent(content?: string | null): string {
  const value = (content ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return value.length <= 14000
    ? value
    : `${value.slice(0, 14000)}\n\n[Konten dipotong otomatis untuk efisiensi token.]`
}

function normalizeFaq(faq?: ContentRow['faq']) {
  return (faq ?? [])
    .map((item) => ({
      question: item.question?.trim() ?? '',
      answer: item.answer?.trim() ?? '',
    }))
    .filter((item) => item.question && item.answer)
    .slice(0, 12)
}

function normalizeKeywordOpportunities(
  items: RepairKeywordOpportunityInput[]
): GenerateSeoRepairPlanInput['keyword_opportunities'] {
  return items
    .map((item) => ({
      query: item.query,
      arkaraRank: item.arkaraRank ?? null,
      topCompetitors: item.topCompetitors ?? [],
      peopleAlsoAsk: item.peopleAlsoAsk ?? [],
      relatedSearches: item.relatedSearches ?? [],
    }))
    .slice(0, 8)
}

async function loadContentRow(contentType: 'post' | 'panduan', contentId: string): Promise<ContentRow | null> {
  const supabase = await createClient()
  const table = contentType === 'post' ? 'posts' : 'panduan'
  const selectWithCategory = 'id,title,slug,status,content,description,category,quick_answer,key_takeaways,faq,editorial_format,meta_title,meta_desc,updated_at'
  const selectFallback = 'id,title,slug,status,content,quick_answer,key_takeaways,faq,editorial_format,meta_title,meta_desc,updated_at'
  const first = await supabase
    .from(table)
    .select(selectWithCategory)
    .eq('id', contentId)
    .maybeSingle()

  if (!first.error) {
    return first.data as ContentRow | null
  }

  if (contentType === 'post') {
    throw new Error(`Gagal memuat artikel: ${first.error.message}`)
  }

  const fallback = await supabase
    .from(table)
    .select(selectFallback)
    .eq('id', contentId)
    .maybeSingle()

  if (fallback.error) {
    throw new Error(`Gagal memuat panduan: ${fallback.error.message}`)
  }

  return fallback.data as ContentRow | null
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineMarkdownToHtml(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

function listItemsToHtml(lines: string[], ordered: boolean): string {
  const tag = ordered ? 'ol' : 'ul'
  const items = lines
    .map((line) => {
      const text = ordered
        ? line.replace(/^\d+\.\s+/, '')
        : line.replace(/^[-*]\s+/, '')
      return `<li>${inlineMarkdownToHtml(text.trim())}</li>`
    })
    .join('')

  return `<${tag}>${items}</${tag}>`
}

function markdownPatchToHtml(markdown: string): string {
  const blocks = markdown
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
      const first = lines[0] ?? ''

      if (/^###\s+/.test(first)) {
        return `<h3>${inlineMarkdownToHtml(first.replace(/^###\s+/, '').trim())}</h3>`
      }

      if (/^##\s+/.test(first)) {
        return `<h2>${inlineMarkdownToHtml(first.replace(/^##\s+/, '').trim())}</h2>`
      }

      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        return listItemsToHtml(lines, false)
      }

      if (lines.every((line) => /^\d+\.\s+/.test(line))) {
        return listItemsToHtml(lines, true)
      }

      if (lines.every((line) => /^>\s?/.test(line))) {
        const text = lines.map((line) => line.replace(/^>\s?/, '')).join('<br />')
        return `<blockquote>${inlineMarkdownToHtml(text)}</blockquote>`
      }

      return `<p>${inlineMarkdownToHtml(lines.join(' '))}</p>`
    })
    .join('\n')
}

function applyContentPatch(currentContent: string | null | undefined, patch: GenerateSeoRepairPlanOutput['content_patch']): string {
  const current = (currentContent ?? '').trim()
  const markdown = patch.markdown.trim()

  if (patch.mode === 'no_content_change' || !markdown) {
    return current
  }

  const isHtml = current.startsWith('<')
  const patchContent = isHtml ? markdownPatchToHtml(markdown) : markdown

  if (patch.mode === 'append_section') {
    return [current, patchContent].filter(Boolean).join('\n\n')
  }

  if (isHtml) {
    if (/<p\b[^>]*>[\s\S]*?<\/p>/i.test(current)) {
      return current.replace(/<p\b[^>]*>[\s\S]*?<\/p>/i, patchContent)
    }

    return [patchContent, current].filter(Boolean).join('\n\n')
  }

  const blocks = current.split(/\n{2,}/)
  const targetIndex = blocks.findIndex((block) => {
    const trimmed = block.trim()
    return trimmed && !trimmed.startsWith('#')
  })

  if (targetIndex === -1) {
    return [patchContent, current].filter(Boolean).join('\n\n')
  }

  blocks[targetIndex] = patchContent
  return blocks.join('\n\n').trim()
}

function normalizeTakeaways(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean).slice(0, 5)
}

function normalizeProposalFaq(items: GenerateSeoRepairPlanOutput['proposed_faq']) {
  return items
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question && item.answer)
    .slice(0, 6)
}

function getPublicPath(contentType: 'post' | 'panduan', slug: string): string {
  return contentType === 'post' ? getPostPath(slug) : getPanduanPath(slug)
}

function inferGapContentType(query: string): 'post' | 'panduan' {
  const normalized = query.toLowerCase()
  return /\b(cara|panduan|langkah|checklist|daftar|menyimpan|membuat|menghitung|memasang|filter|stok)\b/.test(normalized)
    ? 'panduan'
    : 'post'
}

function titleFromQuery(query: string): string {
  return query
    .split(/\s+/)
    .map((word) => word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : '')
    .join(' ')
    .trim()
}

async function loadExistingContentTitles(): Promise<string[]> {
  const supabase = await createClient()
  const [posts, panduan] = await Promise.all([
    supabase.from('posts').select('title').order('updated_at', { ascending: false }).limit(120),
    supabase.from('panduan').select('title').order('updated_at', { ascending: false }).limit(120),
  ])

  return [
    ...((posts.data ?? []) as Array<{ title?: string | null }>).map((item) => item.title ?? ''),
    ...((panduan.data ?? []) as Array<{ title?: string | null }>).map((item) => item.title ?? ''),
  ].map((title) => title.trim()).filter(Boolean)
}

async function slugExists(slug: string): Promise<boolean> {
  const supabase = await createClient()
  const [post, panduan] = await Promise.all([
    supabase.from('posts').select('id').eq('slug', slug).maybeSingle(),
    supabase.from('panduan').select('id').eq('slug', slug).maybeSingle(),
  ])

  return Boolean(post.data || panduan.data)
}

async function ensureUniqueContentSlug(rawSlug: string, fallbackTitle: string): Promise<string> {
  const base = normalizeSlug(rawSlug) || normalizeSlug(fallbackTitle)
  let candidate = base || `draft-${Date.now()}`
  let suffix = 2

  while (await slugExists(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }

  return candidate
}

function normalizeDraftFaq(items: GenerateGapDraftOutput['faq']) {
  return items
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question && item.answer)
    .slice(0, 6)
}

export async function actionImportSeoKeywordSignals(rawInput: unknown): Promise<{
  success: boolean
  error?: string
  data?: {
    importedCount: number
  }
}> {
  const parsed = importKeywordSignalsInputSchema.safeParse(rawInput)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join('; '),
    }
  }

  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      return { success: false, error: 'Unauthorized.' }
    }

    const drafts = parseKeywordSignalPaste(parsed.data.rawText, {
      source: parsed.data.source,
      cluster: parsed.data.cluster ?? null,
    })

    if (drafts.length === 0) {
      return { success: false, error: 'Tidak ada keyword valid yang bisa disimpan.' }
    }

    const rows = await upsertSeoKeywordSignals(drafts, userData.user.id)

    revalidatePath('/cms/seo')

    return {
      success: true,
      data: {
        importedCount: rows.length,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menyimpan keyword signal.',
    }
  }
}

export async function actionUpdateSeoKeywordSignal(rawInput: unknown): Promise<{
  success: boolean
  error?: string
}> {
  const parsed = updateKeywordSignalInputSchema.safeParse(rawInput)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join('; '),
    }
  }

  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      return { success: false, error: 'Unauthorized.' }
    }

    const { id, ...patch } = parsed.data
    await updateSeoKeywordSignal(id, patch)

    revalidatePath('/cms/seo')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal update keyword signal.',
    }
  }
}

export async function actionDeleteSeoKeywordSignal(rawInput: unknown): Promise<{
  success: boolean
  error?: string
}> {
  const parsed = deleteKeywordSignalInputSchema.safeParse(rawInput)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join('; '),
    }
  }

  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      return { success: false, error: 'Unauthorized.' }
    }

    await deleteSeoKeywordSignal(parsed.data.id)

    revalidatePath('/cms/seo')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal hapus keyword signal.',
    }
  }
}

export async function actionGenerateSeoRepairPlan(
  rawInput: unknown
): Promise<OperationResponse<GenerateSeoRepairPlanOutput>> {
  const parsed = generateRepairInputSchema.safeParse(rawInput)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join('; '),
    }
  }

  const input = parsed.data

  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const row = await loadContentRow(input.contentType, input.contentId)

    if (!row) {
      return { success: false, error: 'Konten tidak ditemukan.' }
    }

    return generateSeoRepairPlan(
      {
        content_type: input.contentType,
        title: row.title,
        slug: row.slug,
        category: row.category ?? undefined,
        current_content: compactContent(row.content),
        current_description: row.description ?? undefined,
        current_meta_title: row.meta_title ?? undefined,
        current_meta_desc: row.meta_desc ?? undefined,
        current_quick_answer: row.quick_answer ?? undefined,
        current_key_takeaways: row.key_takeaways ?? [],
        current_faq: normalizeFaq(row.faq),
        current_editorial_format: row.editorial_format ?? undefined,
        issues: input.issues,
        keyword_opportunities: normalizeKeywordOpportunities(input.keywordOpportunities),
      },
      {
        targetType: input.contentType,
        targetId: input.contentId,
        userId: userData.user?.id ?? null,
      }
    )
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal membuat proposal repair.',
    }
  }
}

export async function actionGenerateGapDraft(rawInput: unknown): Promise<{
  success: boolean
  error?: string
  data?: {
    id: string
    title: string
    slug: string
    contentType: 'post' | 'panduan'
    editPath: string
    publicPath: string
    publicUrl: string
    draftNotes: string[]
  }
}> {
  const parsed = generateGapDraftInputSchema.safeParse(rawInput)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join('; '),
    }
  }

  const input = parsed.data

  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      return { success: false, error: 'Unauthorized.' }
    }

    const contentType = input.contentType === 'auto'
      ? inferGapContentType(input.query)
      : input.contentType
    const existingTitles = await loadExistingContentTitles()
    const draft = await generateGapDraft(
      {
        content_type: contentType,
        cluster: input.cluster,
        query: input.query,
        top_competitors: input.topCompetitors,
        people_also_ask: input.peopleAlsoAsk,
        related_searches: input.relatedSearches,
        existing_titles: existingTitles,
      },
      {
        targetType: contentType,
        targetId: null,
        userId: userData.user.id,
      }
    )

    if (!draft.success) {
      return { success: false, error: draft.error }
    }

    const title = draft.data.title.trim() || titleFromQuery(input.query)
    const slug = await ensureUniqueContentSlug(draft.data.slug, title)
    const now = new Date().toISOString()
    const baseData = {
      title,
      slug,
      content: draft.data.content,
      quick_answer: draft.data.quick_answer,
      key_takeaways: normalizeTakeaways(draft.data.key_takeaways),
      faq: normalizeDraftFaq(draft.data.faq),
      editorial_format: draft.data.editorial_format,
      meta_title: draft.data.meta_title,
      meta_desc: draft.data.meta_desc,
      status: 'draft',
      author_id: userData.user.id,
      updated_at: now,
    }

    const insertResult = contentType === 'post'
      ? await supabase
          .from('posts')
          .insert({
            ...baseData,
            description: draft.data.meta_desc,
            category: input.cluster,
            ai_generated: true,
          })
          .select('id')
          .single()
      : await supabase
          .from('panduan')
          .insert(baseData)
          .select('id')
          .single()

    if (insertResult.error || !insertResult.data) {
      return { success: false, error: insertResult.error?.message ?? 'Gagal membuat draft.' }
    }

    const id = insertResult.data.id as string
    const editPath = contentType === 'post'
      ? `/cms/posts/${id}/edit`
      : `/cms/panduan/${id}/edit`
    const publicPath = getContentPath(contentType, slug)

    revalidatePath('/cms/seo')
    revalidatePath(contentType === 'post' ? '/cms/posts' : '/cms/panduan')
    revalidatePath('/cms/dashboard')

    return {
      success: true,
      data: {
        id,
        title,
        slug,
        contentType,
        editPath,
        publicPath,
        publicUrl: getContentUrl(contentType, slug),
        draftNotes: draft.data.draft_notes,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal membuat draft dari gap.',
    }
  }
}

export async function actionApplySeoRepairPlan(rawInput: unknown): Promise<{
  success: boolean
  error?: string
  data?: {
    title: string
    slug: string
    publicPath: string
    editPath: string
    updatedAt: string
    appliedFields: string[]
    indexingQueued: boolean
    indexingQueueError?: string
  }
}> {
  const parsed = applyRepairInputSchema.safeParse(rawInput)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join('; '),
    }
  }

  const input = parsed.data

  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      return { success: false, error: 'Unauthorized.' }
    }

    const row = await loadContentRow(input.contentType, input.contentId)

    if (!row) {
      return { success: false, error: 'Konten tidak ditemukan.' }
    }

    if (input.baseUpdatedAt && row.updated_at && input.baseUpdatedAt !== row.updated_at) {
      return {
        success: false,
        error: 'Konten sudah berubah sejak audit terakhir. Refresh SEO Cockpit lalu generate ulang.',
      }
    }

    const updatedAt = new Date().toISOString()
    const content = applyContentPatch(row.content, input.proposal.content_patch)
    const table = input.contentType === 'post' ? 'posts' : 'panduan'
    const patch: Record<string, unknown> = {
      meta_title: input.proposal.proposed_meta_title.trim(),
      meta_desc: input.proposal.proposed_meta_desc.trim(),
      quick_answer: input.proposal.proposed_quick_answer.trim(),
      key_takeaways: normalizeTakeaways(input.proposal.proposed_key_takeaways),
      faq: normalizeProposalFaq(input.proposal.proposed_faq),
      content,
      updated_at: updatedAt,
    }

    if (input.contentType === 'post') {
      patch.description = input.proposal.proposed_meta_desc.trim()
    }

    const { error } = await supabase
      .from(table)
      .update(patch)
      .eq('id', input.contentId)

    if (error) {
      return { success: false, error: error.message }
    }

    const publicPath = getPublicPath(input.contentType, row.slug)
    const editPath = input.contentType === 'post'
      ? `/cms/posts/${input.contentId}/edit`
      : `/cms/panduan/${input.contentId}/edit`

    revalidatePath('/cms/seo')
    revalidatePath(editPath)
    revalidatePath(input.contentType === 'post' ? '/cms/posts' : '/cms/panduan')
    revalidatePath('/cms/dashboard')
    await triggerFrontendRevalidate({ type: input.contentType, slug: row.slug })
    const indexingResult = row.status === 'published'
      ? await enqueueSeoIndexingUrl({
          contentType: input.contentType,
          contentId: input.contentId,
          title: row.title,
          slug: row.slug,
          source: 'seo_repair_apply',
          userId: userData.user.id,
        })
      : { success: false, error: 'Konten masih draft, tidak masuk queue indexing.' }

    return {
      success: true,
      data: {
        title: row.title,
        slug: row.slug,
        publicPath,
        editPath,
        updatedAt,
        appliedFields: [
          'meta_title',
          'meta_desc',
          input.contentType === 'post' ? 'description' : '',
          'quick_answer',
          'key_takeaways',
          'faq',
          input.proposal.content_patch.mode === 'no_content_change' ? '' : 'content',
        ].filter(Boolean),
        indexingQueued: indexingResult.success,
        indexingQueueError: indexingResult.success ? undefined : indexingResult.error,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menerapkan proposal SEO.',
    }
  }
}
