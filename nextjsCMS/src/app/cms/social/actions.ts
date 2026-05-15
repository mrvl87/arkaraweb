"use server"

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getPanduanPath, getPostPath } from '@/lib/slugs'
import {
  generateFacebookCarousel,
  generateFacebookPost,
  generateFacebookVisualPrompt,
  generateFacebookWeeklyPlan,
} from '@/lib/ai/operations'
import type {
  SocialCampaign,
  SocialCarouselSlide,
  SocialChecklistKey,
  SocialDashboardData,
  SocialPost,
  SocialPostMetric,
  SocialSourceOption,
} from '@/types/social'

const SITE_URL = process.env.FRONTEND_SITE_URL || 'https://arkaraweb.com'
const SOCIAL_PATH = '/cms/social'
const CONTENT_LIMIT = 2200

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
    'checklist',
    'carousel',
    'opinion',
    'article_link',
    'question',
    'poll',
    'recap',
    'short_video',
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
  title_text: z.string().trim().min(1, 'Judul slide wajib diisi.'),
  paragraph_text: z.string().trim().optional().default(''),
  visual_prompt: z.string().trim().optional().default(''),
  image_status: z.enum(['needed', 'prompt_ready', 'generated', 'uploaded', 'approved']).default('needed'),
})

const metricsSchema = z.object({
  post_id: z.string().uuid(),
  reach: z.coerce.number().int().min(0).nullable().optional(),
  comments: z.coerce.number().int().min(0).nullable().optional(),
  shares: z.coerce.number().int().min(0).nullable().optional(),
  link_clicks: z.coerce.number().int().min(0).nullable().optional(),
  notes: z.string().trim().optional().default(''),
  next_action: z.string().trim().optional().default(''),
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

function compactContent(value?: string | null) {
  const content = (value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return content.length > CONTENT_LIMIT
    ? `${content.slice(0, CONTENT_LIMIT)}\n\n[Konten dipotong untuk efisiensi token.]`
    : content
}

function nullIfEmpty(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

async function getSourceByPost(
  supabase: Awaited<ReturnType<typeof createClient>>,
  post: Pick<SocialPost, 'source_type' | 'source_id' | 'target_url'>
) {
  if (!post.source_id || (post.source_type !== 'post' && post.source_type !== 'panduan')) {
    return null
  }

  const table = post.source_type === 'post' ? 'posts' : 'panduan'
  const { data, error } = await supabase
    .from(table)
    .select('id, title, slug, status, description, content, quick_answer')
    .eq('id', post.source_id)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const path = post.source_type === 'post' ? getPostPath(data.slug) : getPanduanPath(data.slug)

  return {
    title: data.title as string,
    summary: compactContent((data.description || data.quick_answer || data.content) as string | null),
    url: post.target_url || `${SITE_URL}${path}`,
  }
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
      .select('id, title, slug, status, description, content')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(80),
    supabase
      .from('panduan')
      .select('id, title, slug, status, meta_desc, content')
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

  const [{ data: socialPosts, error: postError }, { data: slides, error: slideError }, { data: metrics, error: metricsError }] =
    activeCampaign
      ? await Promise.all([
          supabase
            .from('social_posts')
            .select('*')
            .eq('user_id', user.id)
            .eq('campaign_id', activeCampaign.id)
            .order('scheduled_date', { ascending: true, nullsFirst: false })
            .order('scheduled_time', { ascending: true, nullsFirst: false }),
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
        ])
      : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }]

  if (postError) throw new Error(postError.message)
  if (slideError) throw new Error(slideError.message)
  if (metricsError) throw new Error(metricsError.message)

  const campaignPostIds = new Set(((socialPosts ?? []) as SocialPost[]).map((post) => post.id))

  const sources: SocialSourceOption[] = [
    ...((posts ?? []) as Array<any>).map((post) => ({
      id: post.id,
      type: 'post' as const,
      title: post.title,
      slug: post.slug,
      status: post.status,
      description: post.description ?? null,
      content: post.content ?? null,
    })),
    ...((panduan ?? []) as Array<any>).map((item) => ({
      id: item.id,
      type: 'panduan' as const,
      title: item.title,
      slug: item.slug,
      status: item.status,
      description: item.meta_desc ?? null,
      content: item.content ?? null,
    })),
  ]

  return {
    campaigns: campaignRows,
    activeCampaign,
    posts: (socialPosts ?? []) as SocialPost[],
    slides: ((slides ?? []) as SocialCarouselSlide[]).filter((slide) => campaignPostIds.has(slide.post_id)),
    metrics: ((metrics ?? []) as SocialPostMetric[]).filter((metric) => campaignPostIds.has(metric.post_id)),
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
    visual_prompt: nullIfEmpty(data.visual_prompt),
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
      visual_prompt: nullIfEmpty(data.visual_prompt),
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

  const patch =
    status === 'posted'
      ? { status, posted_done: true, copied_done: true }
      : { status }

  const { error } = await supabase.from('social_posts').update(patch).eq('id', id).eq('user_id', user.id)

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

export async function markPostPosted(id: string) {
  return updatePostStatus(id, 'posted')
}

export async function createCarouselSlide(rawInput: z.infer<typeof carouselSlideSchema>) {
  const { supabase, user } = await requireUser()
  const input = carouselSlideSchema.parse(rawInput)

  const { error } = await supabase.from('social_carousel_slides').insert({
    ...input,
    user_id: user.id,
    paragraph_text: nullIfEmpty(input.paragraph_text),
    visual_prompt: nullIfEmpty(input.visual_prompt),
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
      paragraph_text: nullIfEmpty(data.paragraph_text),
      visual_prompt: nullIfEmpty(data.visual_prompt),
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
    comments: input.comments ?? null,
    shares: input.shares ?? null,
    link_clicks: input.link_clicks ?? null,
    notes: nullIfEmpty(input.notes),
    next_action: nullIfEmpty(input.next_action),
  })

  if (error) return { error: error.message }

  await supabase
    .from('social_posts')
    .update({ metrics_done: true, status: 'reviewed' })
    .eq('id', input.post_id)
    .eq('user_id', user.id)

  revalidatePath(SOCIAL_PATH)
  return { success: true }
}

export async function generateWeeklyFacebookPlan(campaignId: string, sourceId?: string) {
  const { supabase, user } = await requireUser()
  const { data: campaign, error } = await supabase
    .from('social_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .single()

  if (error || !campaign) return { error: error?.message || 'Campaign tidak ditemukan.' }

  let source: SocialSourceOption | null = null
  if (sourceId) {
    const dashboard = await getSocialDashboardData(campaignId)
    source = dashboard.sources.find((item) => item.id === sourceId) ?? null
  }

  const sourceUrl =
    source?.type === 'post'
      ? `${SITE_URL}${getPostPath(source.slug)}`
      : source?.type === 'panduan'
        ? `${SITE_URL}${getPanduanPath(source.slug)}`
        : undefined

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
      source_summary: compactContent(source?.description || source?.content),
      source_url: sourceUrl,
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
        visual_prompt: nullIfEmpty(draft.visual_prompt),
        objective: draft.objective,
        content_pillar: draft.content_pillar,
        caption_done: Boolean(draft.body),
        cta_done: Boolean(draft.cta),
        visual_prompt_done: Boolean(draft.visual_prompt),
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
          title_text: slide.title_text,
          paragraph_text: nullIfEmpty(slide.paragraph_text),
          visual_prompt: slide.visual_prompt,
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
      visual_prompt: result.data.visual_prompt,
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

  const source = await getSourceByPost(supabase, post as SocialPost)
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
      slide_count: 7,
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
      title_text: slide.title_text,
      paragraph_text: nullIfEmpty(slide.paragraph_text),
      visual_prompt: slide.visual_prompt,
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
      layout_type: post.post_type === 'carousel' ? 'Facebook carousel cover, 1:1' : 'Facebook feed image, 1:1',
      tone_note: post.notes || undefined,
    },
    { userId: user.id, targetType: 'social', targetId: postId }
  )

  if (!result.success) return { error: result.error }

  const { error: updateError } = await supabase
    .from('social_posts')
    .update({ visual_prompt: result.data.visual_prompt, visual_prompt_done: true })
    .eq('id', postId)
    .eq('user_id', user.id)

  if (updateError) return { error: updateError.message }
  revalidatePath(SOCIAL_PATH)
  return { success: true }
}
