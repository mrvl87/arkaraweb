export const SEO_KEYWORD_SIGNAL_SOURCES = [
  'google_search_console',
  'bing_webmaster',
  'manual',
] as const

export const SEO_KEYWORD_SIGNAL_CLUSTERS = [
  'air',
  'energi',
  'pangan',
  'medis',
  'keamanan',
  'komunitas',
] as const

export const SEO_KEYWORD_SIGNAL_PRIORITIES = ['high', 'medium', 'low'] as const
export const SEO_KEYWORD_SIGNAL_STATUSES = ['active', 'ignored', 'used'] as const

export type SeoKeywordSignalSource = (typeof SEO_KEYWORD_SIGNAL_SOURCES)[number]
export type SeoKeywordSignalCluster = (typeof SEO_KEYWORD_SIGNAL_CLUSTERS)[number]
export type SeoKeywordSignalPriority = (typeof SEO_KEYWORD_SIGNAL_PRIORITIES)[number]
export type SeoKeywordSignalStatus = (typeof SEO_KEYWORD_SIGNAL_STATUSES)[number]

export interface SeoKeywordSignal {
  id: string
  query: string
  normalizedQuery: string
  source: SeoKeywordSignalSource
  cluster: SeoKeywordSignalCluster | null
  landingPage: string
  impressions: number
  clicks: number
  ctr: number | null
  averagePosition: number | null
  intent: string | null
  priority: SeoKeywordSignalPriority
  status: SeoKeywordSignalStatus
  notes: string | null
  createdBy: string | null
  lastSeenAt: string
  createdAt: string
  updatedAt: string
}

export interface SeoKeywordSignalDraft {
  query: string
  source: SeoKeywordSignalSource
  cluster?: SeoKeywordSignalCluster | null
  landingPage?: string
  impressions?: number
  clicks?: number
  ctr?: number | null
  averagePosition?: number | null
  intent?: string | null
  priority?: SeoKeywordSignalPriority
  status?: SeoKeywordSignalStatus
  notes?: string | null
}
