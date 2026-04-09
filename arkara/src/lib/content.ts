import { supabase } from './supabase'

export interface MediaObject {
  url: string
  alt_text?: string
  formats?: { sm?: string; md?: string; lg?: string; original?: string }
  aspect_ratio?: string
  dominant_color?: string
  blurhash?: string
}

export interface Post {
  id: string
  title: string
  slug: string
  description?: string
  content: string
  category?: string
  status: string
  cover_image?: string
  thumbnail_image?: MediaObject | null
  banner_image?: MediaObject | null
  published_at?: string
  meta_title?: string
  meta_desc?: string
}

interface PostSlugRedirect {
  post_id: string
  source_slug: string
  source_path: string
  target_slug: string
  target_path: string
  is_active: boolean
}

export type ResolvedPostRoute =
  | { kind: 'post'; post: Post }
  | { kind: 'redirect'; location: string; targetSlug: string }
  | { kind: 'not_found' }

export interface Panduan {
  id: string
  title: string
  slug: string
  content: string
  category?: string
  bab_ref?: string
  qr_slug?: string
  status: string
  cover_image?: string
  thumbnail_image?: any
  banner_image?: any
}

export async function getPublishedPosts(options?: {
  category?: string
  limit?: number
  offset?: number
}): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, (options.offset + (options.limit ?? 10)) - 1)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }
  return data ?? []
}

async function fetchPublishedPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('Error fetching post by slug:', error)
    return null
  }
  return data
}

async function fetchPublishedPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('Error fetching post by id:', error)
    return null
  }

  return data
}

export async function resolvePublishedPostRoute(slug: string): Promise<ResolvedPostRoute> {
  const directPost = await fetchPublishedPostBySlug(slug)
  if (directPost) {
    return { kind: 'post', post: directPost }
  }

  const { data: redirect, error: redirectError } = await supabase
    .from('post_slug_redirects')
    .select('post_id, source_slug, source_path, target_slug, target_path, is_active')
    .eq('source_slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (redirectError || !redirect) {
    if (redirectError) {
      console.error('Error resolving post redirect:', redirectError)
    }
    return { kind: 'not_found' }
  }

  const redirectRow = redirect as PostSlugRedirect
  const targetPost = await fetchPublishedPostById(redirectRow.post_id)

  if (!targetPost || targetPost.id !== redirectRow.post_id) {
    return { kind: 'not_found' }
  }

  return {
    kind: 'redirect',
    location: `/blog/${targetPost.slug}`,
    targetSlug: targetPost.slug,
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const resolved = await resolvePublishedPostRoute(slug)
  return resolved.kind === 'post' ? resolved.post : null
}

export async function getRecentPosts(count: number): Promise<Post[]> {
  return getPublishedPosts({ limit: count })
}

export async function getRelatedPosts(currentSlug: string, category: string | undefined, limit: number = 3): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .neq('slug', currentSlug)
    
  if (category) {
    query = query.eq('category', category)
  }
  
  query = query.order('published_at', { ascending: false }).limit(limit)

  const { data, error } = await query
  
  // If not enough related via category, fallback to recents
  if (!error && data && data.length < limit) {
    const needed = limit - data.length
    const existingSlugs = [currentSlug, ...data.map(p => p.slug)]
    
    const { data: fallback } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .not('slug', 'in', `(${existingSlugs.join(',')})`)
      .order('published_at', { ascending: false })
      .limit(needed)
      
    if (fallback) {
      return [...data, ...fallback]
    }
  }
  
  return data ?? []
}

export async function getPublishedPanduan(options?: { category?: string }): Promise<Panduan[]> {
  let query = supabase
    .from('panduan')
    .select('*')
    .eq('status', 'published')
    .order('title', { ascending: true })

  if (options?.category) {
    query = query.eq('category', options.category)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching panduan:', error)
    return []
  }
  return data ?? []
}

export async function getPanduanBySlug(slug: string): Promise<Panduan | null> {
  const { data, error } = await supabase
    .from('panduan')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) {
    console.error('Error fetching panduan by slug:', error)
    return null
  }
  return data
}

export async function getRelatedPanduan(currentSlug: string, category: string | undefined, limit: number = 3): Promise<Panduan[]> {
  let query = supabase
    .from('panduan')
    .select('*')
    .eq('status', 'published')
    .neq('slug', currentSlug)
    
  if (category) {
    query = query.eq('category', category)
  }
  
  query = query.order('title', { ascending: true }).limit(limit)

  const { data, error } = await query
  
  // If not enough related via category, fallback to others
  if (!error && data && data.length < limit) {
    const needed = limit - data.length
    const existingSlugs = [currentSlug, ...data.map(p => p.slug)]
    
    const { data: fallback } = await supabase
      .from('panduan')
      .select('*')
      .eq('status', 'published')
      .not('slug', 'in', `(${existingSlugs.join(',')})`)
      .order('title', { ascending: true })
      .limit(needed)
      
    if (fallback) {
      return [...data, ...fallback]
    }
  }
  
  return data ?? []
}

// ── SITE SETTINGS ──────────────────────────────────────────

export async function getSiteSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')
  
  if (error) {
    console.error('Error fetching site settings:', error)
    return {}
  }
  
  return Object.fromEntries((data ?? []).map(row => [row.key, row.value]))
}

export interface HeroSection {
  id: string
  headline: string
  subheadline?: string
  body_text?: string
  mascot_image?: any
  mascot_speech_text?: string
  mascot_tagline?: string
}

export async function getHeroSection(): Promise<HeroSection | null> {
  const { data, error } = await supabase
    .from('hero_section')
    .select('*')
    .single()
  
  if (error) return null
  return data
}

export interface CtaSection {
  id: string
  headline: string
  body_text?: string
  button_label?: string
  button_href?: string
}

export async function getCtaSection(): Promise<CtaSection | null> {
  const { data, error } = await supabase
    .from('cta_section')
    .select('*')
    .single()
  
  if (error) return null
  return data
}

export interface FooterData {
  id: string
  tagline?: string
  copyright_text?: string
  social_links?: { platform: 'facebook' | 'youtube' | 'instagram' | 'x' | 'reddit' | 'tiktok' | 'twitter'; url: string }[]
}

export async function getFooterData(): Promise<FooterData | null> {
  const { data, error } = await supabase
    .from('footer')
    .select('*')
    .single()
  
  if (error) return null
  return data
}
