"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { triggerFrontendRevalidate } from '@/lib/revalidate'
import { notifyGoogleIndexing } from '@/lib/google-indexing'
import { escapeRegex, getPostPath, getSlugSimilarityScore, normalizeSlug } from '@/lib/slugs'
import { findInternalLinkOpportunities } from '@/lib/internal-link-opportunities'

import type { MediaObject } from '@/types/content'

const SITE_URL = process.env.FRONTEND_SITE_URL || 'https://arkaraweb.com'
const SLUG_SIMILARITY_THRESHOLD = 0.72

type PostStatus = 'draft' | 'published'

interface PostSummary {
  id: string
  title: string
  slug: string
  status: PostStatus
}

interface PostSlugRedirectRow {
  id: string
  post_id: string
  source_slug: string
  source_path: string
  target_slug: string
  target_path: string
  redirect_type: 'permanent'
  is_active: boolean
  created_at: string | null
  updated_at: string | null
  deactivated_at: string | null
}

export interface PostSlugConflict {
  type: 'post' | 'redirect'
  message: string
  path: string
  title?: string
  statusLabel: string
}

export interface SimilarSlugMatch {
  slug: string
  path: string
  score: number
  source: 'post' | 'redirect'
  statusLabel: string
  title?: string
}

export interface PostSlugRedirectPreview {
  id: string
  sourceSlug: string
  sourcePath: string
  targetSlug: string
  targetPath: string
  isActive: boolean
  redirectType: 'permanent'
  createdAt: string | null
  deactivatedAt: string | null
}

export interface PostSlugRoutingState {
  requestedSlug: string
  requestedPath: string | null
  currentSlug: string | null
  currentPath: string | null
  willCreateRedirect: boolean
  restoringHistoricalSlug: boolean
  exactConflict: PostSlugConflict | null
  similarMatches: SimilarSlugMatch[]
  redirects: PostSlugRedirectPreview[]
}

const mediaObjectSchema = z.object({
  url: z.string().url(),
  alt_text: z.string().optional(),
  formats: z.object({
    sm: z.string().optional(),
    md: z.string().optional(),
    lg: z.string().optional(),
    original: z.string().optional(),
  }).optional(),
  aspect_ratio: z.string().optional(),
  dominant_color: z.string().optional(),
  blurhash: z.string().optional(),
}).nullable().optional()

const editorialFormatSchema = z.enum(['legacy', 'mobile_reader', 'technical_guide'])

const faqItemSchema = z.object({
  question: z.string().trim().min(1, 'Pertanyaan FAQ wajib diisi'),
  answer: z.string().trim().min(1, 'Jawaban FAQ wajib diisi'),
})

const slugSchema = z.string()
  .trim()
  .min(1, 'Slug wajib diisi')
  .transform((value) => normalizeSlug(value))
  .refine((value) => value.length > 0, 'Slug hanya boleh berisi huruf, angka, dan tanda hubung')

const postSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: slugSchema,
  content: z.string().optional().default(''),
  description: z.string().optional(),
  quick_answer: z.string().optional().default(''),
  key_takeaways: z.array(z.string().trim().min(1)).max(8).optional().default([]),
  faq: z.array(faqItemSchema).max(12).optional().default([]),
  editorial_format: editorialFormatSchema.optional().default('legacy'),
  status: z.enum(['draft', 'published']).default('draft'),
  cover_image: z.string().optional(),
  thumbnail_image: mediaObjectSchema,
  banner_image: mediaObjectSchema,
  meta_title: z.string().optional(),
  meta_desc: z.string().optional(),
})

const postSlugRoutingInputSchema = z.object({
  slug: z.string().optional().default(''),
  postId: z.string().uuid().optional(),
  currentSlug: z.string().optional(),
})

const postInternalLinkAuditSchema = z.object({
  postId: z.string().uuid().optional(),
  title: z.string().trim().min(1, 'Judul wajib diisi'),
  content: z.string().optional().default(''),
  category: z.string().optional(),
  publishedAt: z.string().optional().nullable(),
})

function toStatusLabel(status: PostStatus | 'active' | 'inactive'): string {
  switch (status) {
    case 'published':
      return 'artikel tayang'
    case 'draft':
      return 'artikel draft'
    case 'active':
      return 'redirect aktif'
    case 'inactive':
      return 'redirect nonaktif'
    default:
      return 'routing'
  }
}

function uniqueBySlug(items: SimilarSlugMatch[]): SimilarSlugMatch[] {
  const seen = new Set<string>()
  const result: SimilarSlugMatch[] = []

  for (const item of items) {
    if (seen.has(item.slug)) continue
    seen.add(item.slug)
    result.push(item)
  }

  return result
}

function replaceInternalBlogLinks(content: string, oldSlug: string, newSlug: string): string {
  if (!content || oldSlug === newSlug) return content

  const escapedOldSlug = escapeRegex(oldSlug)
  const patterns: Array<[RegExp, string]> = [
    [new RegExp(`/blog/${escapedOldSlug}(?=[/?#"'\\s<]|$)`, 'g'), `/blog/${newSlug}`],
    [new RegExp(`${escapeRegex(SITE_URL)}/blog/${escapedOldSlug}(?=[/?#"'\\s<]|$)`, 'g'), `${SITE_URL}/blog/${newSlug}`],
    [new RegExp(`https://arkaraweb\\.com/blog/${escapedOldSlug}(?=[/?#"'\\s<]|$)`, 'g'), `https://arkaraweb.com/blog/${newSlug}`],
  ]

  return patterns.reduce(
    (updatedContent, [pattern, replacement]) => updatedContent.replace(pattern, replacement),
    content
  )
}

async function getRedirectsForPost(supabase: Awaited<ReturnType<typeof createClient>>, postId?: string): Promise<PostSlugRedirectRow[]> {
  if (!postId) return []

  const { data, error } = await supabase
    .from('post_slug_redirects')
    .select('id, post_id, source_slug, source_path, target_slug, target_path, redirect_type, is_active, created_at, updated_at, deactivated_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[post_slug_redirects] failed to load redirects:', error.message)
    return []
  }

  return (data ?? []) as PostSlugRedirectRow[]
}

async function buildPostSlugRoutingState(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rawInput: z.infer<typeof postSlugRoutingInputSchema>
): Promise<PostSlugRoutingState> {
  const input = postSlugRoutingInputSchema.parse(rawInput)
  const requestedSlug = normalizeSlug(input.slug)
  const currentSlug = input.currentSlug ? normalizeSlug(input.currentSlug) : null
  const requestedPath = requestedSlug ? getPostPath(requestedSlug) : null
  const currentPath = currentSlug ? getPostPath(currentSlug) : null
  const redirects = (await getRedirectsForPost(supabase, input.postId)).map((redirect) => ({
    id: redirect.id,
    sourceSlug: redirect.source_slug,
    sourcePath: redirect.source_path,
    targetSlug: redirect.target_slug,
    targetPath: redirect.target_path,
    isActive: redirect.is_active,
    redirectType: redirect.redirect_type,
    createdAt: redirect.created_at,
    deactivatedAt: redirect.deactivated_at,
  }))

  if (!requestedSlug) {
    return {
      requestedSlug,
      requestedPath,
      currentSlug,
      currentPath,
      willCreateRedirect: false,
      restoringHistoricalSlug: false,
      exactConflict: null,
      similarMatches: [],
      redirects,
    }
  }

  const [{ data: exactPost }, { data: exactRedirect }, { data: postCandidates }, { data: redirectCandidates }] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, slug, status')
      .eq('slug', requestedSlug)
      .maybeSingle(),
    supabase
      .from('post_slug_redirects')
      .select('id, post_id, source_slug, source_path, target_slug, target_path, redirect_type, is_active, created_at, updated_at, deactivated_at')
      .eq('source_slug', requestedSlug)
      .maybeSingle(),
    supabase
      .from('posts')
      .select('id, title, slug, status')
      .order('updated_at', { ascending: false })
      .limit(250),
    supabase
      .from('post_slug_redirects')
      .select('post_id, source_slug, source_path, is_active')
      .order('updated_at', { ascending: false })
      .limit(250),
  ])

  const exactRedirectRow = exactRedirect as PostSlugRedirectRow | null
  const restoringHistoricalSlug = Boolean(
    exactRedirectRow &&
    exactRedirectRow.post_id === input.postId &&
    currentSlug &&
    requestedSlug !== currentSlug
  )

  let exactConflict: PostSlugConflict | null = null

  if (exactPost && exactPost.id !== input.postId) {
    exactConflict = {
      type: 'post',
      message: `Slug ini sudah dipakai oleh artikel "${exactPost.title}".`,
      path: getPostPath(exactPost.slug),
      title: exactPost.title,
      statusLabel: toStatusLabel(exactPost.status as PostStatus),
    }
  } else if (exactRedirectRow && exactRedirectRow.post_id !== input.postId) {
    exactConflict = {
      type: 'redirect',
      message: 'Slug ini sudah tercatat sebagai historical path milik artikel lain.',
      path: exactRedirectRow.source_path,
      statusLabel: toStatusLabel(exactRedirectRow.is_active ? 'active' : 'inactive'),
    }
  }

  const similarFromPosts = ((postCandidates ?? []) as PostSummary[])
    .filter((candidate) => candidate.slug !== requestedSlug && candidate.id !== input.postId)
    .map((candidate) => ({
      slug: candidate.slug,
      path: getPostPath(candidate.slug),
      score: getSlugSimilarityScore(requestedSlug, candidate.slug),
      source: 'post' as const,
      statusLabel: toStatusLabel(candidate.status),
      title: candidate.title,
    }))
    .filter((candidate) => candidate.score >= SLUG_SIMILARITY_THRESHOLD)

  const similarFromRedirects = ((redirectCandidates ?? []) as Array<Pick<PostSlugRedirectRow, 'post_id' | 'source_slug' | 'source_path' | 'is_active'>>)
    .filter((candidate) => candidate.source_slug !== requestedSlug && candidate.post_id !== input.postId)
    .map((candidate) => ({
      slug: candidate.source_slug,
      path: candidate.source_path,
      score: getSlugSimilarityScore(requestedSlug, candidate.source_slug),
      source: 'redirect' as const,
      statusLabel: toStatusLabel(candidate.is_active ? 'active' : 'inactive'),
    }))
    .filter((candidate) => candidate.score >= SLUG_SIMILARITY_THRESHOLD)

  const similarMatches = uniqueBySlug(
    [...similarFromPosts, ...similarFromRedirects]
      .sort((left, right) => right.score - left.score || left.slug.localeCompare(right.slug))
      .slice(0, 5)
  )

  return {
    requestedSlug,
    requestedPath,
    currentSlug,
    currentPath,
    willCreateRedirect: Boolean(currentSlug && requestedSlug !== currentSlug),
    restoringHistoricalSlug,
    exactConflict,
    similarMatches,
    redirects,
  }
}

async function ensureSlugAvailable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  options?: { postId?: string; currentSlug?: string }
) {
  const routingState = await buildPostSlugRoutingState(supabase, {
    slug,
    postId: options?.postId,
    currentSlug: options?.currentSlug,
  })

  if (routingState.exactConflict) {
    throw new Error(routingState.exactConflict.message)
  }

  return routingState
}

async function syncPostSlugRedirects(params: {
  supabase: Awaited<ReturnType<typeof createClient>>
  postId: string
  currentSlug: string
  previousSlug?: string | null
  isPublished: boolean
}) {
  const { supabase, postId, currentSlug, previousSlug, isPublished } = params
  const currentPath = getPostPath(currentSlug)
  const now = new Date().toISOString()
  const existingRedirects = await getRedirectsForPost(supabase, postId)

  const { error: updateExistingError } = await supabase
    .from('post_slug_redirects')
    .update({
      target_slug: currentSlug,
      target_path: currentPath,
      is_active: isPublished,
      updated_at: now,
      deactivated_at: isPublished ? null : now,
    })
    .eq('post_id', postId)
    .neq('source_slug', currentSlug)

  if (updateExistingError) {
    throw new Error(updateExistingError.message)
  }

  const currentSlugRedirect = existingRedirects.find((redirect) => redirect.source_slug === currentSlug)
  if (currentSlugRedirect) {
    const { error: deactivateCurrentError } = await supabase
      .from('post_slug_redirects')
      .update({
        target_slug: currentSlug,
        target_path: currentPath,
        is_active: false,
        updated_at: now,
        deactivated_at: now,
      })
      .eq('id', currentSlugRedirect.id)

    if (deactivateCurrentError) {
      throw new Error(deactivateCurrentError.message)
    }
  }

  if (previousSlug && previousSlug !== currentSlug) {
    const existingPrevious = existingRedirects.find((redirect) => redirect.source_slug === previousSlug)

    if (existingPrevious) {
      const { error: updatePreviousError } = await supabase
        .from('post_slug_redirects')
        .update({
          target_slug: currentSlug,
          target_path: currentPath,
          is_active: isPublished,
          updated_at: now,
          deactivated_at: isPublished ? null : now,
        })
        .eq('id', existingPrevious.id)

      if (updatePreviousError) {
        throw new Error(updatePreviousError.message)
      }
    } else {
      const { error: insertRedirectError } = await supabase
        .from('post_slug_redirects')
        .insert({
          post_id: postId,
          source_slug: previousSlug,
          source_path: getPostPath(previousSlug),
          target_slug: currentSlug,
          target_path: currentPath,
          redirect_type: 'permanent',
          is_active: isPublished,
          updated_at: now,
          deactivated_at: isPublished ? null : now,
        })

      if (insertRedirectError) {
        throw new Error(insertRedirectError.message)
      }
    }
  }
}

async function rewriteInternalLinksForSlugChange(params: {
  supabase: Awaited<ReturnType<typeof createClient>>
  postId: string
  oldSlug: string
  newSlug: string
}) {
  const { supabase, postId, oldSlug, newSlug } = params
  if (oldSlug === newSlug) return [] as string[]

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, content')
    .neq('id', postId)

  if (error) {
    console.error('[posts] failed to load internal link candidates:', error.message)
    return []
  }

  const changedSlugs: string[] = []
  const now = new Date().toISOString()

  for (const candidate of data ?? []) {
    const currentContent = typeof candidate.content === 'string' ? candidate.content : ''
    const nextContent = replaceInternalBlogLinks(currentContent, oldSlug, newSlug)

    if (nextContent === currentContent) continue

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        content: nextContent,
        updated_at: now,
      })
      .eq('id', candidate.id)

    if (!updateError && candidate.slug) {
      changedSlugs.push(candidate.slug)
    }
  }

  return changedSlugs
}

async function revalidatePostRoutes(slugs: string[]) {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))]
  await Promise.all(uniqueSlugs.map((slug) => triggerFrontendRevalidate({ type: 'post', slug })))
}

export async function getPosts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const posts = data ?? []
  if (!posts.length) return posts

  const { data: redirects, error: redirectsError } = await supabase
    .from('post_slug_redirects')
    .select('post_id, is_active')
    .in('post_id', posts.map((post) => post.id))

  if (redirectsError) {
    console.error('[post_slug_redirects] failed to load post counts:', redirectsError.message)
    return posts.map((post) => ({
      ...post,
      redirect_count: 0,
      active_redirect_count: 0,
    }))
  }

  const counts = new Map<string, { total: number; active: number }>()
  for (const redirect of redirects ?? []) {
    const current = counts.get(redirect.post_id) ?? { total: 0, active: 0 }
    current.total += 1
    if (redirect.is_active) {
      current.active += 1
    }
    counts.set(redirect.post_id, current)
  }

  return posts.map((post) => {
    const redirectCount = counts.get(post.id) ?? { total: 0, active: 0 }
    return {
      ...post,
      redirect_count: redirectCount.total,
      active_redirect_count: redirectCount.active,
    }
  })
}

export async function getPostSlugRoutingState(rawInput: z.infer<typeof postSlugRoutingInputSchema>) {
  const supabase = await createClient()
  return buildPostSlugRoutingState(supabase, rawInput)
}

export async function getPostInternalLinkSuggestions(
  rawInput: z.infer<typeof postInternalLinkAuditSchema>
) {
  const input = postInternalLinkAuditSchema.parse(rawInput)
  const supabase = await createClient()

  return findInternalLinkOpportunities(supabase, {
    sourceType: 'post',
    sourceId: input.postId,
    sourceTitle: input.title,
    sourceContent: input.content,
    sourceCategory: input.category,
    sourcePublishedAt: input.publishedAt,
  })
}

export async function createPost(formData: z.infer<typeof postSchema>) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Unauthorized' }

  const parsed = postSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Form artikel tidak valid.' }
  }

  const authorId = user.id
  const { id: postId, ...restFormData } = parsed.data

  try {
    await ensureSlugAvailable(supabase, restFormData.slug)
  } catch (error) {
    return { error: (error as Error).message }
  }

  const postData = {
    ...restFormData,
    ...(postId ? { id: postId } : {}),
    author_id: authorId,
    cover_image: restFormData.cover_image
      || (restFormData.thumbnail_image as MediaObject)?.url
      || (restFormData.banner_image as MediaObject)?.url
      || null,
    published_at: restFormData.status === 'published' ? new Date().toISOString() : null,
  }

  const { error } = await supabase.from('posts').insert(postData)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/cms/posts')
  revalidatePath('/cms/dashboard')
  await revalidatePostRoutes([restFormData.slug])

  if (restFormData.status === 'published') {
    notifyGoogleIndexing(`${SITE_URL}${getPostPath(restFormData.slug)}`, 'URL_UPDATED')
  }

  return { success: true }
}

export async function updatePost(id: string, formData: z.infer<typeof postSchema>) {
  const supabase = await createClient()

  const parsed = postSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Form artikel tidak valid.' }
  }

  const { data: existingPost, error: existingPostError } = await supabase
    .from('posts')
    .select('status, slug')
    .eq('id', id)
    .single()

  if (existingPostError || !existingPost) {
    return { error: existingPostError?.message || 'Artikel tidak ditemukan.' }
  }

  const { id: _ignoredId, ...restFormData } = parsed.data
  const slugChanged = existingPost.slug !== restFormData.slug

  try {
    await ensureSlugAvailable(supabase, restFormData.slug, {
      postId: id,
      currentSlug: existingPost.slug,
    })
  } catch (error) {
    return { error: (error as Error).message }
  }

  const postData = {
    ...restFormData,
    cover_image: restFormData.cover_image
      || (restFormData.thumbnail_image as MediaObject)?.url
      || (restFormData.banner_image as MediaObject)?.url
      || null,
    published_at: 
      restFormData.status === 'published' && existingPost?.status !== 'published'
        ? new Date().toISOString()
        : restFormData.status === 'draft' ? null : undefined,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('posts').update(postData).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  await syncPostSlugRedirects({
    supabase,
    postId: id,
    currentSlug: restFormData.slug,
    previousSlug: slugChanged ? existingPost.slug : null,
    isPublished: restFormData.status === 'published',
  })

  const rewrittenPostSlugs = slugChanged
    ? await rewriteInternalLinksForSlugChange({
        supabase,
        postId: id,
        oldSlug: existingPost.slug,
        newSlug: restFormData.slug,
      })
    : []

  revalidatePath('/cms/posts')
  revalidatePath(`/cms/posts/${id}/edit`)
  revalidatePath('/cms/dashboard')
  await revalidatePostRoutes([
    restFormData.slug,
    existingPost.slug,
    ...rewrittenPostSlugs,
  ])

  const oldUrl = `${SITE_URL}${getPostPath(existingPost.slug)}`
  const newUrl = `${SITE_URL}${getPostPath(restFormData.slug)}`

  if (existingPost.status === 'published' && restFormData.status !== 'published') {
    notifyGoogleIndexing(oldUrl, 'URL_DELETED')
  }

  if (restFormData.status === 'published') {
    notifyGoogleIndexing(newUrl, 'URL_UPDATED')
  }

  return { success: true }
}

export async function deletePost(id: string) {
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('slug')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/cms/posts')
  revalidatePath('/cms/dashboard')
  await revalidatePostRoutes(post?.slug ? [post.slug] : [])

  return { success: true }
}

export async function togglePostStatus(id: string, currentStatus: PostStatus) {
  const supabase = await createClient()
  const newStatus: PostStatus = currentStatus === 'published' ? 'draft' : 'published'

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('slug')
    .eq('id', id)
    .single()

  if (postError || !post) {
    return { error: postError?.message || 'Artikel tidak ditemukan.' }
  }

  const { error } = await supabase
    .from('posts')
    .update({ 
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  await syncPostSlugRedirects({
    supabase,
    postId: id,
    currentSlug: post.slug,
    isPublished: newStatus === 'published',
  })

  revalidatePath('/cms/posts')
  revalidatePath('/cms/dashboard')
  await revalidatePostRoutes([post.slug])

  if (newStatus === 'published') {
    notifyGoogleIndexing(`${SITE_URL}${getPostPath(post.slug)}`, 'URL_UPDATED')
  } else {
    notifyGoogleIndexing(`${SITE_URL}${getPostPath(post.slug)}`, 'URL_DELETED')
  }

  return { success: true }
}

/**
 * Toggle status dan notifikasi Google sesuai status baru.
 * Dipanggil dari list page — perlu slug jadi kita fetch dulu dari DB.
 */
export async function togglePostStatusAndIndex(id: string, currentStatus: PostStatus, _slug: string) {
  const result = await togglePostStatus(id, currentStatus)
  if (result?.error) return result
  return result
}
