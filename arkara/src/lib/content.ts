import { supabase } from './supabase'

export interface MediaObject {
  url: string
  alt_text?: string
  formats?: { sm?: string; md?: string; lg?: string; original?: string }
  aspect_ratio?: string
  dominant_color?: string
  blurhash?: string
}

export type EditorialFormat = 'legacy' | 'mobile_reader' | 'technical_guide'

export interface ContentFAQItem {
  question: string
  answer: string
}

export interface Post {
  id: string
  title: string
  slug: string
  description?: string
  content?: string
  quick_answer?: string | null
  key_takeaways?: string[]
  faq?: ContentFAQItem[]
  editorial_format?: EditorialFormat
  category?: string
  status: string
  cover_image?: string
  thumbnail_image?: MediaObject | null
  banner_image?: MediaObject | null
  published_at?: string
  meta_title?: string
  meta_desc?: string
  reading_time?: number
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

interface PanduanSlugRedirect {
  panduan_id: string
  source_slug: string
  source_path: string
  target_slug: string
  target_path: string
  is_active: boolean
}

export type ResolvedPanduanRoute =
  | { kind: 'panduan'; panduan: Panduan }
  | { kind: 'redirect'; location: string; targetSlug: string }
  | { kind: 'not_found' }

export interface Panduan {
  id: string
  title: string
  slug: string
  content?: string
  quick_answer?: string | null
  key_takeaways?: string[]
  faq?: ContentFAQItem[]
  editorial_format?: EditorialFormat
  category?: string
  bab_ref?: string
  qr_slug?: string
  status: string
  cover_image?: string
  thumbnail_image?: any
  banner_image?: any
  published_at?: string
}

const CONTENT_CACHE_TTL_MS = 5 * 60 * 1000
const POST_LISTING_SELECT = 'id,title,slug,description,category,status,cover_image,thumbnail_image,banner_image,published_at,meta_title,meta_desc'
const POST_SEARCH_SELECT = 'id,title,slug,description,category,status,cover_image,thumbnail_image,banner_image,published_at,quick_answer,key_takeaways,faq,content'
const PANDUAN_LISTING_SELECT = 'id,title,slug,category,bab_ref,qr_slug,status,cover_image,thumbnail_image,banner_image,published_at'
const PANDUAN_SEARCH_SELECT = 'id,title,slug,category,bab_ref,qr_slug,status,cover_image,thumbnail_image,banner_image,quick_answer,key_takeaways,faq,content'

type CacheEntry<T> = {
  expiresAt: number
  value: Promise<T>
}

const contentCache = new Map<string, CacheEntry<unknown>>()

function getCachedContent<T>(key: string, factory: () => Promise<T>, ttlMs = CONTENT_CACHE_TTL_MS): Promise<T> {
  const now = Date.now()
  const cached = contentCache.get(key) as CacheEntry<T> | undefined

  if (cached && cached.expiresAt > now) {
    return cached.value
  }

  const value = factory().catch((error) => {
    contentCache.delete(key)
    throw error
  })

  contentCache.set(key, {
    expiresAt: now + ttlMs,
    value,
  })

  return value
}

function estimateReadingTimeFromSummary(post: Pick<Post, 'title' | 'description' | 'meta_desc'>): number {
  const text = `${post.title ?? ''} ${post.description ?? ''} ${post.meta_desc ?? ''}`.trim()
  const words = text ? text.split(/\s+/).length : 0
  return Math.max(1, Math.ceil(words / 200))
}

export async function getPublishedPosts(options?: {
  category?: string
  limit?: number
  offset?: number
}): Promise<Post[]> {
  const cacheKey = `posts:list:${options?.category ?? 'all'}:${options?.limit ?? 'all'}:${options?.offset ?? 0}`

  return getCachedContent(cacheKey, async () => {
    let query = supabase
      .from('posts')
      .select(POST_LISTING_SELECT)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (options?.category) {
      query = query.eq('category', options.category)
    }
    if (options?.offset !== undefined) {
      query = query.range(options.offset, (options.offset + (options.limit ?? 10)) - 1)
    } else if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching posts:', error)
      return []
    }

    return (data ?? []).map((post) => ({
      ...post,
      reading_time: estimateReadingTimeFromSummary(post),
    }))
  })
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
  const cacheKey = `panduan:list:${options?.category ?? 'all'}`

  return getCachedContent(cacheKey, async () => {
    let query = supabase
      .from('panduan')
      .select(PANDUAN_LISTING_SELECT)
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
  })
}

async function fetchPublishedPanduanBySlug(slug: string): Promise<Panduan | null> {
  const { data, error } = await supabase
    .from('panduan')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('Error fetching panduan by slug:', error)
    return null
  }
  return data
}

async function fetchPublishedPanduanById(id: string): Promise<Panduan | null> {
  const { data, error } = await supabase
    .from('panduan')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('Error fetching panduan by id:', error)
    return null
  }

  return data
}

export async function resolvePublishedPanduanRoute(slug: string): Promise<ResolvedPanduanRoute> {
  const directPanduan = await fetchPublishedPanduanBySlug(slug)
  if (directPanduan) {
    return { kind: 'panduan', panduan: directPanduan }
  }

  const { data: redirect, error: redirectError } = await supabase
    .from('panduan_slug_redirects')
    .select('panduan_id, source_slug, source_path, target_slug, target_path, is_active')
    .eq('source_slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (redirectError || !redirect) {
    if (redirectError) {
      console.error('Error resolving panduan redirect:', redirectError)
    }
    return { kind: 'not_found' }
  }

  const redirectRow = redirect as PanduanSlugRedirect
  const targetPanduan = await fetchPublishedPanduanById(redirectRow.panduan_id)

  if (!targetPanduan || targetPanduan.id !== redirectRow.panduan_id) {
    return { kind: 'not_found' }
  }

  return {
    kind: 'redirect',
    location: `/panduan/${targetPanduan.slug}`,
    targetSlug: targetPanduan.slug,
  }
}

export async function getPanduanBySlug(slug: string): Promise<Panduan | null> {
  const resolved = await resolvePublishedPanduanRoute(slug)
  return resolved.kind === 'panduan' ? resolved.panduan : null
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

export type SearchContentType = 'post' | 'panduan'

export interface SearchResultItem {
  id: string
  type: SearchContentType
  title: string
  slug: string
  href: string
  excerpt: string
  category?: string
  published_at?: string
  image?: MediaObject | string | null
  score: number
}

function normalizeSearchText(value?: string | string[] | null): string {
  if (Array.isArray(value)) {
    return value.join(' ')
  }

  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function flattenFaq(faq?: ContentFAQItem[]): string {
  return (faq ?? [])
    .map((item) => `${item.question ?? ''} ${item.answer ?? ''}`)
    .join(' ')
}

function stripContentText(value?: string | null): string {
  return String(value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\[\](){}|\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function createExcerpt(primary?: string | null, fallback?: string | null, maxLength = 156): string {
  const text = stripContentText(primary || fallback || '')
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trim()}...`
}

function scoreSearchMatch(terms: string[], fullQuery: string, fields: {
  title?: string | null
  category?: string | null
  summary?: string | null
  body?: string | null
  extras?: string | null
}) {
  const normalizedFields = {
    title: normalizeSearchText(fields.title),
    category: normalizeSearchText(fields.category),
    summary: normalizeSearchText(fields.summary),
    body: normalizeSearchText(fields.body),
    extras: normalizeSearchText(fields.extras),
  }
  const haystack = Object.values(normalizedFields).join(' ')

  if (!terms.every((term) => haystack.includes(term))) {
    return 0
  }

  let score = normalizedFields.title.includes(fullQuery) ? 18 : 0
  for (const term of terms) {
    if (normalizedFields.title.includes(term)) score += 9
    if (normalizedFields.category.includes(term)) score += 5
    if (normalizedFields.summary.includes(term)) score += 5
    if (normalizedFields.extras.includes(term)) score += 4
    if (normalizedFields.body.includes(term)) score += 2
  }

  return score
}

async function getSearchablePosts(): Promise<Post[]> {
  return getCachedContent('posts:search-index', async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SEARCH_SELECT)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching searchable posts:', error)
      return []
    }

    return data ?? []
  })
}

async function getSearchablePanduan(): Promise<Panduan[]> {
  return getCachedContent('panduan:search-index', async () => {
    const { data, error } = await supabase
      .from('panduan')
      .select(PANDUAN_SEARCH_SELECT)
      .eq('status', 'published')
      .order('title', { ascending: true })

    if (error) {
      console.error('Error fetching searchable panduan:', error)
      return []
    }

    return data ?? []
  })
}

export async function searchPublishedContent(rawQuery: string, limit = 24): Promise<SearchResultItem[]> {
  const fullQuery = normalizeSearchText(rawQuery)
  const terms = fullQuery.split(' ').filter(Boolean)

  if (terms.length === 0) {
    return []
  }

  const [posts, panduan] = await Promise.all([
    getSearchablePosts(),
    getSearchablePanduan(),
  ])

  const postResults = posts
    .map((post) => {
      const summary = post.description || post.quick_answer || ''
      const extras = `${(post.key_takeaways ?? []).join(' ')} ${flattenFaq(post.faq)}`
      const score = scoreSearchMatch(terms, fullQuery, {
        title: post.title,
        category: post.category,
        summary,
        body: post.content,
        extras,
      })

      if (!score) return null

      return {
        id: post.id,
        type: 'post' as const,
        title: post.title,
        slug: post.slug,
        href: `/blog/${post.slug}`,
        excerpt: createExcerpt(summary, post.content),
        category: post.category || 'Artikel',
        published_at: post.published_at,
        image: post.thumbnail_image || post.banner_image || post.cover_image || null,
        score,
      }
    })
    .filter((result): result is SearchResultItem => Boolean(result))

  const panduanResults = panduan
    .map((guide) => {
      const summary = guide.quick_answer || ''
      const extras = `${guide.bab_ref ?? ''} ${(guide.key_takeaways ?? []).join(' ')} ${flattenFaq(guide.faq)}`
      const score = scoreSearchMatch(terms, fullQuery, {
        title: guide.title,
        category: guide.category,
        summary,
        body: guide.content,
        extras,
      })

      if (!score) return null

      return {
        id: guide.id,
        type: 'panduan' as const,
        title: guide.title,
        slug: guide.slug,
        href: `/panduan/${guide.slug}`,
        excerpt: createExcerpt(summary, guide.content),
        category: guide.category || 'Panduan',
        image: guide.thumbnail_image || guide.banner_image || guide.cover_image || null,
        score,
      }
    })
    .filter((result): result is SearchResultItem => Boolean(result))

  return [...postResults, ...panduanResults]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return String(b.published_at ?? '').localeCompare(String(a.published_at ?? ''))
    })
    .slice(0, limit)
}

export async function getSiteSettings(): Promise<Record<string, string>> {
  return getCachedContent('site-settings', async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
    
    if (error) {
      console.error('Error fetching site settings:', error)
      return {}
    }
    
    return Object.fromEntries((data ?? []).map(row => [row.key, row.value]))
  })
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
  return getCachedContent('hero-section', async () => {
    const { data, error } = await supabase
      .from('hero_section')
      .select('*')
      .single()
    
    if (error) return null
    return data
  })
}

export interface CtaSection {
  id: string
  headline: string
  body_text?: string
  button_label?: string
  button_href?: string
}

export async function getCtaSection(): Promise<CtaSection | null> {
  return getCachedContent('cta-section', async () => {
    const { data, error } = await supabase
      .from('cta_section')
      .select('*')
      .single()
    
    if (error) return null
    return data
  })
}

export interface FooterData {
  id: string
  tagline?: string
  copyright_text?: string
  social_links?: { platform: 'facebook' | 'youtube' | 'instagram' | 'x' | 'reddit' | 'tiktok' | 'twitter'; url: string }[]
}

export async function getFooterData(): Promise<FooterData | null> {
  return getCachedContent('footer-data', async () => {
    const { data, error } = await supabase
      .from('footer')
      .select('*')
      .single()
    
    if (error) return null
    return data
  })
}
