import type { SocialPostVariantType, SocialVariantHeuristicScores } from '@/types/social'

export const DEFAULT_VARIANT_COUNT = 5

export const HOOK_DIRECTIONS = [
  'direct_consequence',
  'question',
  'scenario',
  'concrete_number',
  'contrarian_statement',
] as const

export function getVariantReadabilityStats(content: string, variantType: SocialPostVariantType) {
  const normalized = content.replace(/\s+/g, ' ').trim()
  const words = normalized ? normalized.split(' ').length : 0
  const sentences = normalized ? Math.max(1, normalized.split(/[.!?]+/).filter((part) => part.trim()).length) : 0
  const averageWordsPerSentence = sentences > 0 ? words / sentences : 0
  const hardLimit = variantType === 'headline' ? 90 : variantType === 'hook' ? 320 : 500
  const density = averageWordsPerSentence <= 12 ? 'ringan' : averageWordsPerSentence <= 20 ? 'sedang' : 'padat'

  return {
    characters: normalized.length,
    words,
    sentences,
    averageWordsPerSentence: Number(averageWordsPerSentence.toFixed(1)),
    hardLimit,
    density,
    overLimit: normalized.length > hardLimit,
  }
}

export function normalizeHeuristicScores(scores: SocialVariantHeuristicScores | null | undefined): SocialVariantHeuristicScores {
  const clamp = (value: unknown) => {
    const numberValue = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(numberValue)) return undefined
    return Math.max(0, Math.min(10, Number(numberValue.toFixed(1))))
  }

  return {
    clarity: clamp(scores?.clarity),
    curiosity: clamp(scores?.curiosity),
    relevance: clamp(scores?.relevance),
    brand_fit: clamp(scores?.brand_fit),
    clickbait_risk: clamp(scores?.clickbait_risk),
  }
}

export function getVariantScoreAverage(scores: SocialVariantHeuristicScores | null | undefined) {
  const normalized = normalizeHeuristicScores(scores)
  const positive = [normalized.clarity, normalized.curiosity, normalized.relevance, normalized.brand_fit]
    .filter((value): value is number => typeof value === 'number')
  if (positive.length === 0) return null
  return Number((positive.reduce((total, value) => total + value, 0) / positive.length).toFixed(1))
}