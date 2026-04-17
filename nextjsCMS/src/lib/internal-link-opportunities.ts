import type { SupabaseClient } from '@supabase/supabase-js'

export type InternalLinkContentType = 'post' | 'panduan'

export interface LinkOpportunityCandidate {
  id: string
  title: string
  slug: string
  type: InternalLinkContentType
  path: string
  category?: string | null
  published_at?: string | null
  created_at?: string | null
}

export interface InternalLinkOpportunity {
  id: string
  title: string
  slug: string
  type: InternalLinkContentType
  path: string
  category?: string | null
  publishedAt: string | null
  matchedTerms: string[]
  score: number
  suggestedAnchor: string
}

export interface InternalLinkAuditResult {
  sourcePublishedAt: string | null
  existingLinkCount: number
  scannedCount: number
  newerCandidateCount: number
  suggestions: InternalLinkOpportunity[]
}

export interface InternalLinkAuditInput {
  sourceType: InternalLinkContentType
  sourceId?: string
  sourceTitle: string
  sourceContent?: string
  sourceCategory?: string
  sourcePublishedAt?: string | null
  limit?: number
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
  'oleh',
  'bagi',
  'saat',
  'cara',
  'panduan',
  'artikel',
  'the',
  'this',
  'that',
])

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

function toPath(type: InternalLinkContentType, slug: string): string {
  return type === 'post' ? `/blog/${slug}` : `/panduan/${slug}`
}

function extractInternalPaths(content?: string): Set<string> {
  const paths = new Set<string>()
  if (!content) return paths

  const patterns = [
    /(\/(?:blog|panduan)\/[a-z0-9-]+)(?=[/?#)"'\s<]|$)/gi,
    /https?:\/\/(?:www\.)?arkaraweb\.com(\/(?:blog|panduan)\/[a-z0-9-]+)(?=[/?#)"'\s<]|$)/gi,
  ]

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      if (match[1]) {
        paths.add(match[1].toLowerCase())
      }
    }
  }

  return paths
}

function getSourceDate(input: InternalLinkAuditInput): string | null {
  return input.sourcePublishedAt ?? null
}

function getCandidateDate(candidate: LinkOpportunityCandidate): string | null {
  return candidate.published_at ?? candidate.created_at ?? null
}

function isNewerCandidate(candidate: LinkOpportunityCandidate, sourceDate: string | null): boolean {
  if (!sourceDate) return true

  const candidateDate = getCandidateDate(candidate)
  if (!candidateDate) return false

  return new Date(candidateDate).getTime() > new Date(sourceDate).getTime()
}

function buildQueryTokens(input: InternalLinkAuditInput): string[] {
  const contentWindow = input.sourceContent?.slice(0, 5000) ?? ''
  const tokens = tokenize([input.sourceTitle, input.sourceCategory, contentWindow].filter(Boolean).join(' '))

  return [...new Set(tokens)].slice(0, 80)
}

function scoreCandidate(
  candidate: LinkOpportunityCandidate,
  queryTokens: string[]
): { score: number; matchedTerms: string[] } {
  if (queryTokens.length === 0) {
    return { score: 0, matchedTerms: [] }
  }

  const titleTokens = new Set(tokenize(candidate.title))
  const slugTokens = new Set(tokenize(candidate.slug))
  const categoryTokens = new Set(tokenize(candidate.category ?? undefined))
  const matchedTerms: string[] = []
  let score = 0

  for (const token of queryTokens) {
    let matched = false

    if (titleTokens.has(token)) {
      score += 6
      matched = true
    }

    if (slugTokens.has(token)) {
      score += 4
      matched = true
    }

    if (categoryTokens.has(token)) {
      score += 2
      matched = true
    }

    if (matched) {
      matchedTerms.push(token)
    }
  }

  return {
    score,
    matchedTerms: matchedTerms.slice(0, 6),
  }
}

async function getPublishedCandidates(
  supabase: SupabaseClient
): Promise<LinkOpportunityCandidate[]> {
  const [postsResult, panduanResult] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, slug, category, published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(300),
    supabase
      .from('panduan')
      .select('id, title, slug, category, published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(300),
  ])

  if (postsResult.error) {
    console.error('[internal-links] failed to load published posts', postsResult.error)
    throw new Error(`Gagal memuat artikel published untuk internal link: ${postsResult.error.message}`)
  }

  if (panduanResult.error) {
    console.error('[internal-links] failed to load published panduan', panduanResult.error)
    throw new Error(`Gagal memuat panduan published untuk internal link: ${panduanResult.error.message}`)
  }

  const candidates: LinkOpportunityCandidate[] = []

  for (const row of postsResult.data ?? []) {
    candidates.push({
      id: row.id,
      title: row.title,
      slug: row.slug,
      type: 'post',
      path: toPath('post', row.slug),
      category: row.category,
      published_at: row.published_at,
      created_at: row.created_at,
    })
  }

  for (const row of panduanResult.data ?? []) {
    candidates.push({
      id: row.id,
      title: row.title,
      slug: row.slug,
      type: 'panduan',
      path: toPath('panduan', row.slug),
      category: (row as { category?: string | null }).category ?? null,
      published_at: row.published_at,
      created_at: row.created_at,
    })
  }

  return candidates
}

export async function findInternalLinkOpportunities(
  supabase: SupabaseClient,
  input: InternalLinkAuditInput
): Promise<InternalLinkAuditResult> {
  const sourceDate = getSourceDate(input)
  const queryTokens = buildQueryTokens(input)
  const existingPaths = extractInternalPaths(input.sourceContent)
  const candidates = await getPublishedCandidates(supabase)

  const filtered = candidates.filter((candidate) => {
    if (candidate.type === input.sourceType && candidate.id === input.sourceId) {
      return false
    }

    if (existingPaths.has(candidate.path.toLowerCase())) {
      return false
    }

    return isNewerCandidate(candidate, sourceDate)
  })

  const ranked = filtered
    .map((candidate) => {
      const { score, matchedTerms } = scoreCandidate(candidate, queryTokens)
      return {
        candidate,
        score,
        matchedTerms,
      }
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      const rightDate = getCandidateDate(right.candidate) ?? ''
      const leftDate = getCandidateDate(left.candidate) ?? ''

      return (
        right.score - left.score ||
        rightDate.localeCompare(leftDate) ||
        left.candidate.title.localeCompare(right.candidate.title)
      )
    })
    .slice(0, input.limit ?? 8)
    .map<InternalLinkOpportunity>(({ candidate, score, matchedTerms }) => ({
      id: candidate.id,
      title: candidate.title,
      slug: candidate.slug,
      type: candidate.type,
      path: candidate.path,
      category: candidate.category ?? null,
      publishedAt: getCandidateDate(candidate),
      matchedTerms,
      score,
      suggestedAnchor: candidate.title,
    }))

  return {
    sourcePublishedAt: sourceDate,
    existingLinkCount: existingPaths.size,
    scannedCount: candidates.length,
    newerCandidateCount: filtered.length,
    suggestions: ranked,
  }
}
