import { supabase } from './supabase'

export interface Post {
  id: string
  title: string
  slug: string
  description?: string
  content: string
  category: string
  status: string
  cover_image?: string
  thumbnail_image?: any
  banner_image?: any
  published_at?: string
  meta_title?: string
  meta_desc?: string
}

export interface Panduan {
  id: string
  title: string
  slug: string
  content: string
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

  if (options?.category) {
    query = query.eq('category', options.category)
  }
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

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) {
    console.error('Error fetching post by slug:', error)
    return null
  }
  return data
}

export async function getRecentPosts(count: number): Promise<Post[]> {
  return getPublishedPosts({ limit: count })
}

export async function getPublishedPanduan(): Promise<Panduan[]> {
  const { data, error } = await supabase
    .from('panduan')
    .select('*')
    .eq('status', 'published')
    .order('title', { ascending: true })

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
