import { createClient } from '@/lib/supabase/server'
import { getPanduanPath, getPostPath } from '@/lib/slugs'

export type SeoIndexingContentType = 'post' | 'panduan'
export type SeoIndexingStatus = 'pending' | 'submitted' | 'failed' | 'skipped'
export type SeoIndexingSource =
  | 'seo_repair_apply'
  | 'content_update'
  | 'content_publish'
  | 'gap_draft'
  | 'manual'
export type SeoIndexingType = 'URL_UPDATED' | 'URL_DELETED'

export interface SeoIndexingQueueItem {
  id: string
  url: string
  content_type: SeoIndexingContentType
  content_id: string | null
  title: string
  slug: string
  source: SeoIndexingSource
  status: SeoIndexingStatus
  indexing_type: SeoIndexingType
  error_message: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

interface EnqueueIndexingInput {
  contentType: SeoIndexingContentType
  contentId?: string | null
  title: string
  slug: string
  source: SeoIndexingSource
  indexingType?: SeoIndexingType
  userId?: string | null
}

export interface SeoIndexingQueueResult {
  success: boolean
  item?: SeoIndexingQueueItem
  error?: string
}

function getFrontendSiteUrl(): string {
  return (process.env.FRONTEND_SITE_URL || 'https://arkaraweb.com').replace(/\/+$/, '')
}

export function getContentPath(contentType: SeoIndexingContentType, slug: string): string {
  return contentType === 'post' ? getPostPath(slug) : getPanduanPath(slug)
}

export function getContentUrl(contentType: SeoIndexingContentType, slug: string): string {
  return `${getFrontendSiteUrl()}${getContentPath(contentType, slug)}`
}

export async function enqueueSeoIndexingUrl(input: EnqueueIndexingInput): Promise<SeoIndexingQueueResult> {
  const supabase = await createClient()
  const indexingType = input.indexingType ?? 'URL_UPDATED'
  const url = getContentUrl(input.contentType, input.slug)
  const now = new Date().toISOString()

  const existing = await supabase
    .from('seo_indexing_queue')
    .select('*')
    .eq('url', url)
    .eq('indexing_type', indexingType)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing.error) {
    return { success: false, error: existing.error.message }
  }

  if (existing.data) {
    const { data, error } = await supabase
      .from('seo_indexing_queue')
      .update({
        title: input.title,
        slug: input.slug,
        source: input.source,
        content_type: input.contentType,
        content_id: input.contentId ?? null,
        created_by: input.userId ?? null,
        updated_at: now,
      })
      .eq('id', existing.data.id)
      .select('*')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, item: data as SeoIndexingQueueItem }
  }

  const { data, error } = await supabase
    .from('seo_indexing_queue')
    .insert({
      url,
      content_type: input.contentType,
      content_id: input.contentId ?? null,
      title: input.title,
      slug: input.slug,
      source: input.source,
      status: 'pending',
      indexing_type: indexingType,
      created_by: input.userId ?? null,
    })
    .select('*')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, item: data as SeoIndexingQueueItem }
}

export async function getSeoIndexingQueue(limit = 30): Promise<{
  items: SeoIndexingQueueItem[]
  error?: string
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('seo_indexing_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { items: [], error: error.message }
  }

  return { items: (data ?? []) as SeoIndexingQueueItem[] }
}
