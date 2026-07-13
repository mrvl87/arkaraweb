import type { SocialPostMetric } from '@/types/social'

export interface SocialMetricRates {
  share_rate: number | null
  comment_rate: number | null
  click_rate: number | null
  interaction_rate: number | null
}

export interface SocialMetricTotals {
  post_count: number
  total_reach: number
  total_reactions: number
  total_comments: number
  total_shares: number
  total_link_clicks: number
  average_reach: number | null
  share_rate: number | null
  comment_rate: number | null
  click_rate: number | null
  interaction_rate: number | null
}

export function metricValue(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0
}

export function safeRate(numerator: number, denominator: number | null | undefined) {
  const safeDenominator = metricValue(denominator)
  if (safeDenominator <= 0) return null
  return numerator / safeDenominator
}

export function calculateSocialMetricRates(metric: Pick<SocialPostMetric, 'reach' | 'reactions' | 'comments' | 'shares' | 'link_clicks'>): SocialMetricRates {
  const reach = metricValue(metric.reach)
  const reactions = metricValue(metric.reactions)
  const comments = metricValue(metric.comments)
  const shares = metricValue(metric.shares)
  const linkClicks = metricValue(metric.link_clicks)

  return {
    share_rate: safeRate(shares, reach),
    comment_rate: safeRate(comments, reach),
    click_rate: safeRate(linkClicks, reach),
    interaction_rate: safeRate(reactions + comments + shares + linkClicks, reach),
  }
}

export function calculateSocialMetricTotals(metrics: Array<Pick<SocialPostMetric, 'reach' | 'reactions' | 'comments' | 'shares' | 'link_clicks'>>): SocialMetricTotals {
  const totals = metrics.reduce(
    (current, metric) => ({
      post_count: current.post_count + 1,
      total_reach: current.total_reach + metricValue(metric.reach),
      total_reactions: current.total_reactions + metricValue(metric.reactions),
      total_comments: current.total_comments + metricValue(metric.comments),
      total_shares: current.total_shares + metricValue(metric.shares),
      total_link_clicks: current.total_link_clicks + metricValue(metric.link_clicks),
    }),
    {
      post_count: 0,
      total_reach: 0,
      total_reactions: 0,
      total_comments: 0,
      total_shares: 0,
      total_link_clicks: 0,
    },
  )

  return {
    ...totals,
    average_reach: totals.post_count > 0 ? totals.total_reach / totals.post_count : null,
    share_rate: safeRate(totals.total_shares, totals.total_reach),
    comment_rate: safeRate(totals.total_comments, totals.total_reach),
    click_rate: safeRate(totals.total_link_clicks, totals.total_reach),
    interaction_rate: safeRate(
      totals.total_reactions + totals.total_comments + totals.total_shares + totals.total_link_clicks,
      totals.total_reach,
    ),
  }
}

export function formatSocialRate(value: number | null) {
  if (value === null || !Number.isFinite(value)) return 'N/A'
  return `${(value * 100).toFixed(2)}%`
}
