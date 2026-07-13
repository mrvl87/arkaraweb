"use server"

import { revalidatePath } from 'next/cache'
import sharp from 'sharp'
import { z } from 'zod'
import { findClosestTitleMatch, buildContentMapNotes } from '@/lib/social/content-map'
import { buildSocialCaptionWithUtm, buildSocialTargetUrl } from '@/lib/social/publish-pack'
import { normalizeHeuristicScores } from '@/lib/social/variants'
import { createStoredZip } from '@/lib/social/zip'
import { createClient } from '@/lib/supabase/server'
import { SocialVisualSpecSchema } from '@/lib/ai/schemas'
import { getPanduanPath, getPostPath } from '@/lib/slugs'
import {
  buildSocialAssetStoragePath,
  getNextSocialAssetVersion,
  getSocialAssetsBucket,
  renderSocialAsset,
} from '@/lib/social/render/render-social-asset'
import {
  generateFacebookCarousel,
  generateFacebookContentMap,
  generateFacebookVariants,
  generateSocialPerformanceReview,
  generateFacebookPost,
  generateFacebookVisualPrompt,
  generateFacebookWeeklyPlan,
} from '@/lib/ai/operations'
import {
  CONTENT_DERIVATIVE_POST_TYPES,
  SOCIAL_STRATEGY_PRESETS,
  getSocialStrategyPreset,
  isSocialStrategyPresetId,
  type SocialStrategyPresetId,
} from '@/lib/social/strategy-presets'
import type {
  SocialAsset,
  SocialAssetStatus,
  SocialCampaign,
  SocialCarouselSlide,
  SocialChecklistKey,
  SocialDashboardData,
  SocialPost,
  SocialLearning,
  SocialPostMetric,
  SocialPostType,
  SocialPostVariant,
  SocialPublication,
  SocialSourceOption,
} from '@/types/social'

const SITE_URL = process.env.FRONTEND_SITE_URL || 'https://arkaraweb.com'
const SOCIAL_PATH = '/cms/social'
const SOURCE_SUMMARY_LIMIT = 2200
const SOURCE_LIST_EXCERPT_LIMIT = 360
const TRUNCATION_SUFFIX = '\n\n[Konten dipotong untuk efisiensi token.]'
const SOCIAL_BACKGROUND_MAX_BYTES = 8 * 1024 * 1024
const SOCIAL_BACKGROUND_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'] as const

const campaignSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, 'Judul campaign wajib diisi.'),
  theme: z.string().trim().optional().default(''),
  platform: z.literal('facebook').default('facebook'),
  start_date: z.string().trim().min(1, 'Tanggal mulai wajib diisi.'),
  end_date: z.string().trim().min(1, 'Tanggal akhir wajib diisi.'),
  primary_goal: z.string().trim().optional().default(''),
  content_pillar: z.string().trim().optional().default(''),
  tone_note: z.string().trim().optional().default(''),
  status: z.enum(['planned', 'in_progress', 'completed', 'archived']).default('planned'),
})

const optionalTextSchema = z.preprocess(
  (value) => value ?? '',
  z.string().trim().optional().default('')
)

const socialPostSchema = z.object({
  id: z.string().uuid().optional(),
  campaign_id: z.string().uuid().nullable().optional(),
  platform: z.literal('facebook').default('facebook'),
  post_type: z.enum([
    'narrative',
    'editorial_poster',
    'checklist',
    'carousel',
    'myth_vs_fact',
    'scenario',
    'opinion',
    'article_link',
    'question',
    'poll',
    'recap',
    'short_video',
    'quote_statement',
  ]),
  title: z.string().trim().min(1, 'Judul post wajib diisi.'),
  hook: optionalTextSchema,
  body: optionalTextSchema,
  cta: optionalTextSchema,
  target_url: optionalTextSchema,
  source_type: z.enum(['post', 'panduan', 'external', 'none']).default('none'),
  source_id: z.string().uuid().nullable().optional(),
  scheduled_date: optionalTextSchema,
  scheduled_time: optionalTextSchema,
  timezone: z.string().trim().optional().default('Asia/Jayapura'),
  status: z.enum(['planned', 'drafting', 'ready', 'posted', 'reviewed', 'archived']).default('planned'),
  visual_prompt: optionalTextSchema,
  first_comment: optionalTextSchema,
  alt_text: optionalTextSchema,
  visual_spec: SocialVisualSpecSchema.nullable().optional().default(null),
  selected_template_id: optionalTextSchema,
  aspect_ratio: z.enum(['1:1', '4:5', '9:16']).default('1:1'),
  utm_source: z.string().trim().optional().default('facebook'),
  utm_medium: z.string().trim().optional().default('social'),
  utm_campaign: optionalTextSchema,
  objective: optionalTextSchema,
  content_pillar: optionalTextSchema,
  caption_done: z.boolean().default(false),
  cta_done: z.boolean().default(false),
  visual_prompt_done: z.boolean().default(false),
  asset_done: z.boolean().default(false),
  copied_done: z.boolean().default(false),
  posted_done: z.boolean().default(false),
  metrics_done: z.boolean().default(false),
  notes: optionalTextSchema,
})

const carouselSlideSchema = z.object({
  id: z.string().uuid().optional(),
  post_id: z.string().uuid(),
  slide_number: z.number().int().min(1),
  purpose: z.string().trim().optional().default(''),
  title_text: z.string().trim().min(1, 'Judul slide wajib diisi.'),
  paragraph_text: z.string().trim().optional().default(''),
  visual_prompt: z.string().trim().optional().default(''),
  visual_spec: SocialVisualSpecSchema.nullable().optional().default(null),
  image_status: z.enum(['needed', 'prompt_ready', 'generated', 'uploaded', 'approved']).default('needed'),
})

const manualPublicationSchema = z.object({
  post_id: z.string().uuid(),
  facebook_url: optionalTextSchema,
  published_at: optionalTextSchema,
  notes: optionalTextSchema,
})
const metricsSchema = z.object({
  post_id: z.string().uuid(),
  reach: z.coerce.number().int().min(0).nullable().optional(),
  reactions: z.coerce.number().int().min(0).nullable().optional(),
  comments: z.coerce.number().int().min(0).nullable().optional(),
  shares: z.coerce.number().int().min(0).nullable().optional(),
  link_clicks: z.coerce.number().int().min(0).nullable().optional(),
  video_views: z.coerce.number().int().min(0).nullable().optional(),
  average_watch_time_seconds: z.coerce.number().min(0).nullable().optional(),
  followers_gained: z.coerce.number().int().min(0).nullable().optional(),
  metric_window_hours: z.coerce.number().int().positive().nullable().optional(),
  source: z.enum(['manual', 'csv', 'screenshot']).default('manual'),
  notes: z.string().trim().optional().default(''),
  next_action: z.string().trim().optional().default(''),
})

const learningStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['approved', 'rejected', 'archived']),
})

const performanceReviewSchema = z.object({
  campaign_id: z.string().uuid(),
  start_date: optionalTextSchema,
  end_date: optionalTextSchema,
  save_to_notes: z.boolean().optional().default(false),
})

const strategyPresetSchema = z.string().trim().refine(isSocialStrategyPresetId, 'Strategy preset tidak valid.')
const contentDerivativePostTypeSchema = z.enum([
  'narrative',
  'editorial_poster',
  'checklist',
  'carousel',
  'myth_vs_fact',
  'scenario',
  'opinion',
  'article_link',
  'question',
  'poll',
  'recap',
  'short_video',
  'quote_statement',
])

const generateContentMapSchema = z.object({
  campaign_id: z.string().uuid(),
  strategy_id: strategyPresetSchema,
  source_keys: z.array(z.string().trim().min(1)).min(1, 'Pilih minimal satu source.').max(6),
  desired_count: z.coerce.number().int().min(3).max(12),
  start_date: z.string().trim().min(1, 'Tanggal mulai wajib diisi.'),
  end_date: optionalTextSchema,
  editor_notes: optionalTextSchema,
  previous_campaign_summary: optionalTextSchema,
})

const selectedContentMapItemSchema = z.object({
  selected: z.boolean().default(true),
  title: z.string().trim().min(1).max(180),
  angle: z.string().trim().min(1).max(500),
  post_type: contentDerivativePostTypeSchema,
  objective: z.string().trim().min(1).max(180),
  audience_action: z.string().trim().min(1).max(240),
  source_reference: z.string().trim().min(1).max(240),
  suggested_publishing_order: z.coerce.number().int().min(1).max(12),
  hook_direction: z.string().trim().min(1).max(240),
  visual_direction: z.string().trim().min(1).max(320),
  estimated_production_complexity: z.enum(['low', 'medium', 'high']),
})

const createSelectedContentMapPostsSchema = z.object({
  campaign_id: z.string().uuid(),
  strategy_id: strategyPresetSchema,
  start_date: z.string().trim().min(1, 'Tanggal mulai wajib diisi.'),
  end_date: optionalTextSchema,
  source_keys: z.array(z.string().trim().min(1)).max(6).default([]),
  items: z.array(selectedContentMapItemSchema).min(1).max(12),
})

const socialVariantTypeSchema = z.enum([
  'hook',
  'headline',
  'caption',
  'cta',
  'first_comment',
  'visual_direction',
])

const generateVariantsSchema = z.object({
  post_id: z.string().uuid(),
  variant_type: socialVariantTypeSchema,
  desired_count: z.coerce.number().int().min(1).max(8).default(5),
  tone: optionalTextSchema,
  historical_learnings: optionalTextSchema,
})

const updateVariantSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(80),
  content: z.string().trim().min(1).max(5000),
})

const selectVariantSchema = z.object({
  id: z.string().uuid(),
})

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return { supabase, user }
}

function compactContent(value?: string | null, limit = SOURCE_SUMMARY_LIMIT) {
  const content = (value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (content.length <= limit) return content

  const availableLength = Math.max(0, limit - TRUNCATION_SUFFIX.length)
  return `${content.slice(0, availableLength).trimEnd()}${TRUNCATION_SUFFIX}`
}

function buildSourceSummary(parts: Array<string | null | undefined>, limit = SOURCE_SUMMARY_LIMIT) {
  return compactContent(parts.filter(Boolean).join('\n\n'), limit) || undefined
}

function nullIfEmpty(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function visualSpecPostPatch(visualSpec: z.infer<typeof SocialVisualSpecSchema> | null | undefined) {
  if (!visualSpec) return {}

  return {
    visual_spec: visualSpec,
    visual_prompt: visualSpec.scene_prompt,
    alt_text: visualSpec.alt_text,
    selected_template_id: visualSpec.template_id,
    aspect_ratio: visualSpec.aspect_ratio,
  }
}

function makeServerBlankVisualSpec(post: Pick<SocialPost, 'title' | 'aspect_ratio'>): z.infer<typeof SocialVisualSpecSchema> {
  return {
    template_id: 'editorial-opinion-v1',
    aspect_ratio: post.aspect_ratio || '1:1',
    scene_prompt: 'Editorial illustration of a realistic Indonesian household preparedness scene, calm cinematic lighting, detailed painterly graphic novel style, clear empty space for CMS overlay.',
    label: 'RUMAH SIAGA',
    headline: (post.title || 'Headline visual').slice(0, 90),
    subheadline: 'Ringkasan visual singkat untuk poster Facebook Arkara.',
    information_blocks: [
      { title: 'Poin 1', text: 'Tulis poin visual pertama.' },
      { title: 'Poin 2', text: 'Tulis poin visual kedua.' },
    ],
    emphasis_text: 'Kalimat penekanan singkat.',
    footer: 'ArkaraWeb.com | Survive with Knowledge',
    alt_text: 'Ilustrasi rumah tangga Indonesia sesuai topik post Arkara.',
  }
}

function buildVariantPostPatch(post: SocialPost, variant: Pick<SocialPostVariant, 'variant_type' | 'content'>) {
  const content = variant.content.trim()

  switch (variant.variant_type) {
    case 'hook':
      return { hook: content }
    case 'caption':
      return { body: content, caption_done: true }
    case 'cta':
      return { cta: content, cta_done: true }
    case 'first_comment':
      return { first_comment: content }
    case 'visual_direction':
      return { visual_prompt: content, visual_prompt_done: true }
    case 'headline': {
      const visualSpec = post.visual_spec ?? makeServerBlankVisualSpec(post)
      const nextVisualSpec = { ...visualSpec, headline: content.slice(0, 90) }
      return {
        visual_spec: nextVisualSpec,
        selected_template_id: nextVisualSpec.template_id,
        aspect_ratio: nextVisualSpec.aspect_ratio,
        alt_text: nextVisualSpec.alt_text,
      }
    }
    default:
      return {}
  }
}

type SocialSupabaseClient = Awaited<ReturnType<typeof createClient>>

async function getLatestSocialBackground(params: {
  supabase: SocialSupabaseClient
  userId: string
  postId: string
  slideId?: string | null
}) {
  const { supabase, userId, postId, slideId } = params

  if (slideId) {
    const { data: slideBackground } = await supabase
      .from('social_assets')
      .select('storage_path, mime_type')
      .eq('user_id', userId)
      .eq('slide_id', slideId)
      .eq('asset_type', 'background')
      .in('status', ['ready', 'approved'])
      .order('version', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (slideBackground?.storage_path) return slideBackground as { storage_path: string; mime_type: string | null }
  }

  const { data: postBackground } = await supabase
    .from('social_assets')
    .select('storage_path, mime_type')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .is('slide_id', null)
    .eq('asset_type', 'background')
    .in('status', ['ready', 'approved'])
    .order('version', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return postBackground?.storage_path
    ? postBackground as { storage_path: string; mime_type: string | null }
    : null
}

async function downloadSocialBackground(
  supabase: SocialSupabaseClient,
  background: { storage_path: string; mime_type: string | null } | null
) {
  if (!background) return { buffer: null, mimeType: null, warning: null }

  const { data, error } = await supabase.storage
    .from(getSocialAssetsBucket())
    .download(background.storage_path)

  if (error || !data) {
    return {
      buffer: null,
      mimeType: null,
      warning: `Background asset could not be loaded: ${error?.message || 'unknown error'}.`,
    }
  }

  return {
    buffer: Buffer.from(await data.arrayBuffer()),
    mimeType: background.mime_type,
    warning: null,
  }
}

async function getNextAssetVersion(params: {
  supabase: SocialSupabaseClient
  userId: string
  postId: string
  assetType: SocialAsset['asset_type']
  slideId?: string | null
}) {
  let query = params.supabase
    .from('social_assets')
    .select('version')
    .eq('user_id', params.userId)
    .eq('post_id', params.postId)
    .eq('asset_type', params.assetType)

  if (params.slideId) {
    query = query.eq('slide_id', params.slideId)
  } else {
    query = query.is('slide_id', null)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  return getNextSocialAssetVersion((data ?? []).map((row) => row.version as number | null))
}

async function uploadRenderedSocialAsset(params: {
  supabase: SocialSupabaseClient
  userId: string
  postId: string
  slideId?: string | null
  assetType: SocialAsset['asset_type']
  png: Buffer
  width: number
  height: number
  aspectRatio: SocialPost['aspect_ratio']
  templateId: string
  generationPrompt: string
  warnings: string[]
}) {
  const version = await getNextAssetVersion({
    supabase: params.supabase,
    userId: params.userId,
    postId: params.postId,
    assetType: params.assetType,
    slideId: params.slideId,
  })
  const storagePath = buildSocialAssetStoragePath({
    userId: params.userId,
    postId: params.postId,
    assetKind: params.assetType === 'poster' ? 'poster' : 'carousel-slide',
    slideId: params.slideId,
    version,
  })

  const { error: uploadError } = await params.supabase.storage
    .from(getSocialAssetsBucket())
    .upload(storagePath, params.png, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: false,
    })

  if (uploadError) throw new Error(uploadError.message)

  const { error: assetError } = await params.supabase.from('social_assets').insert({
    user_id: params.userId,
    post_id: params.postId,
    slide_id: params.slideId ?? null,
    asset_type: params.assetType,
    storage_path: storagePath,
    mime_type: 'image/png',
    width: params.width,
    height: params.height,
    aspect_ratio: params.aspectRatio,
    template_id: params.templateId,
    version,
    generation_prompt: params.generationPrompt,
    metadata: { render_warnings: params.warnings },
    status: 'ready',
  })

  if (assetError) throw new Error(assetError.message)

  return { storagePath, version }
}

function getBackgroundExtension(mimeType: string) {
  switch (mimeType.toLowerCase()) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    default:
      return 'bin'
  }
}

function getNearestSocialAspectRatio(width?: number | null, height?: number | null): SocialPost['aspect_ratio'] | null {
  if (!width || !height) return null
  const ratio = width / height
  const candidates: Array<{ value: SocialPost['aspect_ratio']; ratio: number }> = [
    { value: '1:1', ratio: 1 },
    { value: '4:5', ratio: 4 / 5 },
    { value: '9:16', ratio: 9 / 16 },
  ]
  const match = candidates
    .map((candidate) => ({ ...candidate, delta: Math.abs(candidate.ratio - ratio) }))
    .sort((left, right) => left.delta - right.delta)[0]

  return match && match.delta <= 0.04 ? match.value : null
}

async function assertOwnedSocialAssetTarget(params: {
  supabase: SocialSupabaseClient
  userId: string
  postId: string
  slideId?: string | null
}) {
  const { data: post, error: postError } = await params.supabase
    .from('social_posts')
    .select('id')
    .eq('id', params.postId)
    .eq('user_id', params.userId)
    .single()

  if (postError || !post) throw new Error(postError?.message || 'Post tidak ditemukan.')

  if (!params.slideId) return

  const { data: slide, error: slideError } = await params.supabase
    .from('social_carousel_slides')
    .select('id')
    .eq('id', params.slideId)
    .eq('post_id', params.postId)
    .eq('user_id', params.userId)
    .single()

  if (slideError || !slide) throw new Error(slideError?.message || 'Slide tidak ditemukan.')
}

async function getSelectedSocialBackground(params: {
  supabase: SocialSupabaseClient
  userId: string
  postId: string
  slideId?: string | null
  backgroundAssetId?: string | null
}) {
  if (!params.backgroundAssetId) {
    return getLatestSocialBackground(params)
  }

  let query = params.supabase
    .from('social_assets')
    .select('storage_path, mime_type')
    .eq('id', params.backgroundAssetId)
    .eq('user_id', params.userId)
    .eq('post_id', params.postId)
    .eq('asset_type', 'background')
    .in('status', ['ready', 'approved'])

  if (params.slideId) {
    query = query.eq('slide_id', params.slideId)
  } else {
    query = query.is('slide_id', null)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw new Error(error.message)

  return data?.storage_path ? data as { storage_path: string; mime_type: string | null } : null
}
async function getSourceByPost(
  supabase: Awaited<ReturnType<typeof createClient>>,
  post: Pick<SocialPost, 'source_type' | 'source_id' | 'target_url'>
) {
  if (!post.source_id || (post.source_type !== 'post' && post.source_type !== 'panduan')) {
    return null
  }

  if (post.source_type === 'post') {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, slug, status, description, content')
      .eq('id', post.source_id)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    const path = getPostPath(data.slug)

    return {
      title: data.title as string,
      summary: buildSourceSummary([
        data.description as string | null,
        data.content as string | null,
      ]),
      url: post.target_url || `${SITE_URL}${path}`,
    }
  }

  const { data, error } = await supabase
    .from('panduan')
    .select('id, title, slug, status, meta_desc, quick_answer, content')
    .eq('id', post.source_id)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const path = getPanduanPath(data.slug)

  return {
    title: data.title as string,
    summary: buildSourceSummary([
      data.meta_desc as string | null,
      data.quick_answer as string | null,
      data.content as string | null,
    ]),
    url: post.target_url || `${SITE_URL}${path}`,
  }
}

function parseSocialSourceKey(sourceKey?: string): { type: SocialSourceOption['type']; id: string } | null {
  const trimmed = sourceKey?.trim()
  if (!trimmed) return null

  const [type, id] = trimmed.split(':')

  if ((type !== 'post' && type !== 'panduan') || !id) {
    throw new Error('Format sumber konten tidak valid.')
  }

  return { type, id }
}

async function getPlanSourceByKey(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sourceKey?: string
): Promise<SocialSourceOption | null> {
  const parsed = parseSocialSourceKey(sourceKey)
  if (!parsed) return null

  if (parsed.type === 'post') {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, slug, status, description, content')
      .eq('id', parsed.id)
      .maybeSingle()

    if (error) {
      throw new Error(`Gagal memuat post sumber: ${error.message}`)
    }

    if (!data) return null

    return {
      id: data.id as string,
      type: 'post',
      title: data.title as string,
      slug: data.slug as string,
      status: data.status === 'published' ? 'published' : 'draft',
      description: compactContent(data.description as string | null, SOURCE_LIST_EXCERPT_LIMIT) || null,
      content: compactContent(data.content as string | null),
    }
  }

  const { data, error } = await supabase
    .from('panduan')
    .select('id, title, slug, status, meta_desc, content')
    .eq('id', parsed.id)
    .maybeSingle()

  if (error) {
    throw new Error(`Gagal memuat panduan sumber: ${error.message}`)
  }

  if (!data) return null

  return {
    id: data.id as string,
    type: 'panduan',
    title: data.title as string,
    slug: data.slug as string,
    status: data.status === 'published' ? 'published' : 'draft',
    description: compactContent(data.meta_desc as string | null, SOURCE_LIST_EXCERPT_LIMIT) || null,
    content: compactContent(data.content as string | null),
  }
}

function buildSocialSourceUrl(source: SocialSourceOption) {
  return source.type === 'post'
    ? `${SITE_URL}${getPostPath(source.slug)}`
    : `${SITE_URL}${getPanduanPath(source.slug)}`
}

async function getPlanSourcesByKeys(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sourceKeys: string[]
): Promise<SocialSourceOption[]> {
  const uniqueKeys = [...new Set(sourceKeys.map((key) => key.trim()).filter(Boolean))]
  const sources: SocialSourceOption[] = []

  for (const key of uniqueKeys) {
    const source = await getPlanSourceByKey(supabase, key)
    if (source) sources.push(source)
  }

  return sources
}

function learningContextRow(learning: SocialLearning) {
  return {
    scope_type: learning.scope_type,
    title: learning.title,
    observation: learning.observation,
    recommendation: learning.recommendation,
    evidence_count: learning.evidence_count,
    confidence: learning.confidence,
  }
}

function learningRelevanceScore(learning: SocialLearning, context: {
  campaignId?: string | null
  campaignGoal?: string | null
  contentPillar?: string | null
  postType?: string | null
  templateId?: string | null
  publishingTime?: string | null
}) {
  let score = learning.confidence === 'high' ? 30 : learning.confidence === 'medium' ? 20 : 10
  score += Math.min(learning.evidence_count, 20)
  if (learning.scope_type === 'global') score += 4
  if (learning.scope_type === 'campaign' && context.campaignId && learning.scope_id === context.campaignId) score += 40
  if (learning.scope_type === 'content_pillar' && context.contentPillar && learning.title.toLowerCase().includes(context.contentPillar.toLowerCase())) score += 25
  if (learning.scope_type === 'post_type' && context.postType && learning.title.toLowerCase().includes(context.postType.replace(/_/g, ' ').toLowerCase())) score += 25
  if (learning.scope_type === 'template' && context.templateId && learning.title.toLowerCase().includes(context.templateId.toLowerCase())) score += 25
  if (learning.scope_type === 'publishing_time' && context.publishingTime && learning.title.toLowerCase().includes(context.publishingTime.toLowerCase())) score += 25
  if (context.campaignGoal && `${learning.title} ${learning.observation} ${learning.recommendation}`.toLowerCase().includes(context.campaignGoal.toLowerCase())) score += 8
  return score
}

async function getRelevantApprovedSocialLearnings(
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase'],
  userId: string,
  context: {
    campaignId?: string | null
    campaignGoal?: string | null
    contentPillar?: string | null
    postType?: string | null
    templateId?: string | null
    publishingTime?: string | null
  },
) {
  const { data, error } = await supabase
    .from('social_learnings')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) throw new Error(error.message)

  return ((data ?? []) as SocialLearning[])
    .sort((left, right) => learningRelevanceScore(right, context) - learningRelevanceScore(left, context))
    .slice(0, 8)
    .map(learningContextRow)
}

function buildStrategyBrief(strategyId: SocialStrategyPresetId) {
  const preset = getSocialStrategyPreset(strategyId)
  return [
    `Primary goal: ${preset.primaryGoal}`,
    `Recommended post type mix: ${preset.recommendedPostTypeMix.join(', ')}`,
    `Recommended count: ${preset.recommendedCount}`,
    `Suggested CTA style: ${preset.suggestedCtaStyle}`,
    `Suggested content depth: ${preset.suggestedContentDepth}`,
    `Suggested visual style: ${preset.suggestedVisualStyle}`,
    `Expected audience action: ${preset.expectedAudienceAction}`,
    `Allowed derivative types: ${CONTENT_DERIVATIVE_POST_TYPES.join(', ')}`,
  ].join('\n')
}

function getScheduledDateForOrder(startDate: string, endDate: string | null, order: number) {
  const start = new Date(`${startDate}T00:00:00Z`)
  if (Number.isNaN(start.getTime())) return startDate

  const target = new Date(start)
  target.setUTCDate(start.getUTCDate() + Math.max(0, order - 1))

  if (endDate) {
    const end = new Date(`${endDate}T00:00:00Z`)
    if (!Number.isNaN(end.getTime()) && target > end) {
      return end.toISOString().slice(0, 10)
    }
  }

  return target.toISOString().slice(0, 10)
}

function resolveContentMapSourceForItem(
  item: z.infer<typeof selectedContentMapItemSchema>,
  sources: SocialSourceOption[]
) {
  if (sources.length === 0) return null
  if (sources.length === 1) return sources[0]

  const reference = item.source_reference.toLowerCase()
  return sources.find((source) => reference.includes(source.title.toLowerCase())) ?? null
}

async function validateReadyState(params: {
  supabase: Awaited<ReturnType<typeof createClient>>
  post: z.infer<typeof socialPostSchema>
  postId?: string
}) {
  const { supabase, post, postId } = params

  if (post.status !== 'ready' && post.status !== 'posted') {
    return
  }

  if (!post.body.trim()) {
    throw new Error('Caption wajib diisi sebelum post bisa Ready atau Posted.')
  }

  if (post.status === 'posted' && (!post.scheduled_date || !post.scheduled_time)) {
    throw new Error('Tanggal dan jam wajib diisi sebelum post ditandai Posted.')
  }

  if (post.post_type === 'article_link' && !post.target_url.trim()) {
    throw new Error('Target URL wajib diisi untuk Article Link.')
  }

  if (post.post_type !== 'carousel' || !postId) {
    return
  }

  const { data: slides, error } = await supabase
    .from('social_carousel_slides')
    .select('title_text, visual_prompt')
    .eq('post_id', postId)

  if (error) {
    throw new Error(error.message)
  }

  if ((slides ?? []).length < 3) {
    throw new Error('Carousel butuh minimal 3 slide sebelum Ready atau Posted.')
  }

  const incomplete = (slides ?? []).some((slide) => !slide.title_text || !slide.visual_prompt)
  if (incomplete) {
    throw new Error('Semua slide carousel harus punya title text dan visual prompt.')
  }
}

export async function getSocialDashboardData(campaignId?: string): Promise<SocialDashboardData> {
  const { supabase, user } = await requireUser()

  const [{ data: campaigns, error: campaignError }, { data: posts }, { data: panduan }] = await Promise.all([
    supabase
      .from('social_campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false }),
    supabase
      .from('posts')
      .select('id, title, slug, status, description')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(80),
    supabase
      .from('panduan')
      .select('id, title, slug, status, meta_desc')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(80),
  ])

  if (campaignError) {
    throw new Error(campaignError.message)
  }

  const campaignRows = (campaigns ?? []) as SocialCampaign[]
  const activeCampaign =
    campaignRows.find((campaign) => campaign.id === campaignId) ??
    campaignRows.find((campaign) => campaign.status !== 'archived') ??
    campaignRows[0] ??
    null

  const [
    { data: socialPosts, error: postError },
    { data: analyticsPosts, error: analyticsPostError },
    { data: slides, error: slideError },
    { data: metrics, error: metricsError },
    { data: assets, error: assetError },
    { data: publications, error: publicationError },
    { data: variants, error: variantError },
    { data: learnings, error: learningError },
  ] = activeCampaign
    ? await Promise.all([
        supabase
          .from('social_posts')
          .select('*')
          .eq('user_id', user.id)
          .eq('campaign_id', activeCampaign.id)
          .order('scheduled_date', { ascending: true, nullsFirst: false })
          .order('scheduled_time', { ascending: true, nullsFirst: false }),
        supabase
          .from('social_posts')
          .select('*')
          .eq('user_id', user.id)
          .order('scheduled_date', { ascending: false, nullsFirst: false })
          .order('scheduled_time', { ascending: false, nullsFirst: false }),
        supabase
          .from('social_carousel_slides')
          .select('*')
          .eq('user_id', user.id)
          .order('slide_number', { ascending: true }),
        supabase
          .from('social_post_metrics')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false }),
        supabase
          .from('social_assets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('social_publications')
          .select('*')
          .eq('user_id', user.id)
          .order('published_at', { ascending: false }),
        supabase
          .from('social_post_variants')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('social_learnings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ]

  if (postError) throw new Error(postError.message)
  if (analyticsPostError) throw new Error(analyticsPostError.message)
  if (slideError) throw new Error(slideError.message)
  if (metricsError) throw new Error(metricsError.message)
  if (assetError) throw new Error(assetError.message)
  if (publicationError) throw new Error(publicationError.message)
  if (variantError) throw new Error(variantError.message)
  if (learningError) throw new Error(learningError.message)

  const campaignPostIds = new Set(((socialPosts ?? []) as SocialPost[]).map((post) => post.id))
  const campaignSlideIds = new Set(
    ((slides ?? []) as SocialCarouselSlide[])
      .filter((slide) => campaignPostIds.has(slide.post_id))
      .map((slide) => slide.id)
  )

  const sources: SocialSourceOption[] = [
    ...((posts ?? []) as Array<any>).map((post) => ({
      id: post.id,
      type: 'post' as const,
      title: post.title,
      slug: post.slug,
      status: post.status,
      description: compactContent(post.description ?? null, SOURCE_LIST_EXCERPT_LIMIT) || null,
      content: null,
    })),
    ...((panduan ?? []) as Array<any>).map((item) => ({
      id: item.id,
      type: 'panduan' as const,
      title: item.title,
      slug: item.slug,
      status: item.status,
      description: compactContent(item.meta_desc ?? null, SOURCE_LIST_EXCERPT_LIMIT) || null,
      content: null,
    })),
  ]

  return {
    campaigns: campaignRows,
    activeCampaign,
    posts: (socialPosts ?? []) as SocialPost[],
    slides: ((slides ?? []) as SocialCarouselSlide[]).filter((slide) => campaignPostIds.has(slide.post_id)),
    metrics: ((metrics ?? []) as SocialPostMetric[]).filter((metric) => campaignPostIds.has(metric.post_id)),
    assets: ((assets ?? []) as SocialAsset[]).filter((asset) =>
      (asset.post_id ? campaignPostIds.has(asset.post_id) : false) ||
      (asset.slide_id ? campaignSlideIds.has(asset.slide_id) : false)
    ),
    publications: ((publications ?? []) as SocialPublication[]).filter((publication) => campaignPostIds.has(publication.post_id)),
    variants: ((variants ?? []) as SocialPostVariant[]).filter((variant) => campaignPostIds.has(variant.post_id)),
    learnings: (learnings ?? []) as SocialLearning[],
    analyticsPosts: (analyticsPosts ?? []) as SocialPost[],
    analyticsMetrics: (metrics ?? []) as SocialPostMetric[],
    analyticsAssets: (assets ?? []) as SocialAsset[],
    analyticsPublications: (publications ?? []) as SocialPublication[],
    sources,
  }
}

export async function createCampaign(rawInput: z.infer<typeof campaignSchema>) {
  const { supabase, user } = await requireUser()
  const input = campaignSchema.parse(rawInput)

  const { error } = await supabase.from('social_campaigns').insert({
    ...input,
    user_id: user.id,
    theme: nullIfEmpty(input.theme),
    primary_goal: nullIfEmpty(input.primary_goal),
    content_pillar: nullIfEmpty(input.content_pillar),
    tone_note: nullIfEmpty(input.tone_note),
  })

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function updateCampaign(rawInput: z.infer<typeof campaignSchema>) {
  const { supabase, user } = await requireUser()
  const input = campaignSchema.parse(rawInput)

  if (!input.id) return { error: 'Campaign id wajib ada.' }

  const { id, ...data } = input
  const { error } = await supabase
    .from('social_campaigns')
    .update({
      ...data,
      theme: nullIfEmpty(data.theme),
      primary_goal: nullIfEmpty(data.primary_goal),
      content_pillar: nullIfEmpty(data.content_pillar),
      tone_note: nullIfEmpty(data.tone_note),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function deleteCampaign(id: string) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('social_campaigns')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function createExampleSocialCampaign() {
  const { supabase, user } = await requireUser()
  const { data: existing } = await supabase
    .from('social_campaigns')
    .select('id')
    .eq('user_id', user.id)
    .eq('title', 'Rumah Siaga 72 Jam')
    .maybeSingle()

  if (existing) {
    return { success: true, campaignId: existing.id as string }
  }

  const { data: campaign, error } = await supabase
    .from('social_campaigns')
    .insert({
      user_id: user.id,
      title: 'Rumah Siaga 72 Jam',
      theme: 'Membantu keluarga urban Indonesia memahami buffer dasar 72 jam saat listrik, air, pangan, dan komunikasi terganggu.',
      platform: 'facebook',
      start_date: '2026-05-11',
      end_date: '2026-05-17',
      primary_goal: 'Trust-building dan edukasi dasar',
      content_pillar: 'Krisis Rumah Tangga',
      tone_note: 'Dekat, praktis, serius, tidak panik',
      status: 'in_progress',
    })
    .select('id')
    .single()

  if (error || !campaign) {
    return { error: error?.message || 'Gagal membuat campaign contoh.' }
  }

  const posts = [
    ['2026-05-11', '18:30', 'narrative', 'Kalau listrik padam malam ini, rumah Anda tahan berapa jam?'],
    ['2026-05-12', '11:30', 'checklist', '10 benda kecil yang sering lebih berguna daripada alat mahal saat krisis'],
    ['2026-05-13', '18:30', 'carousel', '24 Jam Tanpa Listrik: Apa yang Paling Dulu Rusak di Rumah?'],
    ['2026-05-14', '07:00', 'opinion', 'Persiapan bukan paranoia. Persiapan adalah manajemen risiko keluarga.'],
    ['2026-05-15', '19:00', 'article_link', 'Jangan menunggu krisis besar. Banyak rumah lumpuh oleh gangguan kecil yang berlangsung lama.'],
    ['2026-05-16', '10:00', 'question', 'Audit kecil akhir pekan: rumah Anda paling lemah di bagian mana?'],
    ['2026-05-17', '18:00', 'recap', 'Satu minggu ini cukup untuk mulai membuat rumah lebih siap.'],
  ] as const

  const { error: postError } = await supabase.from('social_posts').insert(
    posts.map(([scheduled_date, scheduled_time, post_type, title]) => ({
      user_id: user.id,
      campaign_id: campaign.id,
      platform: 'facebook',
      post_type,
      title,
      scheduled_date,
      scheduled_time,
      timezone: 'Asia/Jayapura',
      status: 'planned',
      content_pillar: 'Krisis Rumah Tangga',
    }))
  )

  if (postError) return { error: postError.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true, campaignId: campaign.id as string }
}

export async function createSocialPost(rawInput: z.infer<typeof socialPostSchema>) {
  const { supabase, user } = await requireUser()
  const input = socialPostSchema.parse(rawInput)

  await validateReadyState({ supabase, post: input })

  const { id: _ignoredId, ...data } = input
  const { error } = await supabase.from('social_posts').insert({
    ...data,
    user_id: user.id,
    campaign_id: data.campaign_id || null,
    hook: nullIfEmpty(data.hook),
    body: nullIfEmpty(data.body),
    cta: nullIfEmpty(data.cta),
    target_url: nullIfEmpty(data.target_url),
    source_id: data.source_type === 'none' || data.source_type === 'external' ? null : data.source_id ?? null,
    scheduled_date: nullIfEmpty(data.scheduled_date),
    scheduled_time: nullIfEmpty(data.scheduled_time),
    visual_prompt: data.visual_spec?.scene_prompt ?? nullIfEmpty(data.visual_prompt),
    first_comment: nullIfEmpty(data.first_comment),
    alt_text: data.visual_spec?.alt_text ?? nullIfEmpty(data.alt_text),
    visual_spec: data.visual_spec ?? null,
    selected_template_id: data.visual_spec?.template_id ?? nullIfEmpty(data.selected_template_id),
    aspect_ratio: data.visual_spec?.aspect_ratio ?? data.aspect_ratio,
    utm_source: nullIfEmpty(data.utm_source) ?? 'facebook',
    utm_medium: nullIfEmpty(data.utm_medium) ?? 'social',
    utm_campaign: nullIfEmpty(data.utm_campaign),
    objective: nullIfEmpty(data.objective),
    content_pillar: nullIfEmpty(data.content_pillar),
    notes: nullIfEmpty(data.notes),
  })

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function updateSocialPost(rawInput: z.infer<typeof socialPostSchema>) {
  const { supabase, user } = await requireUser()
  const input = socialPostSchema.parse(rawInput)

  if (!input.id) return { error: 'Post id wajib ada.' }

  await validateReadyState({ supabase, post: input, postId: input.id })

  const { id, ...data } = input
  const { error } = await supabase
    .from('social_posts')
    .update({
      ...data,
      campaign_id: data.campaign_id || null,
      hook: nullIfEmpty(data.hook),
      body: nullIfEmpty(data.body),
      cta: nullIfEmpty(data.cta),
      target_url: nullIfEmpty(data.target_url),
      source_id: data.source_type === 'none' || data.source_type === 'external' ? null : data.source_id ?? null,
      scheduled_date: nullIfEmpty(data.scheduled_date),
      scheduled_time: nullIfEmpty(data.scheduled_time),
      visual_prompt: data.visual_spec?.scene_prompt ?? nullIfEmpty(data.visual_prompt),
    first_comment: nullIfEmpty(data.first_comment),
    alt_text: data.visual_spec?.alt_text ?? nullIfEmpty(data.alt_text),
    visual_spec: data.visual_spec ?? null,
    selected_template_id: data.visual_spec?.template_id ?? nullIfEmpty(data.selected_template_id),
    aspect_ratio: data.visual_spec?.aspect_ratio ?? data.aspect_ratio,
      utm_source: nullIfEmpty(data.utm_source) ?? 'facebook',
      utm_medium: nullIfEmpty(data.utm_medium) ?? 'social',
      utm_campaign: nullIfEmpty(data.utm_campaign),
      objective: nullIfEmpty(data.objective),
      content_pillar: nullIfEmpty(data.content_pillar),
      notes: nullIfEmpty(data.notes),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function deleteSocialPost(id: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('social_posts').delete().eq('id', id).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function updatePostStatus(id: string, status: SocialPost['status']) {
  if (status === 'posted') return { error: 'Gunakan Publish Pack untuk Mark as Posted agar publication snapshot tersimpan.' }
  const { supabase, user } = await requireUser()
  const { data: post, error: loadError } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (loadError || !post) return { error: loadError?.message || 'Post tidak ditemukan.' }

  const nextPost = { ...(post as SocialPost), status }
  await validateReadyState({ supabase, post: socialPostSchema.parse(nextPost), postId: id })

  const { error } = await supabase.from('social_posts').update({ status }).eq('id', id).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function togglePostChecklistItem(id: string, key: SocialChecklistKey, value: boolean) {
  const { supabase, user } = await requireUser()
  const allowed: SocialChecklistKey[] = [
    'caption_done',
    'cta_done',
    'visual_prompt_done',
    'asset_done',
    'copied_done',
    'posted_done',
    'metrics_done',
  ]

  if (!allowed.includes(key)) return { error: 'Checklist tidak valid.' }

  const { error } = await supabase
    .from('social_posts')
    .update({ [key]: value })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function copyPostCaptionMark(id: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('social_posts')
    .update({ copied_done: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function markPostPosted(_id: string) {
  return { error: 'Gunakan Publish Pack untuk Mark as Posted agar publication snapshot tersimpan.' }
}

export async function createCarouselSlide(rawInput: z.infer<typeof carouselSlideSchema>) {
  const { supabase, user } = await requireUser()
  const input = carouselSlideSchema.parse(rawInput)

  const { error } = await supabase.from('social_carousel_slides').insert({
    ...input,
    user_id: user.id,
    purpose: nullIfEmpty(input.purpose),
    paragraph_text: nullIfEmpty(input.paragraph_text),
    visual_prompt: input.visual_spec?.scene_prompt ?? nullIfEmpty(input.visual_prompt),
    visual_spec: input.visual_spec ?? null,
  })

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function updateCarouselSlide(rawInput: z.infer<typeof carouselSlideSchema>) {
  const { supabase, user } = await requireUser()
  const input = carouselSlideSchema.parse(rawInput)

  if (!input.id) return { error: 'Slide id wajib ada.' }

  const { id, ...data } = input
  const { error } = await supabase
    .from('social_carousel_slides')
    .update({
      ...data,
      purpose: nullIfEmpty(data.purpose),
      paragraph_text: nullIfEmpty(data.paragraph_text),
      visual_prompt: data.visual_spec?.scene_prompt ?? nullIfEmpty(data.visual_prompt),
      visual_spec: data.visual_spec ?? null,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function deleteCarouselSlide(id: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('social_carousel_slides')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function recordPostMetrics(rawInput: z.infer<typeof metricsSchema>) {
  const { supabase, user } = await requireUser()
  const input = metricsSchema.parse(rawInput)

  const { error } = await supabase.from('social_post_metrics').insert({
    ...input,
    user_id: user.id,
    reach: input.reach ?? null,
    reactions: input.reactions ?? null,
    comments: input.comments ?? null,
    shares: input.shares ?? null,
    link_clicks: input.link_clicks ?? null,
    video_views: input.video_views ?? null,
    average_watch_time_seconds: input.average_watch_time_seconds ?? null,
    followers_gained: input.followers_gained ?? null,
    metric_window_hours: input.metric_window_hours ?? null,
    source: input.source,
    notes: nullIfEmpty(input.notes),
    next_action: nullIfEmpty(input.next_action),
  })

  if (error) return { error: error.message }

  const { error: postUpdateError } = await supabase
    .from('social_posts')
    .update({ metrics_done: true, status: 'reviewed' })
    .eq('id', input.post_id)
    .eq('user_id', user.id)

  if (postUpdateError) return { error: postUpdateError.message }

  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function updateSocialLearningStatus(rawInput: z.infer<typeof learningStatusSchema>) {
  const { supabase, user } = await requireUser()
  const input = learningStatusSchema.parse(rawInput)

  const { error } = await supabase
    .from('social_learnings')
    .update({ status: input.status })
    .eq('id', input.id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true, summary: `Learning ${input.status}.` }
}

function metricNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function generateSocialPerformanceReviewForCampaign(rawInput: z.infer<typeof performanceReviewSchema>) {
  const { supabase, user } = await requireUser()
  const input = performanceReviewSchema.parse(rawInput)

  const { data: campaign, error: campaignError } = await supabase
    .from('social_campaigns')
    .select('*')
    .eq('id', input.campaign_id)
    .eq('user_id', user.id)
    .single()

  if (campaignError || !campaign) return { error: campaignError?.message || 'Campaign tidak ditemukan.' }

  const [{ data: posts, error: postsError }, { data: metrics, error: metricsError }, { data: publications, error: publicationsError }, { data: variants, error: variantsError }] = await Promise.all([
    supabase
      .from('social_posts')
      .select('*')
      .eq('user_id', user.id)
      .eq('campaign_id', input.campaign_id)
      .order('scheduled_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('social_post_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false }),
    supabase
      .from('social_publications')
      .select('*')
      .eq('user_id', user.id)
      .order('published_at', { ascending: false }),
    supabase
      .from('social_post_variants')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  if (postsError) return { error: postsError.message }
  if (metricsError) return { error: metricsError.message }
  if (publicationsError) return { error: publicationsError.message }
  if (variantsError) return { error: variantsError.message }

  const campaignPosts = (posts ?? []) as SocialPost[]
  const postIds = new Set(campaignPosts.map((post) => post.id))
  const campaignMetrics = ((metrics ?? []) as SocialPostMetric[])
    .filter((metric) => postIds.has(metric.post_id))
    .filter((metric) => !input.start_date || metric.recorded_at.slice(0, 10) >= input.start_date)
    .filter((metric) => !input.end_date || metric.recorded_at.slice(0, 10) <= input.end_date)
  const campaignPublications = ((publications ?? []) as SocialPublication[]).filter((publication) => postIds.has(publication.post_id))
  const publishedPostIds = new Set([
    ...campaignPublications.map((publication) => publication.post_id),
    ...campaignMetrics.map((metric) => metric.post_id),
  ])
  const publishedPosts = campaignPosts.filter((post) => publishedPostIds.has(post.id) || post.posted_done || post.status === 'posted' || post.status === 'reviewed')

  if (publishedPosts.length === 0) return { error: 'Belum ada post published atau metrics untuk retrospective.' }
  if (campaignMetrics.length === 0) return { error: 'Belum ada metrics nyata untuk retrospective.' }

  const templates = [...new Set(publishedPosts.map((post) => post.selected_template_id || post.visual_spec?.template_id).filter(Boolean) as string[])]
  const result = await generateSocialPerformanceReview(
    {
      campaign: {
        id: campaign.id,
        title: campaign.title,
        theme: campaign.theme || undefined,
        primary_goal: campaign.primary_goal || undefined,
        content_pillar: campaign.content_pillar || undefined,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
      },
      published_posts: publishedPosts.map((post) => ({
        id: post.id,
        title: post.title,
        post_type: post.post_type,
        objective: post.objective || undefined,
        content_pillar: post.content_pillar || undefined,
        template_id: post.selected_template_id || post.visual_spec?.template_id || undefined,
        aspect_ratio: post.aspect_ratio,
        scheduled_date: post.scheduled_date || undefined,
        scheduled_time: post.scheduled_time || undefined,
        status: post.status,
      })),
      publication_snapshots: campaignPublications.map((publication) => ({
        post_id: publication.post_id,
        published_at: publication.published_at,
        caption_snapshot: publication.caption_snapshot || undefined,
        facebook_url: publication.facebook_url || undefined,
      })),
      metrics: campaignMetrics.map((metric) => ({
        post_id: metric.post_id,
        recorded_at: metric.recorded_at,
        reach: metricNumber(metric.reach),
        reactions: metricNumber(metric.reactions),
        comments: metricNumber(metric.comments),
        shares: metricNumber(metric.shares),
        link_clicks: metricNumber(metric.link_clicks),
        video_views: metricNumber(metric.video_views),
        average_watch_time_seconds: metricNumber(metric.average_watch_time_seconds),
        followers_gained: metricNumber(metric.followers_gained),
        metric_window_hours: metricNumber(metric.metric_window_hours),
        source: metric.source,
        next_action: metric.next_action || undefined,
      })),
      variants: ((variants ?? []) as SocialPostVariant[])
        .filter((variant) => postIds.has(variant.post_id))
        .map((variant) => ({
          post_id: variant.post_id,
          variant_type: variant.variant_type,
          label: variant.label || undefined,
          content: variant.content,
          is_selected: variant.is_selected,
        })),
      templates,
      date_range: {
        start_date: input.start_date || campaign.start_date,
        end_date: input.end_date || campaign.end_date,
      },
    },
    { userId: user.id, targetType: 'social', targetId: input.campaign_id },
  )

  if (!result.success) return { error: result.error }

  const rows = result.data.proposed_learnings.map((learning) => ({
    user_id: user.id,
    scope_type: learning.scope_type,
    scope_id: learning.scope_type === 'campaign' ? input.campaign_id : null,
    title: learning.title,
    observation: learning.observation,
    evidence: {
      ...learning.evidence,
      campaign_id: input.campaign_id,
      campaign_title: campaign.title,
      generated_at: new Date().toISOString(),
    },
    evidence_count: learning.evidence_count,
    confidence: learning.confidence,
    recommendation: learning.recommendation,
    status: 'proposed',
  }))

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('social_learnings').insert(rows)
    if (insertError) return { error: insertError.message }
  }

  if (input.save_to_notes) {
    const summaryNote = `Performance retrospective ${new Date().toISOString().slice(0, 10)}: ${result.data.campaign_summary}`
    await supabase
      .from('social_campaigns')
      .update({ tone_note: compactContent([campaign.tone_note, summaryNote].filter(Boolean).join('\n\n'), 1000) })
      .eq('id', input.campaign_id)
      .eq('user_id', user.id)
  }

  revalidatePath(SOCIAL_PATH)
  return {
    success: true,
    summary: `Retrospective selesai. ${rows.length} proposed learning dibuat.`,
    review: result.data,
  }
}

export async function generateFacebookVariantsForPost(rawInput: z.infer<typeof generateVariantsSchema>) {
  const { supabase, user } = await requireUser()
  const input = generateVariantsSchema.parse(rawInput)

  const { data: post, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', input.post_id)
    .eq('user_id', user.id)
    .single()

  if (error || !post) return { error: error?.message || 'Post tidak ditemukan.' }

  const typedPost = post as SocialPost
  const source = await getSourceByPost(supabase, typedPost)
  const approvedLearnings = await getRelevantApprovedSocialLearnings(supabase, user.id, {
    campaignId: typedPost.campaign_id,
    campaignGoal: typedPost.objective,
    contentPillar: typedPost.content_pillar,
    postType: typedPost.post_type,
    templateId: typedPost.selected_template_id || typedPost.visual_spec?.template_id,
    publishingTime: typedPost.scheduled_time,
  })
  const result = await generateFacebookVariants(
    {
      post_title: typedPost.title,
      post_type: typedPost.post_type,
      hook: typedPost.hook || undefined,
      body: typedPost.body || undefined,
      cta: typedPost.cta || undefined,
      first_comment: typedPost.first_comment || undefined,
      visual_headline: typedPost.visual_spec?.headline || undefined,
      visual_direction: typedPost.visual_prompt || typedPost.visual_spec?.scene_prompt || undefined,
      source_title: source?.title,
      source_summary: source?.summary,
      variant_type: input.variant_type,
      desired_count: input.desired_count,
      tone: nullIfEmpty(input.tone) ?? undefined,
      campaign_objective: typedPost.objective || undefined,
      historical_learnings: nullIfEmpty(input.historical_learnings) ?? undefined,
      approved_learnings: approvedLearnings,
    },
    { userId: user.id, targetType: 'social', targetId: input.post_id }
  )

  if (!result.success) return { error: result.error }

  const rows = result.data.variants.map((variant) => ({
    user_id: user.id,
    post_id: input.post_id,
    variant_type: input.variant_type,
    label: variant.label,
    content: variant.content,
    metadata: {
      direction: variant.direction ?? null,
      rationale: variant.rationale ?? null,
      tone: nullIfEmpty(input.tone),
      generated_at: new Date().toISOString(),
    },
    heuristic_scores: normalizeHeuristicScores(variant.heuristic_scores),
    is_selected: false,
  }))

  const { error: insertError } = await supabase.from('social_post_variants').insert(rows)
  if (insertError) return { error: insertError.message }

  revalidatePath(SOCIAL_PATH)
  return { success: true, summary: `${rows.length} variant ${input.variant_type} dibuat.` }
}

export async function updateSocialPostVariant(rawInput: z.infer<typeof updateVariantSchema>) {
  const { supabase, user } = await requireUser()
  const input = updateVariantSchema.parse(rawInput)

  const { error } = await supabase
    .from('social_post_variants')
    .update({
      label: input.label,
      content: input.content,
    })
    .eq('id', input.id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true, summary: 'Variant disimpan.' }
}

export async function selectSocialPostVariant(rawInput: z.infer<typeof selectVariantSchema>) {
  const { supabase, user } = await requireUser()
  const input = selectVariantSchema.parse(rawInput)

  const { data: variant, error: variantError } = await supabase
    .from('social_post_variants')
    .select('*')
    .eq('id', input.id)
    .eq('user_id', user.id)
    .single()

  if (variantError || !variant) return { error: variantError?.message || 'Variant tidak ditemukan.' }

  const typedVariant = variant as SocialPostVariant
  const { data: post, error: postError } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', typedVariant.post_id)
    .eq('user_id', user.id)
    .single()

  if (postError || !post) return { error: postError?.message || 'Post tidak ditemukan.' }

  const { error: resetError } = await supabase
    .from('social_post_variants')
    .update({ is_selected: false })
    .eq('user_id', user.id)
    .eq('post_id', typedVariant.post_id)
    .eq('variant_type', typedVariant.variant_type)

  if (resetError) return { error: resetError.message }

  const { error: selectError } = await supabase
    .from('social_post_variants')
    .update({ is_selected: true })
    .eq('id', typedVariant.id)
    .eq('user_id', user.id)

  if (selectError) return { error: selectError.message }

  const patch = buildVariantPostPatch(post as SocialPost, typedVariant)
  const { error: updatePostError } = await supabase
    .from('social_posts')
    .update(patch)
    .eq('id', typedVariant.post_id)
    .eq('user_id', user.id)

  if (updatePostError) return { error: updatePostError.message }

  revalidatePath(SOCIAL_PATH)
  return { success: true, summary: 'Variant terpilih diterapkan ke post.' }
}

export async function generateFacebookContentMapForCampaign(rawInput: z.infer<typeof generateContentMapSchema>) {
  const { supabase, user } = await requireUser()
  const input = generateContentMapSchema.parse(rawInput)
  const strategyId = input.strategy_id as SocialStrategyPresetId
  const preset = getSocialStrategyPreset(strategyId)

  const { data: campaign, error } = await supabase
    .from('social_campaigns')
    .select('*')
    .eq('id', input.campaign_id)
    .eq('user_id', user.id)
    .single()

  if (error || !campaign) return { error: error?.message || 'Campaign tidak ditemukan.' }

  let sources: SocialSourceOption[] = []
  try {
    sources = await getPlanSourcesByKeys(supabase, input.source_keys)
  } catch (sourceError) {
    return {
      error: sourceError instanceof Error ? sourceError.message : 'Gagal memuat sumber konten.',
    }
  }

  if (sources.length === 0) return { error: 'Pilih minimal satu source yang valid.' }

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90)
  const { data: recentPosts, error: recentError } = await supabase
    .from('social_posts')
    .select('id, title')
    .eq('user_id', user.id)
    .gte('created_at', ninetyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(200)

  if (recentError) return { error: recentError.message }

  const approvedLearnings = await getRelevantApprovedSocialLearnings(supabase, user.id, {
    campaignId: campaign.id,
    campaignGoal: campaign.primary_goal,
    contentPillar: campaign.content_pillar,
  })

  const result = await generateFacebookContentMap(
    {
      campaign_title: campaign.title,
      campaign_theme: campaign.theme || undefined,
      strategy_id: strategyId,
      strategy_label: preset.label,
      strategy_brief: buildStrategyBrief(strategyId),
      sources: sources.map((source) => ({
        type: source.type,
        id: source.id,
        title: source.title,
        summary: buildSourceSummary([source.description, source.content]),
        url: buildSocialSourceUrl(source),
      })),
      desired_count: input.desired_count,
      start_date: input.start_date,
      end_date: nullIfEmpty(input.end_date) ?? undefined,
      editor_notes: nullIfEmpty(input.editor_notes) ?? undefined,
      previous_campaign_summary: nullIfEmpty(input.previous_campaign_summary) ?? undefined,
      approved_learnings: approvedLearnings,
    },
    { userId: user.id, targetType: 'social', targetId: input.campaign_id }
  )

  if (!result.success) return { error: result.error }

  const existingPosts = ((recentPosts ?? []) as Array<{ id: string; title: string }>).filter((post) => post.title)
  const similarityWarnings = result.data.proposed_content_items
    .map((item) => findClosestTitleMatch(item.title, existingPosts))
    .filter((warning): warning is NonNullable<typeof warning> => Boolean(warning))

  return {
    success: true,
    contentMap: result.data,
    similarityWarnings,
    strategy: SOCIAL_STRATEGY_PRESETS[strategyId],
  }
}

export async function createSelectedContentMapPosts(rawInput: z.infer<typeof createSelectedContentMapPostsSchema>) {
  const { supabase, user } = await requireUser()
  const input = createSelectedContentMapPostsSchema.parse(rawInput)
  const strategyId = input.strategy_id as SocialStrategyPresetId
  const preset = getSocialStrategyPreset(strategyId)

  const { data: campaign, error } = await supabase
    .from('social_campaigns')
    .select('id, title')
    .eq('id', input.campaign_id)
    .eq('user_id', user.id)
    .single()

  if (error || !campaign) return { error: error?.message || 'Campaign tidak ditemukan.' }

  let sources: SocialSourceOption[] = []
  try {
    sources = await getPlanSourcesByKeys(supabase, input.source_keys)
  } catch (sourceError) {
    return {
      error: sourceError instanceof Error ? sourceError.message : 'Gagal memuat sumber konten.',
    }
  }

  const selectedItems = input.items
    .filter((item) => item.selected)
    .sort((left, right) => left.suggested_publishing_order - right.suggested_publishing_order)

  if (selectedItems.length === 0) return { error: 'Pilih minimal satu content item.' }

  const rows = selectedItems.map((item, index) => {
    const source = resolveContentMapSourceForItem(item, sources)
    const sourceUrl = source ? buildSocialSourceUrl(source) : null
    const postType = item.post_type as SocialPostType

    return {
      user_id: user.id,
      campaign_id: input.campaign_id,
      platform: 'facebook',
      post_type: postType,
      title: item.title,
      hook: item.hook_direction,
      body: item.angle,
      cta: item.audience_action,
      target_url: postType === 'article_link' ? sourceUrl : null,
      source_type: source?.type ?? 'none',
      source_id: source?.id ?? null,
      scheduled_date: getScheduledDateForOrder(input.start_date, nullIfEmpty(input.end_date), index + 1),
      scheduled_time: '18:30',
      timezone: 'Asia/Jayapura',
      status: 'planned',
      objective: item.objective,
      content_pillar: preset.label,
      caption_done: true,
      cta_done: true,
      visual_prompt_done: false,
      notes: buildContentMapNotes({
        strategyLabel: preset.label,
        angle: item.angle,
        audienceAction: item.audience_action,
        hookDirection: item.hook_direction,
        visualDirection: item.visual_direction,
        estimatedProductionComplexity: item.estimated_production_complexity,
        sourceReference: item.source_reference,
      }),
    }
  })

  const { error: insertError } = await supabase.from('social_posts').insert(rows)
  if (insertError) return { error: insertError.message }

  await supabase
    .from('social_campaigns')
    .update({ status: 'in_progress' })
    .eq('id', input.campaign_id)
    .eq('user_id', user.id)

  revalidatePath(SOCIAL_PATH)
  return { success: true, summary: `${rows.length} content molecule dibuat sebagai post.` }
}

export async function generateWeeklyFacebookPlan(campaignId: string, sourceKey?: string) {
  const { supabase, user } = await requireUser()
  const { data: campaign, error } = await supabase
    .from('social_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .single()

  if (error || !campaign) return { error: error?.message || 'Campaign tidak ditemukan.' }

  let source: SocialSourceOption | null = null

  try {
    source = await getPlanSourceByKey(supabase, sourceKey)
  } catch (sourceError) {
    return {
      error:
        sourceError instanceof Error
          ? sourceError.message
          : 'Gagal memuat sumber konten.',
    }
  }

  const sourceUrl =
    source?.type === 'post'
      ? `${SITE_URL}${getPostPath(source.slug)}`
      : source?.type === 'panduan'
        ? `${SITE_URL}${getPanduanPath(source.slug)}`
        : undefined

  const approvedLearnings = await getRelevantApprovedSocialLearnings(supabase, user.id, {
    campaignId: campaign.id,
    campaignGoal: campaign.primary_goal,
    contentPillar: campaign.content_pillar,
  })

  const result = await generateFacebookWeeklyPlan(
    {
      campaign_title: campaign.title,
      theme: campaign.theme || campaign.title,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      primary_goal: campaign.primary_goal || undefined,
      content_pillar: campaign.content_pillar || undefined,
      tone_note: campaign.tone_note || undefined,
      source_title: source?.title,
      source_summary: buildSourceSummary([source?.description, source?.content]),
      source_url: sourceUrl,
      approved_learnings: approvedLearnings,
    },
    { userId: user.id, targetType: 'social', targetId: campaignId }
  )

  if (!result.success) return { error: result.error }

  for (const draft of result.data.posts) {
    const { data: insertedPost, error: insertError } = await supabase
      .from('social_posts')
      .insert({
        user_id: user.id,
        campaign_id: campaignId,
        platform: 'facebook',
        post_type: draft.post_type,
        title: draft.title,
        hook: draft.hook,
        body: draft.body,
        cta: draft.cta,
        target_url: draft.post_type === 'article_link' ? sourceUrl ?? null : null,
        source_type: source ? source.type : 'none',
        source_id: source?.id ?? null,
        scheduled_date: draft.scheduled_date,
        scheduled_time: draft.scheduled_time,
        timezone: 'Asia/Jayapura',
        status: 'drafting',
        visual_prompt: nullIfEmpty(draft.visual_prompt) ?? draft.visual_spec.scene_prompt,
        visual_spec: draft.visual_spec,
        alt_text: draft.visual_spec.alt_text,
        selected_template_id: draft.visual_spec.template_id,
        aspect_ratio: draft.visual_spec.aspect_ratio,
        objective: draft.objective,
        content_pillar: draft.content_pillar,
        caption_done: Boolean(draft.body),
        cta_done: Boolean(draft.cta),
        visual_prompt_done: Boolean(draft.visual_prompt || draft.visual_spec),
      })
      .select('id')
      .single()

    if (insertError || !insertedPost) {
      return { error: insertError?.message || 'Gagal menyimpan post hasil AI.' }
    }

    if (draft.post_type === 'carousel' && draft.slides.length > 0) {
      const { error: slideError } = await supabase.from('social_carousel_slides').insert(
        draft.slides.map((slide) => ({
          user_id: user.id,
          post_id: insertedPost.id,
          slide_number: slide.slide_number,
      purpose: slide.purpose,
      title_text: slide.title_text,
      paragraph_text: nullIfEmpty(slide.paragraph_text),
      visual_prompt: nullIfEmpty(slide.visual_prompt) ?? slide.visual_spec.scene_prompt,
      visual_spec: slide.visual_spec,
      image_status: 'prompt_ready',
        }))
      )

      if (slideError) return { error: slideError.message }
    }
  }

  await supabase
    .from('social_campaigns')
    .update({ status: 'in_progress' })
    .eq('id', campaignId)
    .eq('user_id', user.id)

  revalidatePath(SOCIAL_PATH)
  return { success: true, summary: result.data.campaign_summary }
}

export async function generateFacebookPostDraft(postId: string) {
  const { supabase, user } = await requireUser()
  const { data: post, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single()

  if (error || !post) return { error: error?.message || 'Post tidak ditemukan.' }

  const source = await getSourceByPost(supabase, post as SocialPost)
  const typedPost = post as SocialPost
  const approvedLearnings = await getRelevantApprovedSocialLearnings(supabase, user.id, {
    campaignId: typedPost.campaign_id,
    campaignGoal: typedPost.objective,
    contentPillar: typedPost.content_pillar,
    postType: typedPost.post_type,
    templateId: typedPost.selected_template_id || typedPost.visual_spec?.template_id,
    publishingTime: typedPost.scheduled_time,
  })
  const result = await generateFacebookPost(
    {
      title: post.title,
      post_type: post.post_type,
      hook: post.hook || undefined,
      source_title: source?.title,
      source_summary: source?.summary,
      source_url: source?.url,
      content_pillar: post.content_pillar || undefined,
      tone_note: post.notes || undefined,
      aspect_ratio: post.aspect_ratio || '1:1',
      approved_learnings: approvedLearnings,
    },
    { userId: user.id, targetType: 'social', targetId: postId }
  )

  if (!result.success) return { error: result.error }

  const { error: updateError } = await supabase
    .from('social_posts')
    .update({
      title: result.data.title,
      hook: result.data.hook,
      body: result.data.body,
      cta: result.data.cta,
      ...visualSpecPostPatch(result.data.visual_spec),
      visual_prompt: result.data.visual_prompt || result.data.visual_spec.scene_prompt,
      status: 'drafting',
      caption_done: true,
      cta_done: true,
      visual_prompt_done: true,
    })
    .eq('id', postId)
    .eq('user_id', user.id)

  if (updateError) return { error: updateError.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function generateFacebookCarouselSlides(postId: string) {
  const { supabase, user } = await requireUser()
  const { data: post, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single()

  if (error || !post) return { error: error?.message || 'Post tidak ditemukan.' }

  const typedPost = post as SocialPost
  const source = await getSourceByPost(supabase, typedPost)
  const approvedLearnings = await getRelevantApprovedSocialLearnings(supabase, user.id, {
    campaignId: typedPost.campaign_id,
    contentPillar: typedPost.content_pillar,
    postType: typedPost.post_type,
    templateId: typedPost.selected_template_id,
    publishingTime: typedPost.scheduled_time,
  })
  const result = await generateFacebookCarousel(
    {
      title: post.title,
      post_type: 'carousel',
      hook: post.hook || undefined,
      source_title: source?.title,
      source_summary: source?.summary,
      source_url: source?.url,
      content_pillar: post.content_pillar || undefined,
      tone_note: post.notes || undefined,
      aspect_ratio: post.aspect_ratio || '1:1',
      slide_count: 7,
      approved_learnings: approvedLearnings,
    },
    { userId: user.id, targetType: 'social', targetId: postId }
  )

  if (!result.success) return { error: result.error }

  await supabase.from('social_carousel_slides').delete().eq('post_id', postId).eq('user_id', user.id)

  const { error: insertError } = await supabase.from('social_carousel_slides').insert(
    result.data.slides.map((slide) => ({
      user_id: user.id,
      post_id: postId,
      slide_number: slide.slide_number,
      purpose: slide.purpose,
      title_text: slide.title_text,
      paragraph_text: nullIfEmpty(slide.paragraph_text),
      visual_prompt: nullIfEmpty(slide.visual_prompt) ?? slide.visual_spec.scene_prompt,
      visual_spec: slide.visual_spec,
      image_status: 'prompt_ready',
    }))
  )

  if (insertError) return { error: insertError.message }

  await supabase
    .from('social_posts')
    .update({ visual_prompt_done: true, status: 'drafting' })
    .eq('id', postId)
    .eq('user_id', user.id)

  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function generateFacebookVisualPromptForPost(postId: string) {
  const { supabase, user } = await requireUser()
  const { data: post, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single()

  if (error || !post) return { error: error?.message || 'Post tidak ditemukan.' }

  const result = await generateFacebookVisualPrompt(
    {
      title: post.title,
      context: [post.hook, post.body, post.cta].filter(Boolean).join('\n\n') || post.title,
      layout_type: post.post_type === 'carousel'
        ? 'Facebook carousel cover, ' + (post.aspect_ratio || '1:1')
        : 'Facebook feed image, ' + (post.aspect_ratio || '1:1'),
      tone_note: post.notes || undefined,
    },
    { userId: user.id, targetType: 'social', targetId: postId }
  )

  if (!result.success) return { error: result.error }

  const { error: updateError } = await supabase
    .from('social_posts')
    .update({
      ...visualSpecPostPatch(result.data.visual_spec),
      visual_prompt: result.data.visual_prompt || result.data.visual_spec.scene_prompt,
      visual_prompt_done: true,
    })
    .eq('id', postId)
    .eq('user_id', user.id)

  if (updateError) return { error: updateError.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}


export async function uploadSocialBackgroundAsset(formData: FormData) {
  const { supabase, user } = await requireUser()
  const file = formData.get('file') as File | null
  const postId = String(formData.get('post_id') ?? '').trim()
  const slideId = String(formData.get('slide_id') ?? '').trim() || null

  if (!postId) return { error: 'Post id wajib ada.' }
  if (!file) return { error: 'File background wajib dipilih.' }
  if (!SOCIAL_BACKGROUND_MIME_TYPES.includes(file.type as (typeof SOCIAL_BACKGROUND_MIME_TYPES)[number])) {
    return { error: 'Background harus PNG, JPG, atau WebP.' }
  }
  if (file.size > SOCIAL_BACKGROUND_MAX_BYTES) {
    return { error: 'Ukuran background maksimal 8 MB.' }
  }

  try {
    await assertOwnedSocialAssetTarget({ supabase, userId: user.id, postId, slideId })

    const buffer = Buffer.from(await file.arrayBuffer())
    const metadata = await sharp(buffer).metadata()
    const width = metadata.width ?? null
    const height = metadata.height ?? null
    const version = await getNextAssetVersion({
      supabase,
      userId: user.id,
      postId,
      slideId,
      assetType: 'background',
    })
    const extension = getBackgroundExtension(file.type)
    const basePath = buildSocialAssetStoragePath({
      userId: user.id,
      postId,
      slideId,
      assetKind: 'background',
      version,
    }).replace(/\.png$/, `.${extension}`)

    const { error: uploadError } = await supabase.storage
      .from(getSocialAssetsBucket())
      .upload(basePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      })

    if (uploadError) return { error: uploadError.message }

    const { error: insertError } = await supabase.from('social_assets').insert({
      user_id: user.id,
      post_id: postId,
      slide_id: slideId,
      asset_type: 'background',
      storage_path: basePath,
      mime_type: file.type,
      width,
      height,
      aspect_ratio: getNearestSocialAspectRatio(width, height),
      template_id: null,
      version,
      generation_prompt: null,
      metadata: { original_name: file.name, file_size: file.size },
      status: 'ready',
    })

    if (insertError) return { error: insertError.message }

    revalidatePath(SOCIAL_PATH)
    return { success: true, summary: `Background v${version} tersimpan.` }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Upload background gagal.' }
  }
}

export async function updateSocialAssetStatus(assetId: string, status: Extract<SocialAssetStatus, 'ready' | 'approved' | 'archived'>) {
  const { supabase, user } = await requireUser()
  const allowed: Array<Extract<SocialAssetStatus, 'ready' | 'approved' | 'archived'>> = ['ready', 'approved', 'archived']
  if (!allowed.includes(status)) return { error: 'Status asset tidak valid.' }

  const { error } = await supabase
    .from('social_assets')
    .update({ status })
    .eq('id', assetId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}
async function renderSocialPostAssetInternal(params: {
  supabase: SocialSupabaseClient
  userId: string
  post: SocialPost
  backgroundAssetId?: string | null
}) {
  if (!params.post.visual_spec) {
    return { error: 'Visual spec belum tersedia untuk post ini.' }
  }

  const background = await getSelectedSocialBackground({
    supabase: params.supabase,
    userId: params.userId,
    postId: params.post.id,
    backgroundAssetId: params.backgroundAssetId,
  })
  const downloadedBackground = await downloadSocialBackground(params.supabase, background)
  const rendered = await renderSocialAsset({
    spec: params.post.visual_spec,
    templateId: params.post.selected_template_id || params.post.visual_spec.template_id,
    aspectRatio: params.post.aspect_ratio || params.post.visual_spec.aspect_ratio,
    postType: params.post.post_type,
    backgroundImage: downloadedBackground.buffer,
    backgroundMimeType: downloadedBackground.mimeType,
  })
  const warnings = downloadedBackground.warning
    ? [...rendered.warnings, downloadedBackground.warning]
    : rendered.warnings
  const asset = await uploadRenderedSocialAsset({
    supabase: params.supabase,
    userId: params.userId,
    postId: params.post.id,
    assetType: 'poster',
    png: rendered.png,
    width: rendered.width,
    height: rendered.height,
    aspectRatio: params.post.aspect_ratio || params.post.visual_spec.aspect_ratio,
    templateId: rendered.templateId,
    generationPrompt: params.post.visual_spec.scene_prompt,
    warnings,
  })

  const { error: updateError } = await params.supabase
    .from('social_posts')
    .update({ asset_done: true })
    .eq('id', params.post.id)
    .eq('user_id', params.userId)

  if (updateError) return { error: updateError.message }

  return {
    success: true,
    storagePath: asset.storagePath,
    version: asset.version,
    width: rendered.width,
    height: rendered.height,
    warnings,
  }
}

async function renderCarouselSlideAssetInternal(params: {
  supabase: SocialSupabaseClient
  userId: string
  slide: SocialCarouselSlide
  markPostDone?: boolean
  backgroundAssetId?: string | null
}) {
  if (!params.slide.visual_spec) {
    return { error: `Visual spec belum tersedia untuk slide ${params.slide.slide_number}.` }
  }

  const background = await getSelectedSocialBackground({
    supabase: params.supabase,
    userId: params.userId,
    postId: params.slide.post_id,
    slideId: params.slide.id,
    backgroundAssetId: params.backgroundAssetId,
  })
  const downloadedBackground = await downloadSocialBackground(params.supabase, background)
  const rendered = await renderSocialAsset({
    spec: params.slide.visual_spec,
    templateId: params.slide.visual_spec.template_id,
    aspectRatio: params.slide.visual_spec.aspect_ratio,
    postType: 'carousel',
    backgroundImage: downloadedBackground.buffer,
    backgroundMimeType: downloadedBackground.mimeType,
  })
  const warnings = downloadedBackground.warning
    ? [...rendered.warnings, downloadedBackground.warning]
    : rendered.warnings
  const asset = await uploadRenderedSocialAsset({
    supabase: params.supabase,
    userId: params.userId,
    postId: params.slide.post_id,
    slideId: params.slide.id,
    assetType: 'carousel_slide',
    png: rendered.png,
    width: rendered.width,
    height: rendered.height,
    aspectRatio: params.slide.visual_spec.aspect_ratio,
    templateId: rendered.templateId,
    generationPrompt: params.slide.visual_spec.scene_prompt,
    warnings,
  })

  if (params.markPostDone) {
    const { error: updateError } = await params.supabase
      .from('social_posts')
      .update({ asset_done: true })
      .eq('id', params.slide.post_id)
      .eq('user_id', params.userId)

    if (updateError) return { error: updateError.message }
  }

  return {
    success: true,
    storagePath: asset.storagePath,
    version: asset.version,
    width: rendered.width,
    height: rendered.height,
    warnings,
  }
}

export async function renderSocialPostAsset(postId: string, backgroundAssetId?: string | null) {
  const { supabase, user } = await requireUser()
  const { data: post, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single()

  if (error || !post) return { error: error?.message || 'Post tidak ditemukan.' }

  try {
    const result = await renderSocialPostAssetInternal({
      supabase,
      userId: user.id,
      post: post as SocialPost,
      backgroundAssetId,
    })

    revalidatePath(SOCIAL_PATH)
    return result
  } catch (renderError) {
    return { error: renderError instanceof Error ? renderError.message : 'Render social asset gagal.' }
  }
}

export async function renderCarouselSlideAsset(slideId: string, backgroundAssetId?: string | null) {
  const { supabase, user } = await requireUser()
  const { data: slide, error } = await supabase
    .from('social_carousel_slides')
    .select('*')
    .eq('id', slideId)
    .eq('user_id', user.id)
    .single()

  if (error || !slide) return { error: error?.message || 'Slide tidak ditemukan.' }

  try {
    const result = await renderCarouselSlideAssetInternal({
      supabase,
      userId: user.id,
      slide: slide as SocialCarouselSlide,
      markPostDone: false,
      backgroundAssetId,
    })

    revalidatePath(SOCIAL_PATH)
    return result
  } catch (renderError) {
    return { error: renderError instanceof Error ? renderError.message : 'Render carousel slide gagal.' }
  }
}

export async function renderAllCarouselAssets(postId: string) {
  const { supabase, user } = await requireUser()
  const { data: post, error: postError } = await supabase
    .from('social_posts')
    .select('id, post_type')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single()

  if (postError || !post) return { error: postError?.message || 'Post tidak ditemukan.' }
  if (post.post_type !== 'carousel') return { error: 'Post ini bukan carousel.' }

  const { data: slides, error: slideError } = await supabase
    .from('social_carousel_slides')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .order('slide_number', { ascending: true })

  if (slideError) return { error: slideError.message }
  if (!slides || slides.length === 0) return { error: 'Carousel belum memiliki slide.' }

  const renderedSlides = []
  for (const slide of slides as SocialCarouselSlide[]) {
    try {
      const result = await renderCarouselSlideAssetInternal({
        supabase,
        userId: user.id,
        slide,
        markPostDone: false,
      })
      renderedSlides.push({
        slideId: slide.id,
        slideNumber: slide.slide_number,
        ...result,
      })
    } catch (renderError) {
      renderedSlides.push({
        slideId: slide.id,
        slideNumber: slide.slide_number,
        error: renderError instanceof Error ? renderError.message : 'Render slide gagal.',
      })
    }
  }

  const hasSuccess = renderedSlides.some((result) => result.success)
  const hasError = renderedSlides.some((result) => result.error)

  if (hasSuccess && !hasError) {
    const { error: updateError } = await supabase
      .from('social_posts')
      .update({ asset_done: true })
      .eq('id', postId)
      .eq('user_id', user.id)

    if (updateError) return { error: updateError.message }
  }

  revalidatePath(SOCIAL_PATH)
  return {
    success: hasSuccess,
    error: hasSuccess ? undefined : 'Semua slide gagal dirender.',
    slides: renderedSlides,
  }
}

function getAssetFileName(asset: Pick<SocialAsset, 'asset_type' | 'version' | 'storage_path'>, fallback = 'asset') {
  const extension = asset.storage_path.split('.').pop()?.split('?')[0] || 'png'
  return `${asset.asset_type || fallback}-v${asset.version || 1}.${extension}`
}

async function downloadOwnedSocialAssetBuffer(params: {
  supabase: SocialSupabaseClient
  userId: string
  assetId?: string
  storagePath?: string
}) {
  let asset: Pick<SocialAsset, 'id' | 'storage_path' | 'mime_type' | 'asset_type' | 'version'> | null = null

  if (params.assetId) {
    const { data, error } = await params.supabase
      .from('social_assets')
      .select('id, storage_path, mime_type, asset_type, version')
      .eq('id', params.assetId)
      .eq('user_id', params.userId)
      .single()

    if (error || !data) throw new Error(error?.message || 'Asset tidak ditemukan.')
    asset = data as Pick<SocialAsset, 'id' | 'storage_path' | 'mime_type' | 'asset_type' | 'version'>
  } else if (params.storagePath) {
    asset = {
      id: '',
      storage_path: params.storagePath,
      mime_type: 'image/png',
      asset_type: 'poster',
      version: 1,
    }
  }

  if (!asset?.storage_path) throw new Error('Asset tidak valid.')

  const { data, error } = await params.supabase.storage
    .from(getSocialAssetsBucket())
    .download(asset.storage_path)

  if (error || !data) throw new Error(error?.message || 'File asset tidak dapat diunduh.')

  return {
    asset,
    buffer: Buffer.from(await data.arrayBuffer()),
  }
}

async function getLatestApprovedPosterAsset(supabase: SocialSupabaseClient, userId: string, postId: string) {
  const { data, error } = await supabase
    .from('social_assets')
    .select('*')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .is('slide_id', null)
    .eq('asset_type', 'poster')
    .eq('status', 'approved')
    .order('version', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as SocialAsset | null
}

async function getLatestApprovedCarouselAssets(params: {
  supabase: SocialSupabaseClient
  userId: string
  postId: string
  slides: SocialCarouselSlide[]
}) {
  const { data, error } = await params.supabase
    .from('social_assets')
    .select('*')
    .eq('user_id', params.userId)
    .eq('post_id', params.postId)
    .eq('asset_type', 'carousel_slide')
    .eq('status', 'approved')
    .order('version', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const bySlide = new Map<string, SocialAsset>()
  for (const asset of (data ?? []) as SocialAsset[]) {
    if (asset.slide_id && !bySlide.has(asset.slide_id)) bySlide.set(asset.slide_id, asset)
  }

  const missingSlides = params.slides.filter((slide) => !bySlide.has(slide.id))
  return {
    bySlide,
    orderedAssets: params.slides.map((slide) => bySlide.get(slide.id)).filter(Boolean) as SocialAsset[],
    missingSlides,
  }
}

async function getOwnedPostForPublish(supabase: SocialSupabaseClient, userId: string, postId: string) {
  const { data: post, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', postId)
    .eq('user_id', userId)
    .single()

  if (error || !post) throw new Error(error?.message || 'Post tidak ditemukan.')
  return post as SocialPost
}

async function getOwnedSlidesForPost(supabase: SocialSupabaseClient, userId: string, postId: string) {
  const { data, error } = await supabase
    .from('social_carousel_slides')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .order('slide_number', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as SocialCarouselSlide[]
}

async function getPublishAssetIds(params: {
  supabase: SocialSupabaseClient
  userId: string
  post: SocialPost
}) {
  if (params.post.post_type === 'carousel') {
    const slides = await getOwnedSlidesForPost(params.supabase, params.userId, params.post.id)
    if (slides.length === 0) throw new Error('Carousel belum memiliki slide.')

    const approved = await getLatestApprovedCarouselAssets({
      supabase: params.supabase,
      userId: params.userId,
      postId: params.post.id,
      slides,
    })

    if (approved.missingSlides.length > 0) {
      const labels = approved.missingSlides.map((slide) => slide.slide_number).join(', ')
      throw new Error(`Carousel belum siap. Slide tanpa approved asset: ${labels}.`)
    }

    return approved.orderedAssets.map((asset) => asset.id)
  }

  const poster = await getLatestApprovedPosterAsset(params.supabase, params.userId, params.post.id)
  if (!poster) throw new Error('Post belum memiliki approved poster asset.')
  return [poster.id]
}

function validatePostCanPublish(post: SocialPost, caption: string) {
  if (!caption.trim()) throw new Error('Caption wajib ada sebelum Mark as Posted.')
  if (post.post_type === 'article_link' && !post.target_url?.trim()) {
    throw new Error('Article link wajib memiliki target URL sebelum Mark as Posted.')
  }
}

export async function downloadSocialAssetFile(assetId: string) {
  const { supabase, user } = await requireUser()

  try {
    const { asset, buffer } = await downloadOwnedSocialAssetBuffer({ supabase, userId: user.id, assetId })
    return {
      success: true,
      fileName: getAssetFileName(asset),
      mimeType: asset.mime_type || 'application/octet-stream',
      base64: buffer.toString('base64'),
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Download asset gagal.' }
  }
}

export async function downloadCarouselPublishZip(postId: string) {
  const { supabase, user } = await requireUser()

  try {
    const post = await getOwnedPostForPublish(supabase, user.id, postId)
    if (post.post_type !== 'carousel') return { error: 'Post ini bukan carousel.' }

    const slides = await getOwnedSlidesForPost(supabase, user.id, postId)
    const approved = await getLatestApprovedCarouselAssets({
      supabase,
      userId: user.id,
      postId,
      slides,
    })

    if (approved.missingSlides.length > 0) {
      const labels = approved.missingSlides.map((slide) => slide.slide_number).join(', ')
      return { error: `Carousel belum lengkap. Slide tanpa approved asset: ${labels}.` }
    }

    const targetUrl = buildSocialTargetUrl({
      targetUrl: post.target_url,
      utmSource: post.utm_source,
      utmMedium: post.utm_medium,
      utmCampaign: post.utm_campaign,
      baseUrl: SITE_URL,
    })
    const caption = buildSocialCaptionWithUtm(post, SITE_URL)
    const notes = [
      `Title: ${post.title}`,
      '',
      'Caption:',
      caption || '-',
      '',
      'First comment:',
      post.first_comment || '-',
      '',
      'Alt text:',
      post.alt_text || post.visual_spec?.alt_text || '-',
      '',
      'Target URL:',
      targetUrl || '-',
      '',
      'Slide order:',
      ...slides.map((slide) => `${String(slide.slide_number).padStart(2, '0')}. ${slide.title_text}`),
    ].join('\n')

    const entries = []
    for (const slide of slides) {
      const asset = approved.bySlide.get(slide.id)
      if (!asset) continue
      const { buffer } = await downloadOwnedSocialAssetBuffer({
        supabase,
        userId: user.id,
        storagePath: asset.storage_path,
      })
      const index = String(slide.slide_number).padStart(2, '0')
      entries.push({
        name: slide.slide_number === 1 ? `${index}-cover.png` : `${index}-slide.png`,
        data: buffer,
      })
    }

    entries.push({ name: 'publish-notes.txt', data: Buffer.from(notes, 'utf8') })
    const zip = createStoredZip(entries)

    return {
      success: true,
      fileName: `${post.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'carousel'}-publish-pack.zip`,
      mimeType: 'application/zip',
      base64: zip.toString('base64'),
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Download carousel ZIP gagal.' }
  }
}

export async function createManualSocialPublication(rawInput: z.infer<typeof manualPublicationSchema>) {
  const { supabase, user } = await requireUser()
  const input = manualPublicationSchema.parse(rawInput)

  try {
    const post = await getOwnedPostForPublish(supabase, user.id, input.post_id)
    const captionSnapshot = buildSocialCaptionWithUtm(post, SITE_URL)
    validatePostCanPublish(post, captionSnapshot)
    const assetIds = await getPublishAssetIds({ supabase, userId: user.id, post })
    const publishedAt = input.published_at ? new Date(input.published_at).toISOString() : new Date().toISOString()

    const { error: insertError } = await supabase.from('social_publications').insert({
      user_id: user.id,
      post_id: post.id,
      published_at: publishedAt,
      platform: 'facebook',
      publication_method: 'manual',
      facebook_url: nullIfEmpty(input.facebook_url),
      caption_snapshot: captionSnapshot,
      first_comment_snapshot: nullIfEmpty(post.first_comment),
      asset_ids: assetIds,
      notes: nullIfEmpty(input.notes),
    })

    if (insertError) return { error: insertError.message }

    const { error: postError } = await supabase
      .from('social_posts')
      .update({
        status: 'posted',
        copied_done: true,
        posted_done: true,
      })
      .eq('id', post.id)
      .eq('user_id', user.id)

    if (postError) return { error: postError.message }

    revalidatePath(SOCIAL_PATH)
    return {
      success: true,
      summary: input.facebook_url ? 'Publication tersimpan.' : 'Publication tersimpan tanpa Facebook URL.',
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Manual publication gagal.' }
  }
}
export async function regenerateFacebookVisualSpecForPost(postId: string) {
  return generateFacebookVisualPromptForPost(postId)
}
