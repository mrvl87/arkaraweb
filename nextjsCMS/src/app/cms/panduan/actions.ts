"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { triggerFrontendRevalidate } from '@/lib/revalidate'
import { notifyGoogleIndexing } from '@/lib/google-indexing'
import { escapeRegex, getPanduanPath, getSlugSimilarityScore, normalizeSlug } from '@/lib/slugs'

const SITE_URL = process.env.FRONTEND_SITE_URL || 'https://arkaraweb.com'
const SLUG_SIMILARITY_THRESHOLD = 0.72

type PanduanStatus = 'draft' | 'published'

interface PanduanSummary {
  id: string
  title: string
  slug: string
  status: PanduanStatus
}

interface PanduanSlugRedirectRow {
  id: string
  panduan_id: string
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

export interface PanduanSlugConflict {
  type: 'panduan' | 'redirect'
  message: string
  path: string
  title?: string
  statusLabel: string
}

export interface SimilarPanduanSlugMatch {
  slug: string
  path: string
  score: number
  source: 'panduan' | 'redirect'
  statusLabel: string
  title?: string
}

export interface PanduanSlugRedirectPreview {
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

export interface PanduanSlugRoutingState {
  requestedSlug: string
  requestedPath: string | null
  currentSlug: string | null
  currentPath: string | null
  willCreateRedirect: boolean
  restoringHistoricalSlug: boolean
  exactConflict: PanduanSlugConflict | null
  similarMatches: SimilarPanduanSlugMatch[]
  redirects: PanduanSlugRedirectPreview[]
}

const slugSchema = z.string()
  .trim()
  .min(1, 'Slug wajib diisi')
  .transform((value) => normalizeSlug(value))
  .refine((value) => value.length > 0, 'Slug hanya boleh berisi huruf, angka, dan tanda hubung')

const panduanSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: slugSchema,
  content: z.string().optional().default(''),
  bab_ref: z.string().optional(),
  qr_slug: z.string().optional(),
  cover_image: z.string().optional(),
  meta_title: z.string().optional(),
  meta_desc: z.string().optional(),
  category: z.enum(['air', 'energi', 'pangan', 'medis', 'keamanan', 'komunitas']).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
})

const panduanSlugRoutingInputSchema = z.object({
  slug: z.string().optional().default(''),
  panduanId: z.string().uuid().optional(),
  currentSlug: z.string().optional(),
})

function toStatusLabel(status: PanduanStatus | 'active' | 'inactive'): string {
  switch (status) {
    case 'published':
      return 'panduan tayang'
    case 'draft':
      return 'panduan draft'
    case 'active':
      return 'redirect aktif'
    case 'inactive':
      return 'redirect nonaktif'
    default:
      return 'routing'
  }
}

function uniqueBySlug(items: SimilarPanduanSlugMatch[]): SimilarPanduanSlugMatch[] {
  const seen = new Set<string>()
  const result: SimilarPanduanSlugMatch[] = []

  for (const item of items) {
    if (seen.has(item.slug)) continue
    seen.add(item.slug)
    result.push(item)
  }

  return result
}

function replaceInternalPanduanLinks(content: string, oldSlug: string, newSlug: string): string {
  if (!content || oldSlug === newSlug) return content

  const escapedOldSlug = escapeRegex(oldSlug)
  const patterns: Array<[RegExp, string]> = [
    [new RegExp(`/panduan/${escapedOldSlug}(?=[/?#"'\\s<]|$)`, 'g'), `/panduan/${newSlug}`],
    [new RegExp(`${escapeRegex(SITE_URL)}/panduan/${escapedOldSlug}(?=[/?#"'\\s<]|$)`, 'g'), `${SITE_URL}/panduan/${newSlug}`],
    [new RegExp(`https://arkaraweb\\.com/panduan/${escapedOldSlug}(?=[/?#"'\\s<]|$)`, 'g'), `https://arkaraweb.com/panduan/${newSlug}`],
  ]

  return patterns.reduce(
    (updatedContent, [pattern, replacement]) => updatedContent.replace(pattern, replacement),
    content
  )
}

async function getRedirectsForPanduan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  panduanId?: string
): Promise<PanduanSlugRedirectRow[]> {
  if (!panduanId) return []

  const { data, error } = await supabase
    .from('panduan_slug_redirects')
    .select('id, panduan_id, source_slug, source_path, target_slug, target_path, redirect_type, is_active, created_at, updated_at, deactivated_at')
    .eq('panduan_id', panduanId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[panduan_slug_redirects] failed to load redirects:', error.message)
    return []
  }

  return (data ?? []) as PanduanSlugRedirectRow[]
}

async function buildPanduanSlugRoutingState(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rawInput: z.infer<typeof panduanSlugRoutingInputSchema>
): Promise<PanduanSlugRoutingState> {
  const input = panduanSlugRoutingInputSchema.parse(rawInput)
  const requestedSlug = normalizeSlug(input.slug)
  const currentSlug = input.currentSlug ? normalizeSlug(input.currentSlug) : null
  const requestedPath = requestedSlug ? getPanduanPath(requestedSlug) : null
  const currentPath = currentSlug ? getPanduanPath(currentSlug) : null
  const redirects = (await getRedirectsForPanduan(supabase, input.panduanId)).map((redirect) => ({
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

  const [{ data: exactPanduan }, { data: exactRedirect }, { data: panduanCandidates }, { data: redirectCandidates }] = await Promise.all([
    supabase
      .from('panduan')
      .select('id, title, slug, status')
      .eq('slug', requestedSlug)
      .maybeSingle(),
    supabase
      .from('panduan_slug_redirects')
      .select('id, panduan_id, source_slug, source_path, target_slug, target_path, redirect_type, is_active, created_at, updated_at, deactivated_at')
      .eq('source_slug', requestedSlug)
      .maybeSingle(),
    supabase
      .from('panduan')
      .select('id, title, slug, status')
      .order('updated_at', { ascending: false })
      .limit(250),
    supabase
      .from('panduan_slug_redirects')
      .select('panduan_id, source_slug, source_path, is_active')
      .order('updated_at', { ascending: false })
      .limit(250),
  ])

  const exactRedirectRow = exactRedirect as PanduanSlugRedirectRow | null
  const restoringHistoricalSlug = Boolean(
    exactRedirectRow &&
    exactRedirectRow.panduan_id === input.panduanId &&
    currentSlug &&
    requestedSlug !== currentSlug
  )

  let exactConflict: PanduanSlugConflict | null = null

  if (exactPanduan && exactPanduan.id !== input.panduanId) {
    exactConflict = {
      type: 'panduan',
      message: `Slug ini sudah dipakai oleh panduan "${exactPanduan.title}".`,
      path: getPanduanPath(exactPanduan.slug),
      title: exactPanduan.title,
      statusLabel: toStatusLabel(exactPanduan.status as PanduanStatus),
    }
  } else if (exactRedirectRow && exactRedirectRow.panduan_id !== input.panduanId) {
    exactConflict = {
      type: 'redirect',
      message: 'Slug ini sudah tercatat sebagai historical path milik panduan lain.',
      path: exactRedirectRow.source_path,
      statusLabel: toStatusLabel(exactRedirectRow.is_active ? 'active' : 'inactive'),
    }
  }

  const similarFromPanduan = ((panduanCandidates ?? []) as PanduanSummary[])
    .filter((candidate) => candidate.slug !== requestedSlug && candidate.id !== input.panduanId)
    .map((candidate) => ({
      slug: candidate.slug,
      path: getPanduanPath(candidate.slug),
      score: getSlugSimilarityScore(requestedSlug, candidate.slug),
      source: 'panduan' as const,
      statusLabel: toStatusLabel(candidate.status),
      title: candidate.title,
    }))
    .filter((candidate) => candidate.score >= SLUG_SIMILARITY_THRESHOLD)

  const similarFromRedirects = ((redirectCandidates ?? []) as Array<Pick<PanduanSlugRedirectRow, 'panduan_id' | 'source_slug' | 'source_path' | 'is_active'>>)
    .filter((candidate) => candidate.source_slug !== requestedSlug && candidate.panduan_id !== input.panduanId)
    .map((candidate) => ({
      slug: candidate.source_slug,
      path: candidate.source_path,
      score: getSlugSimilarityScore(requestedSlug, candidate.source_slug),
      source: 'redirect' as const,
      statusLabel: toStatusLabel(candidate.is_active ? 'active' : 'inactive'),
    }))
    .filter((candidate) => candidate.score >= SLUG_SIMILARITY_THRESHOLD)

  const similarMatches = uniqueBySlug(
    [...similarFromPanduan, ...similarFromRedirects]
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

async function ensurePanduanSlugAvailable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  options?: { panduanId?: string; currentSlug?: string }
) {
  const routingState = await buildPanduanSlugRoutingState(supabase, {
    slug,
    panduanId: options?.panduanId,
    currentSlug: options?.currentSlug,
  })

  if (routingState.exactConflict) {
    throw new Error(routingState.exactConflict.message)
  }

  return routingState
}

async function syncPanduanSlugRedirects(params: {
  supabase: Awaited<ReturnType<typeof createClient>>
  panduanId: string
  currentSlug: string
  previousSlug?: string | null
  isPublished: boolean
}) {
  const { supabase, panduanId, currentSlug, previousSlug, isPublished } = params
  const currentPath = getPanduanPath(currentSlug)
  const now = new Date().toISOString()
  const existingRedirects = await getRedirectsForPanduan(supabase, panduanId)

  const { error: updateExistingError } = await supabase
    .from('panduan_slug_redirects')
    .update({
      target_slug: currentSlug,
      target_path: currentPath,
      is_active: isPublished,
      updated_at: now,
      deactivated_at: isPublished ? null : now,
    })
    .eq('panduan_id', panduanId)
    .neq('source_slug', currentSlug)

  if (updateExistingError) {
    throw new Error(updateExistingError.message)
  }

  const currentSlugRedirect = existingRedirects.find((redirect) => redirect.source_slug === currentSlug)
  if (currentSlugRedirect) {
    const { error: deactivateCurrentError } = await supabase
      .from('panduan_slug_redirects')
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
        .from('panduan_slug_redirects')
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
        .from('panduan_slug_redirects')
        .insert({
          panduan_id: panduanId,
          source_slug: previousSlug,
          source_path: getPanduanPath(previousSlug),
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

async function rewritePanduanLinksForSlugChange(params: {
  supabase: Awaited<ReturnType<typeof createClient>>
  panduanId: string
  oldSlug: string
  newSlug: string
}) {
  const { supabase, panduanId, oldSlug, newSlug } = params
  if (oldSlug === newSlug) return { updatedPanduanSlugs: [] as string[], updatedPostSlugs: [] as string[] }

  const [panduanRows, postRows] = await Promise.all([
    supabase.from('panduan').select('id, slug, content').neq('id', panduanId),
    supabase.from('posts').select('id, slug, content'),
  ])

  const now = new Date().toISOString()
  const updatedPanduanSlugs: string[] = []
  const updatedPostSlugs: string[] = []

  for (const candidate of panduanRows.data ?? []) {
    const currentContent = typeof candidate.content === 'string' ? candidate.content : ''
    const nextContent = replaceInternalPanduanLinks(currentContent, oldSlug, newSlug)

    if (nextContent === currentContent) continue

    const { error } = await supabase
      .from('panduan')
      .update({ content: nextContent, updated_at: now })
      .eq('id', candidate.id)

    if (!error && candidate.slug) {
      updatedPanduanSlugs.push(candidate.slug)
    }
  }

  for (const candidate of postRows.data ?? []) {
    const currentContent = typeof candidate.content === 'string' ? candidate.content : ''
    const nextContent = replaceInternalPanduanLinks(currentContent, oldSlug, newSlug)

    if (nextContent === currentContent) continue

    const { error } = await supabase
      .from('posts')
      .update({ content: nextContent, updated_at: now })
      .eq('id', candidate.id)

    if (!error && candidate.slug) {
      updatedPostSlugs.push(candidate.slug)
    }
  }

  return { updatedPanduanSlugs, updatedPostSlugs }
}

async function revalidatePanduanRoutes(slugs: string[]) {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))]
  await Promise.all(uniqueSlugs.map((slug) => triggerFrontendRevalidate({ type: 'panduan', slug })))
}

export async function getPanduan() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('panduan')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const panduan = data ?? []
  if (!panduan.length) return panduan

  const { data: redirects, error: redirectsError } = await supabase
    .from('panduan_slug_redirects')
    .select('panduan_id, is_active')
    .in('panduan_id', panduan.map((item) => item.id))

  if (redirectsError) {
    console.error('[panduan_slug_redirects] failed to load panduan counts:', redirectsError.message)
    return panduan.map((item) => ({
      ...item,
      redirect_count: 0,
      active_redirect_count: 0,
    }))
  }

  const counts = new Map<string, { total: number; active: number }>()
  for (const redirect of redirects ?? []) {
    const current = counts.get(redirect.panduan_id) ?? { total: 0, active: 0 }
    current.total += 1
    if (redirect.is_active) current.active += 1
    counts.set(redirect.panduan_id, current)
  }

  return panduan.map((item) => {
    const redirectCount = counts.get(item.id) ?? { total: 0, active: 0 }
    return {
      ...item,
      redirect_count: redirectCount.total,
      active_redirect_count: redirectCount.active,
    }
  })
}

export async function getPanduanSlugRoutingState(rawInput: z.infer<typeof panduanSlugRoutingInputSchema>) {
  const supabase = await createClient()
  return buildPanduanSlugRoutingState(supabase, rawInput)
}

export async function createPanduan(formData: z.infer<typeof panduanSchema>) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  const parsed = panduanSchema.safeParse(formData)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Form panduan tidak valid.')
  }

  const authorId = user.id
  const { id: panduanId, ...restFormData } = parsed.data

  await ensurePanduanSlugAvailable(supabase, restFormData.slug)

  const data = {
    ...restFormData,
    ...(panduanId ? { id: panduanId } : {}),
    author_id: authorId,
    published_at: restFormData.status === 'published' ? new Date().toISOString() : null,
  }

  const { error } = await supabase.from('panduan').insert(data)
  if (error) throw new Error(error.message)

  revalidatePath('/cms/panduan')
  revalidatePath('/cms/dashboard')
  await revalidatePanduanRoutes([restFormData.slug])

  if (restFormData.status === 'published') {
    notifyGoogleIndexing(`${SITE_URL}${getPanduanPath(restFormData.slug)}`, 'URL_UPDATED')
  }
}

export async function updatePanduan(id: string, formData: z.infer<typeof panduanSchema>) {
  const supabase = await createClient()

  const parsed = panduanSchema.safeParse(formData)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Form panduan tidak valid.')
  }

  const { data: existing, error: existingError } = await supabase
    .from('panduan')
    .select('status, slug')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    throw new Error(existingError?.message || 'Panduan tidak ditemukan.')
  }

  const { id: _ignoredId, ...restFormData } = parsed.data
  const slugChanged = existing.slug !== restFormData.slug

  await ensurePanduanSlugAvailable(supabase, restFormData.slug, {
    panduanId: id,
    currentSlug: existing.slug,
  })

  const data = {
    ...restFormData,
    published_at:
      restFormData.status === 'published' && existing.status !== 'published'
        ? new Date().toISOString()
        : restFormData.status === 'draft' ? null : undefined,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('panduan').update(data).eq('id', id)
  if (error) throw new Error(error.message)

  await syncPanduanSlugRedirects({
    supabase,
    panduanId: id,
    currentSlug: restFormData.slug,
    previousSlug: slugChanged ? existing.slug : null,
    isPublished: restFormData.status === 'published',
  })

  const rewritten = slugChanged
    ? await rewritePanduanLinksForSlugChange({
        supabase,
        panduanId: id,
        oldSlug: existing.slug,
        newSlug: restFormData.slug,
      })
    : { updatedPanduanSlugs: [] as string[], updatedPostSlugs: [] as string[] }

  revalidatePath('/cms/panduan')
  revalidatePath(`/cms/panduan/${id}/edit`)
  revalidatePath('/cms/dashboard')
  await Promise.all([
    revalidatePanduanRoutes([restFormData.slug, existing.slug, ...rewritten.updatedPanduanSlugs]),
    Promise.all(
      [...new Set(rewritten.updatedPostSlugs)].map((slug) =>
        triggerFrontendRevalidate({ type: 'post', slug })
      )
    ),
  ])

  const oldUrl = `${SITE_URL}${getPanduanPath(existing.slug)}`
  const newUrl = `${SITE_URL}${getPanduanPath(restFormData.slug)}`

  if (existing.status === 'published' && restFormData.status !== 'published') {
    notifyGoogleIndexing(oldUrl, 'URL_DELETED')
  }

  if (restFormData.status === 'published') {
    notifyGoogleIndexing(newUrl, 'URL_UPDATED')
  }
}

export async function deletePanduan(id: string) {
  const supabase = await createClient()

  const { data: panduan } = await supabase
    .from('panduan')
    .select('slug')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('panduan').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/cms/panduan')
  revalidatePath('/cms/dashboard')
  await revalidatePanduanRoutes(panduan?.slug ? [panduan.slug] : [])
}

export async function togglePanduanStatus(id: string, currentStatus: PanduanStatus) {
  const supabase = await createClient()
  const newStatus: PanduanStatus = currentStatus === 'published' ? 'draft' : 'published'

  const { data: panduan, error: panduanError } = await supabase
    .from('panduan')
    .select('slug')
    .eq('id', id)
    .single()

  if (panduanError || !panduan) {
    throw new Error(panduanError?.message || 'Panduan tidak ditemukan.')
  }

  const { error } = await supabase
    .from('panduan')
    .update({
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await syncPanduanSlugRedirects({
    supabase,
    panduanId: id,
    currentSlug: panduan.slug,
    isPublished: newStatus === 'published',
  })

  revalidatePath('/cms/panduan')
  revalidatePath('/cms/dashboard')
  await revalidatePanduanRoutes([panduan.slug])

  if (newStatus === 'published') {
    notifyGoogleIndexing(`${SITE_URL}${getPanduanPath(panduan.slug)}`, 'URL_UPDATED')
  } else {
    notifyGoogleIndexing(`${SITE_URL}${getPanduanPath(panduan.slug)}`, 'URL_DELETED')
  }
}

export async function togglePanduanStatusAndIndex(id: string, currentStatus: PanduanStatus, _slug: string) {
  await togglePanduanStatus(id, currentStatus)
}
