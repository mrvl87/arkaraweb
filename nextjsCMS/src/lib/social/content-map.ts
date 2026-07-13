export interface SocialTitleSimilarityWarning {
  title: string
  matchedPostId: string
  matchedTitle: string
  similarity: number
}

function tokenizeTitle(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
}

export function calculateTitleSimilarity(left: string, right: string): number {
  const leftTokens = new Set(tokenizeTitle(left))
  const rightTokens = new Set(tokenizeTitle(right))

  if (leftTokens.size === 0 || rightTokens.size === 0) return 0

  let intersection = 0
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1
  }

  const union = new Set([...leftTokens, ...rightTokens]).size
  return union > 0 ? intersection / union : 0
}

export function findClosestTitleMatch(
  title: string,
  existingPosts: Array<{ id: string; title: string }>,
  threshold = 0.42
): SocialTitleSimilarityWarning | null {
  let best: SocialTitleSimilarityWarning | null = null

  for (const post of existingPosts) {
    const similarity = calculateTitleSimilarity(title, post.title)
    if (similarity < threshold) continue
    if (!best || similarity > best.similarity) {
      best = {
        title,
        matchedPostId: post.id,
        matchedTitle: post.title,
        similarity: Number(similarity.toFixed(2)),
      }
    }
  }

  return best
}

export function buildContentMapNotes(params: {
  strategyLabel: string
  angle: string
  audienceAction: string
  hookDirection: string
  visualDirection: string
  estimatedProductionComplexity: string
  sourceReference: string
}) {
  return [
    `Strategy: ${params.strategyLabel}`,
    `Angle: ${params.angle}`,
    `Audience action: ${params.audienceAction}`,
    `Hook direction: ${params.hookDirection}`,
    `Visual direction: ${params.visualDirection}`,
    `Production complexity: ${params.estimatedProductionComplexity}`,
    `Source reference: ${params.sourceReference}`,
  ].join('\n')
}