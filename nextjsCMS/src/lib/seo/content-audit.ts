import { createClient } from '@/lib/supabase/server'
import { getSerperConfig, getSerperKeywordOpportunity, type SerperKeywordOpportunity } from './serper'
import { getSeoKeywordSignals, type SeoKeywordSignal } from './keyword-signals'

export const SEO_CLUSTERS = [
  {
    slug: 'air',
    label: 'Air',
    seedKeywords: [
      'cadangan air bersih keluarga',
      'filter air darurat rumah',
      'cara menyimpan air minum',
    ],
  },
  {
    slug: 'energi',
    label: 'Energi',
    seedKeywords: [
      'listrik mati 3 hari',
      'panel surya rumahan mulai dari mana',
      'cara menyimpan bensin untuk genset',
    ],
  },
  {
    slug: 'pangan',
    label: 'Pangan',
    seedKeywords: [
      'stok makanan 30 hari',
      'cadangan pangan keluarga',
      'makanan darurat tahan lama',
    ],
  },
  {
    slug: 'medis',
    label: 'Medis',
    seedKeywords: [
      'kotak p3k keluarga',
      'obat darurat di rumah',
      'persiapan medis keluarga',
    ],
  },
  {
    slug: 'keamanan',
    label: 'Keamanan',
    seedKeywords: [
      'keamanan rumah saat krisis',
      'rencana evakuasi keluarga',
      'komunikasi darurat keluarga',
    ],
  },
  {
    slug: 'komunitas',
    label: 'Komunitas',
    seedKeywords: [
      'logistik warga saat bencana',
      'posko keluarga darurat',
      'koordinasi tetangga saat krisis',
    ],
  },
] as const

export type SeoClusterSlug = (typeof SEO_CLUSTERS)[number]['slug']
export type SeoContentType = 'post' | 'panduan'
export type SeoSeverity = 'critical' | 'warning' | 'info'

interface RawContentRow {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  content?: string | null
  description?: string | null
  quick_answer?: string | null
  key_takeaways?: string[] | null
  faq?: Array<{ question?: string; answer?: string }> | null
  editorial_format?: 'legacy' | 'mobile_reader' | 'technical_guide' | null
  category?: string | null
  cover_image?: string | null
  thumbnail_image?: unknown
  banner_image?: unknown
  meta_title?: string | null
  meta_desc?: string | null
  published_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface SeoIssue {
  code:
    | 'missing_meta'
    | 'missing_quick_answer'
    | 'weak_faq'
    | 'thin_content'
    | 'missing_image'
    | 'weak_internal_links'
    | 'draft_content'
  label: string
  severity: SeoSeverity
}

export interface SeoAuditItem {
  id: string
  type: SeoContentType
  title: string
  slug: string
  href: string
  editHref: string
  status: 'draft' | 'published'
  category: SeoClusterSlug | 'unknown'
  score: number
  wordCount: number
  internalLinkCount: number
  faqCount: number
  hasQuickAnswer: boolean
  hasMeta: boolean
  hasImage: boolean
  articleSchemaReady: boolean
  faqSchemaReady: boolean
  howToSchemaReady: boolean
  issues: SeoIssue[]
  updatedAt: string | null
}

export interface SeoClusterStatus {
  slug: SeoClusterSlug
  label: string
  publishedCount: number
  draftCount: number
  averageScore: number
  weakContentCount: number
  seedKeywords: string[]
}

export interface VisibilityPromptSet {
  cluster: SeoClusterSlug
  prompt: string
}

export interface SeoCockpitData {
  summary: {
    totalContent: number
    publishedContent: number
    draftContent: number
    averageScore: number
    quickAnswerCoverage: number
    faqCoverage: number
    schemaReadyCount: number
    criticalIssueCount: number
    keywordGapCount: number
  }
  clusters: SeoClusterStatus[]
  topFixes: SeoAuditItem[]
  contentItems: SeoAuditItem[]
  visibilityPrompts: VisibilityPromptSet[]
  keywordOpportunities: SerperKeywordOpportunity[]
  keywordSignals: SeoKeywordSignal[]
  serper: {
    configured: boolean
    gl: string
    hl: string
    cacheHours: number
  }
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

const CLUSTER_SLUGS = new Set<string>(SEO_CLUSTERS.map((cluster) => cluster.slug))
const SEO_OPPORTUNITY_TIMEOUT_MS = 6000

const VISIBILITY_PROMPTS: VisibilityPromptSet[] = [
  { cluster: 'energi', prompt: 'Apa yang harus disiapkan jika listrik mati 3 hari?' },
  { cluster: 'energi', prompt: 'Panel surya untuk rumah tangga biasa, mulai dari mana?' },
  { cluster: 'pangan', prompt: 'Cara membangun cadangan pangan keluarga Indonesia' },
  { cluster: 'pangan', prompt: 'Stok makanan untuk 30 hari sebaiknya berisi apa?' },
  { cluster: 'air', prompt: 'Bagaimana cara menyimpan air bersih di rumah?' },
  { cluster: 'air', prompt: 'Filter air darurat yang aman untuk keluarga' },
  { cluster: 'keamanan', prompt: 'Apa isi rencana evakuasi keluarga sederhana?' },
  { cluster: 'medis', prompt: 'Apa saja isi kotak P3K rumah tangga?' },
]

const CATEGORY_HINTS: Record<SeoClusterSlug, string[]> = {
  air: ['air', 'filter', 'filtrasi', 'sumur', 'hujan', 'minum'],
  energi: ['energi', 'listrik', 'surya', 'panel', 'genset', 'bensin', 'daya', 'baterai'],
  pangan: ['pangan', 'makanan', 'beras', 'stok', 'dapur', 'kebun', 'benih'],
  medis: ['medis', 'p3k', 'obat', 'kesehatan', 'luka', 'darah', 'klinik'],
  keamanan: ['aman', 'keamanan', 'evakuasi', 'komunikasi', 'risiko', 'rumah'],
  komunitas: ['komunitas', 'warga', 'tetangga', 'posko', 'logistik', 'koordinasi'],
}

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(value?: string | null): number {
  const normalized = normalizeText(value)
  return normalized ? normalized.split(' ').length : 0
}

function countHeadings(value?: string | null): number {
  const source = value ?? ''
  const htmlCount = source.match(/<h2\b/gi)?.length ?? 0
  const markdownCount = source.match(/^##\s+/gm)?.length ?? 0
  return htmlCount + markdownCount
}

function countInternalLinks(value?: string | null): number {
  const source = value ?? ''
  const matches = source.match(/\/(?:blog|panduan)\/[a-z0-9-]+/gi)
  return new Set(matches ?? []).size
}

function hasMediaValue(value: unknown): boolean {
  if (!value) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value !== 'object') return false

  const media = value as { url?: unknown; formats?: Record<string, unknown> }
  return Boolean(
    (typeof media.url === 'string' && media.url.trim().length > 0) ||
    (media.formats && Object.values(media.formats).some((entry) => typeof entry === 'string' && entry.trim().length > 0))
  )
}

function normalizeCategory(row: RawContentRow): SeoClusterSlug | 'unknown' {
  if (row.category && CLUSTER_SLUGS.has(row.category)) {
    return row.category as SeoClusterSlug
  }

  const haystack = normalizeText([row.title, row.slug, row.description, row.content?.slice(0, 1200)].filter(Boolean).join(' '))

  for (const cluster of SEO_CLUSTERS) {
    if (CATEGORY_HINTS[cluster.slug].some((term) => haystack.includes(term))) {
      return cluster.slug
    }
  }

  return 'unknown'
}

function toContentHref(type: SeoContentType, slug: string): string {
  return type === 'post' ? `/blog/${slug}` : `/panduan/${slug}`
}

function toEditHref(type: SeoContentType, id: string): string {
  return type === 'post' ? `/cms/posts/${id}/edit` : `/cms/panduan/${id}/edit`
}

function addIssue(issues: SeoIssue[], issue: SeoIssue): number {
  issues.push(issue)

  if (issue.severity === 'critical') return 18
  if (issue.severity === 'warning') return 11
  return 6
}

function auditRow(type: SeoContentType, row: RawContentRow): SeoAuditItem {
  const issues: SeoIssue[] = []
  let penalty = 0
  const wordCount = countWords(row.content)
  const faqCount = Array.isArray(row.faq)
    ? row.faq.filter((item) => item?.question?.trim() && item?.answer?.trim()).length
    : 0
  const hasQuickAnswer = Boolean(row.quick_answer?.trim())
  const hasMeta = Boolean(row.meta_title?.trim() && row.meta_desc?.trim())
  const hasImage = Boolean(
    row.cover_image?.trim() ||
    hasMediaValue(row.thumbnail_image) ||
    hasMediaValue(row.banner_image)
  )
  const internalLinkCount = countInternalLinks(row.content)
  const thinLimit = type === 'post' ? 650 : 420
  const headingCount = countHeadings(row.content)

  if (!hasMeta) {
    penalty += addIssue(issues, {
      code: 'missing_meta',
      label: 'Meta title atau meta description belum lengkap',
      severity: 'warning',
    })
  }

  if (!hasQuickAnswer) {
    penalty += addIssue(issues, {
      code: 'missing_quick_answer',
      label: 'Jawaban singkat belum tersedia',
      severity: 'critical',
    })
  }

  if (faqCount < 3) {
    penalty += addIssue(issues, {
      code: 'weak_faq',
      label: 'FAQ belum cukup untuk FAQPage schema',
      severity: 'warning',
    })
  }

  if (wordCount < thinLimit) {
    penalty += addIssue(issues, {
      code: 'thin_content',
      label: `Konten tipis: ${wordCount} kata`,
      severity: 'critical',
    })
  }

  if (!hasImage) {
    penalty += addIssue(issues, {
      code: 'missing_image',
      label: 'Gambar utama belum tersedia',
      severity: 'warning',
    })
  }

  if (internalLinkCount < 2) {
    penalty += addIssue(issues, {
      code: 'weak_internal_links',
      label: 'Internal link masih lemah',
      severity: 'info',
    })
  }

  if (row.status === 'draft') {
    penalty += addIssue(issues, {
      code: 'draft_content',
      label: 'Masih draft, belum ikut distribusi SEO publik',
      severity: 'info',
    })
  }

  return {
    id: row.id,
    type,
    title: row.title,
    slug: row.slug,
    href: toContentHref(type, row.slug),
    editHref: toEditHref(type, row.id),
    status: row.status,
    category: normalizeCategory(row),
    score: Math.max(0, 100 - penalty),
    wordCount,
    internalLinkCount,
    faqCount,
    hasQuickAnswer,
    hasMeta,
    hasImage,
    articleSchemaReady: row.status === 'published',
    faqSchemaReady: faqCount >= 3,
    howToSchemaReady: type === 'panduan' && row.editorial_format === 'technical_guide' && headingCount >= 2,
    issues,
    updatedAt: row.updated_at ?? row.published_at ?? row.created_at ?? null,
  }
}

async function loadPosts(supabase: SupabaseServerClient): Promise<RawContentRow[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('id,title,slug,status,content,description,quick_answer,key_takeaways,faq,editorial_format,category,cover_image,thumbnail_image,banner_image,meta_title,meta_desc,published_at,created_at,updated_at')
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(500)

  if (error) {
    throw new Error(`Gagal memuat post untuk SEO audit: ${error.message}`)
  }

  return (data ?? []) as RawContentRow[]
}

async function loadPanduan(supabase: SupabaseServerClient): Promise<RawContentRow[]> {
  const selectWithCategory = 'id,title,slug,status,content,quick_answer,key_takeaways,faq,editorial_format,category,cover_image,thumbnail_image,banner_image,meta_title,meta_desc,published_at,created_at,updated_at'
  const selectFallback = 'id,title,slug,status,content,quick_answer,key_takeaways,faq,editorial_format,cover_image,meta_title,meta_desc,published_at,created_at,updated_at'
  const first = await supabase
    .from('panduan')
    .select(selectWithCategory)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(500)

  if (!first.error) {
    return (first.data ?? []) as RawContentRow[]
  }

  const fallback = await supabase
    .from('panduan')
    .select(selectFallback)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(500)

  if (fallback.error) {
    throw new Error(`Gagal memuat panduan untuk SEO audit: ${fallback.error.message}`)
  }

  return (fallback.data ?? []) as RawContentRow[]
}

function averageScore(items: SeoAuditItem[]): number {
  if (items.length === 0) return 0
  return Math.round(items.reduce((total, item) => total + item.score, 0) / items.length)
}

function coverage(items: SeoAuditItem[], predicate: (item: SeoAuditItem) => boolean): number {
  if (items.length === 0) return 0
  return Math.round((items.filter(predicate).length / items.length) * 100)
}

function timeoutOpportunity(cluster: SeoClusterSlug, query: string): SerperKeywordOpportunity {
  return {
    cluster,
    query,
    arkaraRank: null,
    topCompetitors: [],
    peopleAlsoAsk: [],
    relatedSearches: [],
    source: 'error',
    checkedAt: null,
    error: 'Scan keyword timeout. Halaman dirender tanpa menunggu Serper.',
  }
}

async function getSerperKeywordOpportunitySafe(
  cluster: SeoClusterSlug,
  query: string
): Promise<SerperKeywordOpportunity> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<SerperKeywordOpportunity>((resolve) => {
    timeoutId = setTimeout(() => resolve(timeoutOpportunity(cluster, query)), SEO_OPPORTUNITY_TIMEOUT_MS)
  })

  try {
    return await Promise.race([
      getSerperKeywordOpportunity(cluster, query),
      timeout,
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function getSeoCockpitData(): Promise<SeoCockpitData> {
  const supabase = await createClient()
  const [posts, panduan, keywordSignals] = await Promise.all([
    loadPosts(supabase),
    loadPanduan(supabase),
    getSeoKeywordSignals({ limit: 80 }),
  ])

  const contentItems = [
    ...posts.map((row) => auditRow('post', row)),
    ...panduan.map((row) => auditRow('panduan', row)),
  ].sort((left, right) => right.issues.length - left.issues.length || left.score - right.score)

  const publishedItems = contentItems.filter((item) => item.status === 'published')
  const draftItems = contentItems.filter((item) => item.status === 'draft')
  const criticalIssueCount = contentItems.reduce(
    (total, item) => total + item.issues.filter((issue) => issue.severity === 'critical').length,
    0
  )

  const clusters = SEO_CLUSTERS.map<SeoClusterStatus>((cluster) => {
    const clusterItems = contentItems.filter((item) => item.category === cluster.slug)
    const clusterPublished = clusterItems.filter((item) => item.status === 'published')

    return {
      slug: cluster.slug,
      label: cluster.label,
      publishedCount: clusterPublished.length,
      draftCount: clusterItems.length - clusterPublished.length,
      averageScore: averageScore(clusterItems),
      weakContentCount: clusterItems.filter((item) => item.score < 75).length,
      seedKeywords: [...cluster.seedKeywords],
    }
  })
  const keywordOpportunities = (
    await Promise.all(
      SEO_CLUSTERS.flatMap((cluster) =>
        cluster.seedKeywords.map((keyword) =>
          getSerperKeywordOpportunitySafe(cluster.slug, keyword)
        )
      )
    )
  ).sort((left, right) => {
    const leftRank = left.arkaraRank ?? 999
    const rightRank = right.arkaraRank ?? 999
    return rightRank - leftRank || left.query.localeCompare(right.query)
  })
  const serper = getSerperConfig()

  return {
    summary: {
      totalContent: contentItems.length,
      publishedContent: publishedItems.length,
      draftContent: draftItems.length,
      averageScore: averageScore(contentItems),
      quickAnswerCoverage: coverage(publishedItems, (item) => item.hasQuickAnswer),
      faqCoverage: coverage(publishedItems, (item) => item.faqSchemaReady),
      schemaReadyCount: publishedItems.filter((item) => item.articleSchemaReady && (item.faqSchemaReady || item.howToSchemaReady)).length,
      criticalIssueCount,
      keywordGapCount: keywordOpportunities.filter((item) =>
        item.arkaraRank === null && item.source !== 'missing-key' && item.source !== 'error'
      ).length,
    },
    clusters,
    topFixes: contentItems
      .filter((item) => item.issues.length > 0)
      .slice(0, 10),
    contentItems,
    visibilityPrompts: VISIBILITY_PROMPTS,
    keywordOpportunities,
    keywordSignals,
    serper,
  }
}
