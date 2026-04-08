const SENTENCE_SPLIT_REGEX = /(?<=[.!?])\s+|\n{2,}/

const TIME_SENSITIVE_PATTERNS = [
  /\b(terbaru|saat ini|kini|tahun ini|bulan ini|minggu ini|hari ini|per \d{4}|update|versi terbaru|rilis terbaru)\b/i,
  /\b(202[0-9]|203[0-9])\b/,
  /\b\d{1,2}\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}\b/i,
  /\b(regulasi|aturan|kebijakan|peraturan|undang-undang|izin|subsidi|tarif|harga|biaya|kurs|inflasi|statistik|survei)\b/i,
]

const HIGH_RISK_PATTERNS = [
  /\b(harus|wajib|dilarang|aman|berbahaya|berisiko|darurat|evakuasi|obat|dosis|medis|kesehatan|listrik|gas|api|kebakaran|keracunan)\b/i,
  /\b(standar|sertifikasi|spesifikasi|prosedur|langkah|checklist|panduan keselamatan)\b/i,
  /\b(selalu|tidak pernah|pasti|terjamin|100%|semua|satu-satunya)\b/i,
]

const FACT_SIGNAL_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s?(%|persen|rupiah|rb|ribu|juta|miliar|km|meter|cm|mm|liter|ml|kg|gram|jam|menit|hari|bulan|tahun)\b/i,
  /\b\d+(?:[.,]\d+)?\b/,
  /\b(menurut|berdasarkan|data|riset|laporan|studi|survei|penelitian)\b/i,
  /\b(model|seri|tipe|produk|layanan|platform|fitur|aplikasi)\b/i,
]

export type ExtractedClaimCategory = 'time_sensitive' | 'high_risk' | 'evergreen'

export interface ExtractedClaim {
  claim: string
  category: ExtractedClaimCategory
  score: number
  signals: string[]
}

export interface ClaimExtractionResult {
  prioritizedClaims: ExtractedClaim[]
  evergreenClaims: ExtractedClaim[]
  summary: {
    totalSentences: number
    prioritizedCount: number
    timeSensitiveCount: number
    highRiskCount: number
  }
}

function normalizeSentence(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function splitSentences(content: string): string[] {
  return content
    .replace(/\r\n/g, '\n')
    .split(SENTENCE_SPLIT_REGEX)
    .map(normalizeSentence)
    .filter((sentence) => sentence.length >= 40)
}

function collectSignals(sentence: string, patterns: RegExp[], label: string): string[] {
  return patterns.flatMap((pattern) => (pattern.test(sentence) ? [label] : []))
}

function scoreSentence(sentence: string, title: string, focusArea?: string): ExtractedClaim | undefined {
  const lowered = sentence.toLowerCase()
  const signals: string[] = []
  let score = 0

  const timeSignals = collectSignals(sentence, TIME_SENSITIVE_PATTERNS, 'time-sensitive')
  const riskSignals = collectSignals(sentence, HIGH_RISK_PATTERNS, 'high-risk')
  const factSignals = collectSignals(sentence, FACT_SIGNAL_PATTERNS, 'fact-signal')

  if (timeSignals.length > 0) {
    score += 4
    signals.push(...timeSignals)
  }

  if (riskSignals.length > 0) {
    score += 4
    signals.push(...riskSignals)
  }

  if (factSignals.length > 0) {
    score += 2
    signals.push(...factSignals)
  }

  if (sentence.length > 180) {
    score += 1
  }

  const titleTokens = normalizeSentence(title)
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 5)

  const focusTokens = (focusArea ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 5)

  if (titleTokens.some((token) => lowered.includes(token))) {
    score += 1
    signals.push('title-overlap')
  }

  if (focusTokens.some((token) => lowered.includes(token))) {
    score += 2
    signals.push('focus-overlap')
  }

  if (score < 2) {
    return undefined
  }

  const uniqueSignals = Array.from(new Set(signals))
  const category: ExtractedClaimCategory = uniqueSignals.includes('time-sensitive')
    ? 'time_sensitive'
    : uniqueSignals.includes('high-risk')
      ? 'high_risk'
      : 'evergreen'

  return {
    claim: sentence,
    category,
    score,
    signals: uniqueSignals,
  }
}

export function extractClaimsForVerification(input: {
  title: string
  content: string
  focusArea?: string
  maxPrioritized?: number
  maxEvergreen?: number
}): ClaimExtractionResult {
  const sentences = splitSentences(input.content)
  const extracted = sentences
    .map((sentence) => scoreSentence(sentence, input.title, input.focusArea))
    .filter((claim): claim is ExtractedClaim => Boolean(claim))

  const deduped = extracted.filter(
    (claim, index, array) =>
      array.findIndex(
        (candidate) =>
          candidate.claim.toLowerCase() === claim.claim.toLowerCase()
      ) === index
  )

  const sorted = deduped.sort((a, b) => {
    const categoryWeight = (category: ExtractedClaimCategory) => {
      switch (category) {
        case 'time_sensitive':
          return 3
        case 'high_risk':
          return 2
        default:
          return 1
      }
    }

    return categoryWeight(b.category) - categoryWeight(a.category) || b.score - a.score
  })

  const prioritized = sorted
    .filter((claim) => claim.category !== 'evergreen')
    .slice(0, input.maxPrioritized ?? 8)

  const evergreen = sorted
    .filter((claim) => claim.category === 'evergreen')
    .slice(0, input.maxEvergreen ?? 4)

  return {
    prioritizedClaims: prioritized,
    evergreenClaims: evergreen,
    summary: {
      totalSentences: sentences.length,
      prioritizedCount: prioritized.length,
      timeSensitiveCount: prioritized.filter((claim) => claim.category === 'time_sensitive').length,
      highRiskCount: prioritized.filter((claim) => claim.category === 'high_risk').length,
    },
  }
}

