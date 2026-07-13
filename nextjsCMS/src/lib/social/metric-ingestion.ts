export interface CsvParseResult {
  columns: string[]
  rows: Array<Record<string, string>>
  delimiter: string
  errors: string[]
}

export interface CsvMetricColumnMapping {
  reach?: string
  reactions?: string
  comments?: string
  shares?: string
  link_clicks?: string
  video_views?: string
  published_date?: string
  post_url?: string
  title?: string
}

export interface MetricImportPublicationRef {
  id: string
  post_id: string
  facebook_url: string | null
  published_at: string
}

export interface MetricImportPostRef {
  id: string
  title: string
  scheduled_date: string | null
}

export interface CsvMetricImportPreviewRow {
  row_index: number
  source: Record<string, string>
  values: {
    reach: number | null
    reactions: number | null
    comments: number | null
    shares: number | null
    link_clicks: number | null
    video_views: number | null
    published_date: string | null
    post_url: string | null
    title: string | null
  }
  match_status: 'matched' | 'ambiguous' | 'unmatched'
  matched_post_id: string | null
  matched_publication_id: string | null
  candidate_post_ids: string[]
  match_reason: string
  errors: string[]
}

const UTF8_BOM = /^\uFEFF/

function splitCsvLine(line: string, delimiter: string) {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

function countDelimiter(line: string, delimiter: string) {
  return splitCsvLine(line, delimiter).length - 1
}

function detectDelimiter(headerLine: string) {
  const candidates = [',', ';', '\t']
  return candidates
    .map((delimiter) => ({ delimiter, count: countDelimiter(headerLine, delimiter) }))
    .sort((left, right) => right.count - left.count)[0]?.delimiter ?? ','
}

export function parseSocialMetricsCsv(csvText: string): CsvParseResult {
  const errors: string[] = []
  const normalized = csvText.replace(UTF8_BOM, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  if (!normalized) return { columns: [], rows: [], delimiter: ',', errors: ['CSV kosong.'] }

  const lines = normalized.split('\n').filter((line) => line.trim())
  const delimiter = detectDelimiter(lines[0] ?? '')
  const columns = splitCsvLine(lines[0] ?? '', delimiter).map((column, index) => column.trim() || `Column ${index + 1}`)
  const rows = lines.slice(1).map((line, rowIndex) => {
    const cells = splitCsvLine(line, delimiter)
    if (cells.length !== columns.length) errors.push(`Row ${rowIndex + 2} memiliki ${cells.length} kolom, bukan ${columns.length}.`)
    return Object.fromEntries(columns.map((column, index) => [column, cells[index]?.trim() ?? '']))
  })

  return { columns, rows, delimiter, errors }
}

export function normalizeMetricNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const text = String(value)
    .trim()
    .replace(/\s/g, '')
    .replace(/(?<=\d)[,.](?=\d{3}(\D|$))/g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '')
  if (!text) return null
  const parsed = Number(text)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed)
}

export function normalizeImportUrl(value: string | null | undefined): string {
  const raw = (value ?? '').trim()
  if (!raw) return ''
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    url.hash = ''
    url.searchParams.sort()
    return `${url.hostname.replace(/^www\./, '').toLowerCase()}${url.pathname.replace(/\/$/, '')}${url.search}`
  } catch {
    return raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '').toLowerCase()
  }
}

export function normalizeImportTitle(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeImportDate(value: string | null | undefined): string {
  const raw = (value ?? '').trim()
  if (!raw) return ''
  const iso = raw.match(/\d{4}-\d{2}-\d{2}/)?.[0]
  if (iso) return iso
  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (dmy) {
    const day = dmy[1].padStart(2, '0')
    const month = dmy[2].padStart(2, '0')
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]
    return `${year}-${month}-${day}`
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function buildCsvMetricImportPreview(input: {
  rows: Array<Record<string, string>>
  mapping: CsvMetricColumnMapping
  publications: MetricImportPublicationRef[]
  posts: MetricImportPostRef[]
}): CsvMetricImportPreviewRow[] {
  const publicationsByUrl = new Map<string, MetricImportPublicationRef[]>()
  for (const publication of input.publications) {
    const key = normalizeImportUrl(publication.facebook_url)
    if (!key) continue
    publicationsByUrl.set(key, [...(publicationsByUrl.get(key) ?? []), publication])
  }

  const postById = new Map(input.posts.map((post) => [post.id, post]))

  return input.rows.map((row, index) => {
    const value = (column?: string) => column ? row[column] ?? '' : ''
    const postUrl = value(input.mapping.post_url).trim() || null
    const title = value(input.mapping.title).trim() || null
    const publishedDate = normalizeImportDate(value(input.mapping.published_date)) || null
    const errors: string[] = []
    const values = {
      reach: normalizeMetricNumber(value(input.mapping.reach)),
      reactions: normalizeMetricNumber(value(input.mapping.reactions)),
      comments: normalizeMetricNumber(value(input.mapping.comments)),
      shares: normalizeMetricNumber(value(input.mapping.shares)),
      link_clicks: normalizeMetricNumber(value(input.mapping.link_clicks)),
      video_views: normalizeMetricNumber(value(input.mapping.video_views)),
      published_date: publishedDate,
      post_url: postUrl,
      title,
    }

    const metricCount = [values.reach, values.reactions, values.comments, values.shares, values.link_clicks, values.video_views].filter((item) => item !== null).length
    if (metricCount === 0) errors.push('Tidak ada angka metrics yang valid.')

    const urlMatches = publicationsByUrl.get(normalizeImportUrl(postUrl)) ?? []
    if (urlMatches.length === 1) {
      return {
        row_index: index,
        source: row,
        values,
        match_status: errors.length ? 'unmatched' : 'matched',
        matched_post_id: errors.length ? null : urlMatches[0].post_id,
        matched_publication_id: errors.length ? null : urlMatches[0].id,
        candidate_post_ids: errors.length ? [] : [urlMatches[0].post_id],
        match_reason: 'exact_facebook_url',
        errors,
      }
    }

    if (urlMatches.length > 1) {
      return {
        row_index: index,
        source: row,
        values,
        match_status: 'ambiguous',
        matched_post_id: null,
        matched_publication_id: null,
        candidate_post_ids: uniqueValues(urlMatches.map((publication) => publication.post_id)),
        match_reason: 'multiple_exact_facebook_url',
        errors,
      }
    }

    const normalizedTitle = normalizeImportTitle(title)
    const titleDateMatches = input.posts.filter((post) => {
      if (!normalizedTitle || normalizeImportTitle(post.title) !== normalizedTitle) return false
      if (!publishedDate) return true
      const postDate = post.scheduled_date ?? input.publications.find((publication) => publication.post_id === post.id)?.published_at.slice(0, 10) ?? ''
      return postDate === publishedDate
    })

    if (titleDateMatches.length === 1) {
      const publication = input.publications.find((item) => item.post_id === titleDateMatches[0].id)
      return {
        row_index: index,
        source: row,
        values,
        match_status: errors.length ? 'unmatched' : 'matched',
        matched_post_id: errors.length ? null : titleDateMatches[0].id,
        matched_publication_id: errors.length ? null : publication?.id ?? null,
        candidate_post_ids: errors.length ? [] : [titleDateMatches[0].id],
        match_reason: publishedDate ? 'normalized_title_and_date' : 'normalized_title',
        errors,
      }
    }

    return {
      row_index: index,
      source: row,
      values,
      match_status: titleDateMatches.length > 1 ? 'ambiguous' : 'unmatched',
      matched_post_id: null,
      matched_publication_id: null,
      candidate_post_ids: titleDateMatches.map((post) => postById.get(post.id)?.id).filter(Boolean) as string[],
      match_reason: titleDateMatches.length > 1 ? 'multiple_normalized_title_date' : 'no_match',
      errors,
    }
  })
}
