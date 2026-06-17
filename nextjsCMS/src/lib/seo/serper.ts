import { createClient } from '@/lib/supabase/server'
import type { SeoClusterSlug } from './content-audit'

const SERPER_ENDPOINT = 'https://google.serper.dev/search'
const DEFAULT_CACHE_HOURS = 24
const DEFAULT_SERPER_TIMEOUT_MS = 4500
const DEFAULT_GL = 'id'
const DEFAULT_HL = 'id'
const ARKARA_DOMAIN = 'arkaraweb.com'
const CACHE_OPERATION = 'serper_keyword_scan'

export interface SerperOrganicResult {
  title?: string
  link?: string
  snippet?: string
  position?: number
}

export interface SerperPeopleAlsoAskResult {
  question?: string
  snippet?: string
  title?: string
  link?: string
}

export interface SerperRelatedSearch {
  query?: string
}

export interface SerperSearchResponse {
  organic?: SerperOrganicResult[]
  peopleAlsoAsk?: SerperPeopleAlsoAskResult[]
  relatedSearches?: SerperRelatedSearch[]
  searchParameters?: Record<string, unknown>
}

export interface SerperKeywordOpportunity {
  cluster: SeoClusterSlug
  query: string
  arkaraRank: number | null
  topCompetitors: string[]
  peopleAlsoAsk: string[]
  relatedSearches: string[]
  source: 'live' | 'cache' | 'stale-cache' | 'missing-key' | 'error'
  checkedAt: string | null
  error?: string
}

interface SerperQueryInput {
  query: string
  gl: string
  hl: string
  num: number
}

interface CachedSnapshot {
  input_json?: SerperQueryInput
  output_json?: SerperSearchResponse
  created_at?: string
  status?: 'success' | 'error'
  error_message?: string | null
}

function getCacheHours(): number {
  const parsed = Number(process.env.SERPER_CACHE_HOURS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CACHE_HOURS
}

function getSerperTimeoutMs(): number {
  const parsed = Number(process.env.SERPER_TIMEOUT_MS)
  return Number.isFinite(parsed) && parsed >= 1000 ? parsed : DEFAULT_SERPER_TIMEOUT_MS
}

export function getSerperConfig() {
  return {
    configured: Boolean(process.env.SERPER_API_KEY),
    gl: process.env.SERPER_GL || DEFAULT_GL,
    hl: process.env.SERPER_HL || DEFAULT_HL,
    cacheHours: getCacheHours(),
  }
}

function isFresh(createdAt?: string, cacheHours = getCacheHours()): boolean {
  if (!createdAt) return false
  const timestamp = new Date(createdAt).getTime()
  if (!Number.isFinite(timestamp)) return false

  return Date.now() - timestamp <= cacheHours * 60 * 60 * 1000
}

function getDomain(link?: string): string | null {
  if (!link) return null

  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function getArkaraRank(results: SerperOrganicResult[]): number | null {
  for (const result of results) {
    const domain = getDomain(result.link)
    if (domain === ARKARA_DOMAIN || domain?.endsWith(`.${ARKARA_DOMAIN}`)) {
      return result.position ?? null
    }
  }

  return null
}

function getTopCompetitors(results: SerperOrganicResult[]): string[] {
  const domains = new Set<string>()

  for (const result of results.slice(0, 8)) {
    const domain = getDomain(result.link)
    if (!domain || domain === ARKARA_DOMAIN || domain.endsWith(`.${ARKARA_DOMAIN}`)) continue
    domains.add(domain)
  }

  return [...domains].slice(0, 5)
}

function toOpportunity(
  cluster: SeoClusterSlug,
  query: string,
  response: SerperSearchResponse | undefined,
  source: SerperKeywordOpportunity['source'],
  checkedAt: string | null,
  error?: string
): SerperKeywordOpportunity {
  const organic = response?.organic ?? []

  return {
    cluster,
    query,
    arkaraRank: getArkaraRank(organic),
    topCompetitors: getTopCompetitors(organic),
    peopleAlsoAsk: (response?.peopleAlsoAsk ?? [])
      .map((item) => item.question?.trim())
      .filter((question): question is string => Boolean(question))
      .slice(0, 4),
    relatedSearches: (response?.relatedSearches ?? [])
      .map((item) => item.query?.trim())
      .filter((relatedQuery): relatedQuery is string => Boolean(relatedQuery))
      .slice(0, 5),
    source,
    checkedAt,
    error,
  }
}

function matchesSnapshot(snapshot: CachedSnapshot, input: SerperQueryInput): boolean {
  return (
    snapshot.input_json?.query === input.query &&
    snapshot.input_json?.gl === input.gl &&
    snapshot.input_json?.hl === input.hl &&
    snapshot.input_json?.num === input.num
  )
}

async function loadCachedSnapshot(input: SerperQueryInput): Promise<CachedSnapshot | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_generations')
    .select('input_json, output_json, created_at, status, error_message')
    .eq('operation', CACHE_OPERATION)
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) {
    console.error('[Serper] failed to load cache:', error.message)
    return null
  }

  return ((data ?? []) as CachedSnapshot[]).find((snapshot) => matchesSnapshot(snapshot, input)) ?? null
}

async function saveSnapshot(
  input: SerperQueryInput,
  status: 'success' | 'error',
  output: SerperSearchResponse | Record<string, never>,
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase.from('ai_generations').insert({
      user_id: userData.user?.id ?? null,
      target_type: 'workspace',
      target_id: null,
      operation: CACHE_OPERATION,
      model: 'serper-google-search',
      status,
      input_json: input,
      output_json: output,
      prompt_version: 'serper-v1',
      error_message: errorMessage ?? null,
    })

    if (error) {
      console.error('[Serper] failed to save cache:', error.message)
    }
  } catch (error) {
    console.error('[Serper] failed to save cache:', error)
  }
}

async function callSerper(input: SerperQueryInput): Promise<SerperSearchResponse> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    throw new Error('SERPER_API_KEY belum dikonfigurasi.')
  }

  const timeoutMs = getSerperTimeoutMs()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(SERPER_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: input.query,
        gl: input.gl,
        hl: input.hl,
        num: input.num,
      }),
      next: { revalidate: 0 },
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Serper gagal: ${response.status} ${response.statusText}${text ? ` - ${text.slice(0, 240)}` : ''}`)
    }

    return response.json() as Promise<SerperSearchResponse>
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Serper timeout setelah ${timeoutMs}ms.`)
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getSerperKeywordOpportunity(
  cluster: SeoClusterSlug,
  query: string
): Promise<SerperKeywordOpportunity> {
  const config = getSerperConfig()
  const input: SerperQueryInput = {
    query,
    gl: config.gl,
    hl: config.hl,
    num: 10,
  }
  const cached = await loadCachedSnapshot(input)

  if (!config.configured) {
    return toOpportunity(cluster, query, cached?.output_json, cached ? 'stale-cache' : 'missing-key', cached?.created_at ?? null, cached ? undefined : 'SERPER_API_KEY belum dikonfigurasi.')
  }

  if (cached && cached.status === 'success' && isFresh(cached.created_at, config.cacheHours)) {
    return toOpportunity(cluster, query, cached.output_json, 'cache', cached.created_at ?? null)
  }

  try {
    const result = await callSerper(input)
    await saveSnapshot(input, 'success', result)
    return toOpportunity(cluster, query, result, 'live', new Date().toISOString())
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Serper gagal tanpa pesan error.'
    await saveSnapshot(input, 'error', {}, message)

    if (cached?.output_json) {
      return toOpportunity(cluster, query, cached.output_json, 'stale-cache', cached.created_at ?? null, message)
    }

    return toOpportunity(cluster, query, undefined, 'error', null, message)
  }
}
