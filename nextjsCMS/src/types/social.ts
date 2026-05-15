export const SOCIAL_PLATFORMS = ['facebook', 'x', 'instagram', 'tiktok', 'youtube_shorts'] as const
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

export const SOCIAL_POST_TYPES = [
  'narrative',
  'checklist',
  'carousel',
  'opinion',
  'article_link',
  'question',
  'poll',
  'recap',
  'short_video',
] as const
export type SocialPostType = (typeof SOCIAL_POST_TYPES)[number]

export const SOCIAL_POST_STATUSES = [
  'planned',
  'drafting',
  'ready',
  'posted',
  'reviewed',
  'archived',
] as const
export type SocialPostStatus = (typeof SOCIAL_POST_STATUSES)[number]

export const SOCIAL_CAMPAIGN_STATUSES = [
  'planned',
  'in_progress',
  'completed',
  'archived',
] as const
export type SocialCampaignStatus = (typeof SOCIAL_CAMPAIGN_STATUSES)[number]

export const SOCIAL_SOURCE_TYPES = ['post', 'panduan', 'external', 'none'] as const
export type SocialSourceType = (typeof SOCIAL_SOURCE_TYPES)[number]

export const SOCIAL_CHECKLIST_KEYS = [
  'caption_done',
  'cta_done',
  'visual_prompt_done',
  'asset_done',
  'copied_done',
  'posted_done',
  'metrics_done',
] as const
export type SocialChecklistKey = (typeof SOCIAL_CHECKLIST_KEYS)[number]

export const CAROUSEL_IMAGE_STATUSES = [
  'needed',
  'prompt_ready',
  'generated',
  'uploaded',
  'approved',
] as const
export type CarouselImageStatus = (typeof CAROUSEL_IMAGE_STATUSES)[number]

export interface SocialCampaign {
  id: string
  user_id: string
  title: string
  theme: string | null
  platform: SocialPlatform
  start_date: string
  end_date: string
  primary_goal: string | null
  content_pillar: string | null
  tone_note: string | null
  status: SocialCampaignStatus
  created_at: string
  updated_at: string
}

export interface SocialPost {
  id: string
  campaign_id: string | null
  user_id: string
  platform: SocialPlatform
  post_type: SocialPostType
  title: string
  hook: string | null
  body: string | null
  cta: string | null
  target_url: string | null
  source_type: SocialSourceType
  source_id: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  timezone: string
  status: SocialPostStatus
  visual_prompt: string | null
  objective: string | null
  content_pillar: string | null
  caption_done: boolean
  cta_done: boolean
  visual_prompt_done: boolean
  asset_done: boolean
  copied_done: boolean
  posted_done: boolean
  metrics_done: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SocialCarouselSlide {
  id: string
  post_id: string
  user_id: string
  slide_number: number
  title_text: string
  paragraph_text: string | null
  visual_prompt: string | null
  image_status: CarouselImageStatus
  created_at: string
  updated_at: string
}

export interface SocialPostMetric {
  id: string
  post_id: string
  user_id: string
  recorded_at: string
  reach: number | null
  comments: number | null
  shares: number | null
  link_clicks: number | null
  notes: string | null
  next_action: string | null
  created_at: string
}

export interface SocialSourceOption {
  id: string
  type: Extract<SocialSourceType, 'post' | 'panduan'>
  title: string
  slug: string
  status: 'draft' | 'published'
  description: string | null
  content?: string | null
}

export interface SocialDashboardData {
  campaigns: SocialCampaign[]
  activeCampaign: SocialCampaign | null
  posts: SocialPost[]
  slides: SocialCarouselSlide[]
  metrics: SocialPostMetric[]
  sources: SocialSourceOption[]
}
