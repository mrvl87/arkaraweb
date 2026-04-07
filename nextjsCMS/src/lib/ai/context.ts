/**
 * AI Context — Builds internal linking context from existing published content.
 *
 * Before generating drafts or outlines, this module fetches published articles
 * and panduan from Supabase, formats them as a compact sitemap, and provides
 * that context to the AI prompt so it can naturally link to related content.
 */

import { createClient } from '@/lib/supabase/server'

export interface ContentReference {
  title: string
  slug: string
  type: 'post' | 'panduan'
  category?: string
}

export interface InternalLinksQuery {
  title?: string
  keyword?: string
  angle?: string
  audience?: string
  notes?: string
  outline?: string
  topic?: string
}

const STOP_WORDS = new Set([
  'dan',
  'yang',
  'untuk',
  'dengan',
  'atau',
  'dari',
  'pada',
  'dalam',
  'agar',
  'karena',
  'tentang',
  'sebagai',
  'adalah',
  'jika',
  'serta',
  'para',
  'lebih',
  'akan',
  'juga',
  'the',
  'this',
  'that',
])

/**
 * Fetch all published content references (posts + panduan) for internal linking.
 * Returns a compact list of title + slug + type.
 */
export async function getContentReferences(): Promise<ContentReference[]> {
  const supabase = await createClient()
  const references: ContentReference[] = []

  // Fetch published posts
  const { data: posts } = await supabase
    .from('posts')
    .select('title, slug, category')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(200)

  if (posts) {
    for (const post of posts) {
      references.push({
        title: post.title,
        slug: post.slug,
        type: 'post',
        category: post.category,
      })
    }
  }

  // Fetch published panduan
  const { data: panduan } = await supabase
    .from('panduan')
    .select('title, slug')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(200)

  if (panduan) {
    for (const p of panduan) {
      references.push({
        title: p.title,
        slug: p.slug,
        type: 'panduan',
      })
    }
  }

  return references
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value?: string): string[] {
  if (!value) return []

  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
}

function scoreReference(ref: ContentReference, queryTokens: Set<string>): number {
  if (queryTokens.size === 0) return 0

  const titleTokens = new Set(tokenize(ref.title))
  const slugTokens = new Set(tokenize(ref.slug))
  const categoryTokens = new Set(tokenize(ref.category))

  let score = 0

  for (const token of queryTokens) {
    if (titleTokens.has(token)) score += 5
    if (slugTokens.has(token)) score += 3
    if (categoryTokens.has(token)) score += 2
  }

  return score
}

export function rankContentReferences(
  refs: ContentReference[],
  query: InternalLinksQuery,
  limit = 12
): ContentReference[] {
  const queryTokens = new Set(
    tokenize(
      [
        query.title,
        query.keyword,
        query.angle,
        query.audience,
        query.notes,
        query.outline,
        query.topic,
      ]
        .filter(Boolean)
        .join(' ')
    )
  )

  const ranked = refs
    .map((ref) => ({
      ref,
      score: scoreReference(ref, queryTokens),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.ref.title.localeCompare(b.ref.title))
    .slice(0, limit)
    .map(({ ref }) => ref)

  if (ranked.length > 0) {
    return ranked
  }

  return refs.slice(0, Math.min(limit, refs.length))
}

/**
 * Format content references into a text block that can be injected into prompts.
 * Format: "- [Title](/blog/slug) — kategori" for posts
 *         "- [Title](/panduan/slug)" for panduan
 */
export function formatReferencesForPrompt(refs: ContentReference[]): string {
  if (refs.length === 0) return ''

  const lines = refs.map((ref) => {
    const path = ref.type === 'post' ? `/blog/${ref.slug}` : `/panduan/${ref.slug}`
    const catLabel = ref.category ? ` [${ref.category}]` : ''
    return `- "${ref.title}" → ${path}${catLabel}`
  })

  return lines.join('\n')
}

/**
 * Get formatted internal links context ready for prompt injection.
 * Returns empty string if no published content exists.
 */
export async function getInternalLinksContext(
  query: InternalLinksQuery,
  options?: { limit?: number }
): Promise<string> {
  const refs = await getContentReferences()
  const ranked = rankContentReferences(refs, query, options?.limit ?? 12)
  return formatReferencesForPrompt(ranked)
}
