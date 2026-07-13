import type { SocialPost } from '@/types/social'

export function buildSocialCaption(
  post: Pick<SocialPost, 'hook' | 'body' | 'cta' | 'target_url'> & {
    target_url_with_utm?: string | null
  }
) {
  return [post.hook, post.body, post.cta, post.target_url_with_utm ?? post.target_url]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join('\n\n')
}

export function buildSocialTargetUrl(params: {
  targetUrl?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  baseUrl?: string
}) {
  const rawUrl = params.targetUrl?.trim()
  if (!rawUrl) return ''

  const baseUrl = params.baseUrl || 'https://arkaraweb.com'
  const isAbsolute = /^https?:\/\//i.test(rawUrl)

  try {
    const url = new URL(rawUrl, baseUrl)
    const source = params.utmSource?.trim()
    const medium = params.utmMedium?.trim()
    const campaign = params.utmCampaign?.trim()

    if (source) url.searchParams.set('utm_source', source)
    if (medium) url.searchParams.set('utm_medium', medium)
    if (campaign) url.searchParams.set('utm_campaign', campaign)

    if (isAbsolute) return url.toString()
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return rawUrl
  }
}

export function buildSocialCaptionWithUtm(
  post: Pick<SocialPost, 'hook' | 'body' | 'cta' | 'target_url' | 'utm_source' | 'utm_medium' | 'utm_campaign'>,
  baseUrl?: string
) {
  const targetUrlWithUtm = buildSocialTargetUrl({
    targetUrl: post.target_url,
    utmSource: post.utm_source,
    utmMedium: post.utm_medium,
    utmCampaign: post.utm_campaign,
    baseUrl,
  })

  return buildSocialCaption({
    ...post,
    target_url_with_utm: targetUrlWithUtm,
  })
}