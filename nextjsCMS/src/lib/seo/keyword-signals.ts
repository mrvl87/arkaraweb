import { createClient } from '@/lib/supabase/server'
import {
  SEO_KEYWORD_SIGNAL_CLUSTERS,
  type SeoKeywordSignal,
  type SeoKeywordSignalCluster,
  type SeoKeywordSignalDraft,
  type SeoKeywordSignalPriority,
  type SeoKeywordSignalSource,
  type SeoKeywordSignalStatus,
} from './keyword-signals.shared'
export {
  SEO_KEYWORD_SIGNAL_CLUSTERS,
  SEO_KEYWORD_SIGNAL_PRIORITIES,
  SEO_KEYWORD_SIGNAL_SOURCES,
  SEO_KEYWORD_SIGNAL_STATUSES,
} from './keyword-signals.shared'
export type {
  SeoKeywordSignal,
  SeoKeywordSignalCluster,
  SeoKeywordSignalDraft,
  SeoKeywordSignalPriority,
  SeoKeywordSignalSource,
  SeoKeywordSignalStatus,
} from './keyword-signals.shared'

interface RawSeoKeywordSignal {
  id: string
  query: string
  normalized_query: string
  source: SeoKeywordSignalSource
  cluster: SeoKeywordSignalCluster | null
  landing_page: string
  impressions: number
  clicks: number
  ctr: number | null
  average_position: number | null
  intent: string | null
  priority: SeoKeywordSignalPriority
  status: SeoKeywordSignalStatus
  notes: string | null
  created_by: string | null
  last_seen_at: string
  created_at: string
  updated_at: string
}

const SOURCE_ALIASES: Record<string, SeoKeywordSignalSource> = {
  bing: 'bing_webmaster',
  bingwebmaster: 'bing_webmaster',
  bingwebmastertools: 'bing_webmaster',
  bwt: 'bing_webmaster',
  google: 'google_search_console',
  googlesearchconsole: 'google_search_console',
  gsc: 'google_search_console',
  gcp: 'google_search_console',
  searchconsole: 'google_search_console',
  manual: 'manual',
}

const HEADER_ALIASES: Record<string, keyof SeoKeywordSignalDraft> = {
  averageposition: 'averagePosition',
  avgposition: 'averagePosition',
  avgpos: 'averagePosition',
  catatan: 'notes',
  category: 'cluster',
  clicks: 'clicks',
  click: 'clicks',
  cluster: 'cluster',
  ctr: 'ctr',
  halaman: 'landingPage',
  impressions: 'impressions',
  impression: 'impressions',
  impresi: 'impressions',
  intent: 'intent',
  kataKunci: 'query',
  katakunci: 'query',
  keyword: 'query',
  keywords: 'query',
  klik: 'clicks',
  kueri: 'query',
  landingpage: 'landingPage',
  maksud: 'intent',
  notes: 'notes',
  page: 'landingPage',
  pages: 'landingPage',
  posisi: 'averagePosition',
  position: 'averagePosition',
  priority: 'priority',
  query: 'query',
  searchquery: 'query',
  source: 'source',
  status: 'status',
  tayangan: 'impressions',
  topqueries: 'query',
  topquery: 'query',
  url: 'landingPage',
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function normalizeKeywordQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function compactText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function parseLooseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const text = String(value ?? '').trim()
  if (!text) return null

  const withoutPercent = text.replace(/%/g, '').replace(/\s+/g, '')
  const normalized = withoutPercent.includes(',') && !withoutPercent.includes('.')
    ? withoutPercent.replace(',', '.')
    : withoutPercent.replace(/,/g, '')
  const cleaned = normalized.replace(/[^0-9.-]/g, '')
  const number = Number.parseFloat(cleaned)

  return Number.isFinite(number) ? number : null
}

function parseInteger(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }

  const digits = String(value ?? '').replace(/[^0-9]/g, '')
  if (!digits) return 0

  return Math.max(0, Number.parseInt(digits, 10) || 0)
}

function parseCtr(value: unknown, clicks: number, impressions: number): number | null {
  const number = parseLooseNumber(value)

  if (number !== null) {
    const fraction = number > 1 ? number / 100 : number
    return Math.max(0, Math.min(1, Number(fraction.toFixed(4))))
  }

  if (impressions > 0 && clicks > 0) {
    return Math.max(0, Math.min(1, Number((clicks / impressions).toFixed(4))))
  }

  return null
}

function parseSource(value: unknown, fallback: SeoKeywordSignalSource): SeoKeywordSignalSource {
  const key = normalizeHeader(String(value ?? ''))
  return SOURCE_ALIASES[key] ?? fallback
}

function parseCluster(value: unknown, fallback?: SeoKeywordSignalCluster | null): SeoKeywordSignalCluster | null {
  const key = normalizeHeader(String(value ?? ''))
  const match = SEO_KEYWORD_SIGNAL_CLUSTERS.find((cluster) => cluster === key)
  return match ?? fallback ?? null
}

function parsePriority(value: unknown, impressions: number, clicks: number): SeoKeywordSignalPriority {
  const key = normalizeHeader(String(value ?? ''))

  if (key === 'high' || key === 'tinggi') return 'high'
  if (key === 'low' || key === 'rendah') return 'low'
  if (key === 'medium' || key === 'sedang') return 'medium'

  if (clicks >= 20 || impressions >= 500) return 'high'
  if (clicks === 0 && impressions < 50) return 'low'
  return 'medium'
}

function parseStatus(value: unknown): SeoKeywordSignalStatus {
  const key = normalizeHeader(String(value ?? ''))

  if (key === 'ignored' || key === 'abaikan') return 'ignored'
  if (key === 'used' || key === 'dipakai') return 'used'
  return 'active'
}

function detectDelimiter(line: string): string | null {
  if (line.includes('\t')) return '\t'

  const commaCount = (line.match(/,/g) ?? []).length
  const semicolonCount = (line.match(/;/g) ?? []).length

  if (semicolonCount > 0 && semicolonCount >= commaCount) return ';'
  if (commaCount > 0) return ','

  return null
}

function splitDelimitedLine(line: string, delimiter: string | null): string[] {
  if (!delimiter) return [line.trim()]

  const result: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if (char === delimiter && !quoted) {
      result.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  result.push(current.trim())
  return result
}

function buildHeaderMap(parts: string[]): Partial<Record<keyof SeoKeywordSignalDraft, number>> {
  return parts.reduce<Partial<Record<keyof SeoKeywordSignalDraft, number>>>((map, part, index) => {
    const field = HEADER_ALIASES[normalizeHeader(part)]

    if (field && map[field] === undefined) {
      map[field] = index
    }

    return map
  }, {})
}

function getPart(
  parts: string[],
  headerMap: Partial<Record<keyof SeoKeywordSignalDraft, number>>,
  field: keyof SeoKeywordSignalDraft,
  fallbackIndex?: number
): string {
  const index = headerMap[field] ?? fallbackIndex
  return index === undefined ? '' : parts[index] ?? ''
}

export function parseKeywordSignalPaste(
  rawText: string,
  defaults: {
    source: SeoKeywordSignalSource
    cluster?: SeoKeywordSignalCluster | null
  }
): SeoKeywordSignalDraft[] {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const delimiter = detectDelimiter(lines[0])
  const firstParts = splitDelimitedLine(lines[0], delimiter)
  const firstHeaderMap = buildHeaderMap(firstParts)
  const hasHeader = firstHeaderMap.query !== undefined && Object.keys(firstHeaderMap).length >= 2
  const headerMap = hasHeader ? firstHeaderMap : {}
  const dataLines = hasHeader ? lines.slice(1) : lines
  const byKey = new Map<string, SeoKeywordSignalDraft>()

  for (const line of dataLines) {
    const lineDelimiter = delimiter ?? detectDelimiter(line)
    const parts = splitDelimitedLine(line, lineDelimiter)
    const query = compactText(getPart(parts, headerMap, 'query', 0), 220)

    if (!query) continue

    const impressions = parseInteger(getPart(parts, headerMap, 'impressions', hasHeader ? undefined : 2))
    const clicks = parseInteger(getPart(parts, headerMap, 'clicks', hasHeader ? undefined : 1))
    const ctr = parseCtr(getPart(parts, headerMap, 'ctr', hasHeader ? undefined : 3), clicks, impressions)
    const averagePosition = parseLooseNumber(getPart(parts, headerMap, 'averagePosition', hasHeader ? undefined : 4))
    const source = parseSource(getPart(parts, headerMap, 'source'), defaults.source)
    const cluster = parseCluster(getPart(parts, headerMap, 'cluster'), defaults.cluster)
    const landingPage = compactText(getPart(parts, headerMap, 'landingPage', hasHeader ? undefined : 5), 500)
    const notes = compactText(getPart(parts, headerMap, 'notes', hasHeader ? undefined : 6), 1000)
    const intent = compactText(getPart(parts, headerMap, 'intent'), 120)
    const priority = parsePriority(getPart(parts, headerMap, 'priority'), impressions, clicks)
    const status = parseStatus(getPart(parts, headerMap, 'status'))
    const normalizedQuery = normalizeKeywordQuery(query)

    if (!normalizedQuery) continue

    byKey.set(`${source}:${normalizedQuery}:${landingPage}`, {
      query,
      source,
      cluster,
      landingPage,
      impressions,
      clicks,
      ctr,
      averagePosition: averagePosition === null ? null : Number(averagePosition.toFixed(2)),
      intent: intent || null,
      priority,
      status,
      notes: notes || null,
    })
  }

  return [...byKey.values()]
}

function mapRow(row: RawSeoKeywordSignal): SeoKeywordSignal {
  return {
    id: row.id,
    query: row.query,
    normalizedQuery: row.normalized_query,
    source: row.source,
    cluster: row.cluster,
    landingPage: row.landing_page,
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: row.ctr === null ? null : Number(row.ctr),
    averagePosition: row.average_position === null ? null : Number(row.average_position),
    intent: row.intent,
    priority: row.priority,
    status: row.status,
    notes: row.notes,
    createdBy: row.created_by,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function isMissingTableError(error: { message?: string; code?: string } | null): boolean {
  return Boolean(
    error &&
    (error.code === '42P01' || error.message?.toLowerCase().includes('seo_keyword_signals'))
  )
}

export async function getSeoKeywordSignals(options: {
  status?: SeoKeywordSignalStatus
  limit?: number
} = {}): Promise<SeoKeywordSignal[]> {
  const supabase = await createClient()
  let request = supabase
    .from('seo_keyword_signals')
    .select('*')
    .order('impressions', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(options.limit ?? 80)

  if (options.status) {
    request = request.eq('status', options.status)
  }

  const { data, error } = await request

  if (error) {
    if (isMissingTableError(error)) return []
    throw new Error(`Gagal memuat keyword signal: ${error.message}`)
  }

  return ((data ?? []) as RawSeoKeywordSignal[]).map(mapRow)
}

export async function upsertSeoKeywordSignals(
  drafts: SeoKeywordSignalDraft[],
  userId?: string | null
): Promise<SeoKeywordSignal[]> {
  if (drafts.length === 0) return []

  const supabase = await createClient()
  const now = new Date().toISOString()
  const rows = drafts.map((draft) => {
    const query = compactText(draft.query, 220)
    const normalizedQuery = normalizeKeywordQuery(query)
    const impressions = Math.max(0, Math.round(draft.impressions ?? 0))
    const clicks = Math.max(0, Math.round(draft.clicks ?? 0))

    return {
      query,
      normalized_query: normalizedQuery,
      source: draft.source,
      cluster: draft.cluster ?? null,
      landing_page: compactText(draft.landingPage, 500),
      impressions,
      clicks,
      ctr: draft.ctr ?? parseCtr(null, clicks, impressions),
      average_position: draft.averagePosition ?? null,
      intent: draft.intent ? compactText(draft.intent, 120) : null,
      priority: draft.priority ?? parsePriority('', impressions, clicks),
      status: draft.status ?? 'active',
      notes: draft.notes ? compactText(draft.notes, 1000) : null,
      created_by: userId ?? null,
      last_seen_at: now,
      updated_at: now,
    }
  })

  const { data, error } = await supabase
    .from('seo_keyword_signals')
    .upsert(rows, { onConflict: 'source,normalized_query,landing_page' })
    .select('*')
    .order('impressions', { ascending: false })

  if (error) {
    throw new Error(`Gagal menyimpan keyword signal: ${error.message}`)
  }

  return ((data ?? []) as RawSeoKeywordSignal[]).map(mapRow)
}

export async function updateSeoKeywordSignal(
  id: string,
  patch: Partial<SeoKeywordSignalDraft>
): Promise<SeoKeywordSignal> {
  const supabase = await createClient()
  const query = patch.query ? compactText(patch.query, 220) : undefined
  const impressions = patch.impressions === undefined ? undefined : Math.max(0, Math.round(patch.impressions))
  const clicks = patch.clicks === undefined ? undefined : Math.max(0, Math.round(patch.clicks))
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (query !== undefined) {
    payload.query = query
    payload.normalized_query = normalizeKeywordQuery(query)
  }

  if (patch.source) payload.source = patch.source
  if (patch.cluster !== undefined) payload.cluster = patch.cluster
  if (patch.landingPage !== undefined) payload.landing_page = compactText(patch.landingPage, 500)
  if (impressions !== undefined) payload.impressions = impressions
  if (clicks !== undefined) payload.clicks = clicks
  if (patch.ctr !== undefined) payload.ctr = patch.ctr
  if (patch.averagePosition !== undefined) payload.average_position = patch.averagePosition
  if (patch.intent !== undefined) payload.intent = patch.intent ? compactText(patch.intent, 120) : null
  if (patch.priority) payload.priority = patch.priority
  if (patch.status) payload.status = patch.status
  if (patch.notes !== undefined) payload.notes = patch.notes ? compactText(patch.notes, 1000) : null

  const { data, error } = await supabase
    .from('seo_keyword_signals')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Keyword signal tidak ditemukan.')
  }

  return mapRow(data as RawSeoKeywordSignal)
}

export async function deleteSeoKeywordSignal(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('seo_keyword_signals')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Gagal menghapus keyword signal: ${error.message}`)
  }
}

function scoreSignalForTopic(signal: SeoKeywordSignal, topicTokens: Set<string>): number {
  const haystack = normalizeKeywordQuery([signal.query, signal.intent, signal.notes, signal.landingPage].filter(Boolean).join(' '))
  const keywordScore = [...topicTokens].reduce((total, token) => total + (haystack.includes(token) ? 8 : 0), 0)
  const priorityScore = signal.priority === 'high' ? 16 : signal.priority === 'medium' ? 8 : 2
  const statusScore = signal.status === 'active' ? 10 : signal.status === 'used' ? 4 : -20
  const metricScore = Math.min(30, signal.clicks * 2 + signal.impressions / 100)

  return keywordScore + priorityScore + statusScore + metricScore
}

export async function getSeoKeywordSignalContext(topic?: string, limit = 10): Promise<string> {
  const signals = await getSeoKeywordSignals({ status: 'active', limit: 120 })

  if (signals.length === 0) return ''

  const topicTokens = new Set(
    normalizeKeywordQuery(topic ?? '')
      .split(' ')
      .filter((token) => token.length > 2)
  )
  const ranked = [...signals]
    .sort((left, right) => scoreSignalForTopic(right, topicTokens) - scoreSignalForTopic(left, topicTokens))
    .slice(0, limit)

  return ranked
    .map((signal, index) => {
      const metrics = [
        `impressions ${signal.impressions}`,
        `clicks ${signal.clicks}`,
        signal.ctr !== null ? `CTR ${(signal.ctr * 100).toFixed(1)}%` : '',
        signal.averagePosition !== null ? `posisi ${signal.averagePosition}` : '',
      ].filter(Boolean).join(', ')
      const source = signal.source === 'google_search_console'
        ? 'GSC'
        : signal.source === 'bing_webmaster'
          ? 'Bing'
          : 'Manual'
      const extras = [
        signal.cluster ? `cluster ${signal.cluster}` : '',
        signal.landingPage ? `page ${signal.landingPage}` : '',
        signal.intent ? `intent ${signal.intent}` : '',
        signal.notes ? `catatan ${signal.notes}` : '',
      ].filter(Boolean).join('; ')

      return `${index + 1}. ${signal.query} (${source}; ${metrics}${extras ? `; ${extras}` : ''})`
    })
    .join('\n')
}
