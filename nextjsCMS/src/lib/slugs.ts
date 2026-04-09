export function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim()
}

export function getPostPath(slug: string): string {
  return `/blog/${slug}`
}

export function getPanduanPath(slug: string): string {
  return `/panduan/${slug}`
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function levenshteinDistance(source: string, target: string): number {
  if (source === target) return 0
  if (!source.length) return target.length
  if (!target.length) return source.length

  const previous = new Array(target.length + 1).fill(0)
  const current = new Array(target.length + 1).fill(0)

  for (let j = 0; j <= target.length; j += 1) {
    previous[j] = j
  }

  for (let i = 1; i <= source.length; i += 1) {
    current[0] = i

    for (let j = 1; j <= target.length; j += 1) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      )
    }

    for (let j = 0; j <= target.length; j += 1) {
      previous[j] = current[j]
    }
  }

  return previous[target.length]
}

function toSlugTokens(value: string): string[] {
  return value
    .split('-')
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
}

export function getSlugSimilarityScore(source: string, target: string): number {
  const left = normalizeSlug(source)
  const right = normalizeSlug(target)

  if (!left || !right) return 0
  if (left === right) return 1

  const leftTokens = new Set(toSlugTokens(left))
  const rightTokens = new Set(toSlugTokens(right))
  const sharedTokens = [...leftTokens].filter((token) => rightTokens.has(token)).length
  const maxTokenCount = Math.max(leftTokens.size, rightTokens.size, 1)
  const tokenScore = sharedTokens / maxTokenCount

  const distance = levenshteinDistance(left, right)
  const maxLength = Math.max(left.length, right.length, 1)
  const distanceScore = 1 - distance / maxLength

  return Number(((tokenScore * 0.65) + (distanceScore * 0.35)).toFixed(3))
}
