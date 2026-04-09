import type { APIRoute } from 'astro'
import { supabase } from '../lib/supabase'

const SITE_URL = 'https://arkaraweb.com'

interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?: 'daily' | 'weekly' | 'monthly'
  priority?: string
}

function toAbsoluteUrl(path: string): string {
  return new URL(path, SITE_URL).href
}

function toLastmod(value?: string | null): string | undefined {
  if (!value) return undefined

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderUrl(entry: SitemapEntry): string {
  const tags = [`<loc>${escapeXml(entry.loc)}</loc>`]

  if (entry.lastmod) {
    tags.push(`<lastmod>${escapeXml(entry.lastmod)}</lastmod>`)
  }

  if (entry.changefreq) {
    tags.push(`<changefreq>${entry.changefreq}</changefreq>`)
  }

  if (entry.priority) {
    tags.push(`<priority>${entry.priority}</priority>`)
  }

  return `<url>${tags.join('')}</url>`
}

export const GET: APIRoute = async () => {
  const [postsResult, panduanResult] = await Promise.all([
    supabase
      .from('posts')
      .select('slug, updated_at, published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase
      .from('panduan')
      .select('slug, updated_at, published_at, created_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false }),
  ])

  if (postsResult.error || panduanResult.error) {
    const message = postsResult.error?.message || panduanResult.error?.message || 'Failed to build sitemap'
    return new Response(message, { status: 500 })
  }

  const entries: SitemapEntry[] = [
    {
      loc: toAbsoluteUrl('/'),
      changefreq: 'daily',
      priority: '1.0',
    },
    {
      loc: toAbsoluteUrl('/blog'),
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      loc: toAbsoluteUrl('/panduan'),
      changefreq: 'weekly',
      priority: '0.9',
    },
    ...(postsResult.data ?? []).map((post) => ({
      loc: toAbsoluteUrl(`/blog/${post.slug}`),
      lastmod: toLastmod(post.updated_at || post.published_at || post.created_at),
      changefreq: 'weekly' as const,
      priority: '0.8',
    })),
    ...(panduanResult.data ?? []).map((guide) => ({
      loc: toAbsoluteUrl(`/panduan/${guide.slug}`),
      lastmod: toLastmod(guide.updated_at || guide.published_at || guide.created_at),
      changefreq: 'monthly' as const,
      priority: '0.8',
    })),
  ]

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(renderUrl),
    '</urlset>',
  ].join('')

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=900',
    },
  })
}
