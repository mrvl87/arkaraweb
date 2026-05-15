/**
 * AI Schemas — Zod schemas for structured AI input/output validation.
 * Every AI operation has a typed input and output shape.
 */

import { z } from 'zod'

// ─── Operation Types ─────────────────────────────────────────────
export const AI_OPERATIONS = [
  'generate_slug',
  'generate_seo_pack',
  'generate_outline',
  'generate_full_draft',
  'generate_mobile_reader_structure',
  'generate_image_prompts',
  'generate_cluster_ideas',
  'rewrite_section',
  'expand_section',
  'generate_faq',
  'research_with_web',
  'verify_latest_facts',
  'generate_facebook_weekly_plan',
  'generate_facebook_post',
  'generate_facebook_carousel',
  'generate_facebook_visual_prompt',
] as const

export type AIOperation = (typeof AI_OPERATIONS)[number]

// ─── Generate Slug ───────────────────────────────────────────────
export const GenerateSlugInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
})
export type GenerateSlugInput = z.infer<typeof GenerateSlugInputSchema>

export const GenerateSlugOutputSchema = z.object({
  slug: z.string().min(1),
  alternatives: z.array(z.string()).optional(),
})
export type GenerateSlugOutput = z.infer<typeof GenerateSlugOutputSchema>

// ─── Generate SEO Pack ───────────────────────────────────────────
export const GenerateSEOPackInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  description: z.string().optional(),
})
export type GenerateSEOPackInput = z.infer<typeof GenerateSEOPackInputSchema>

export const GenerateSEOPackOutputSchema = z.object({
  meta_title: z.string().min(1),
  meta_desc: z.string().min(1),
  excerpt: z.string().min(1),
  focus_keyword: z.string().min(1),
  secondary_keywords: z.array(z.string()).optional(),
})
export type GenerateSEOPackOutput = z.infer<typeof GenerateSEOPackOutputSchema>

// ─── Generate Outline ────────────────────────────────────────────
export const GenerateOutlineInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  keyword: z.string().optional(),
  angle: z.string().optional(),
  audience: z.string().optional(),
  notes: z.string().optional(),
})
export type GenerateOutlineInput = z.infer<typeof GenerateOutlineInputSchema>

export const OutlineSectionSchema = z.object({
  heading: z.string(),
  subheadings: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

export const GenerateOutlineOutputSchema = z.object({
  outline_title: z.string(),
  sections: z.array(OutlineSectionSchema).min(1),
  estimated_word_count: z.number().optional(),
})
export type GenerateOutlineOutput = z.infer<typeof GenerateOutlineOutputSchema>

// ─── Generate Full Draft ─────────────────────────────────────────
export const GenerateFullDraftInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  keyword: z.string().optional(),
  angle: z.string().optional(),
  audience: z.string().optional(),
  notes: z.string().optional(),
  outline: z.string().optional(),
})
export type GenerateFullDraftInput = z.infer<typeof GenerateFullDraftInputSchema>

export const EditorialFormatSchema = z.enum(['legacy', 'mobile_reader', 'technical_guide'])

export const MobileReaderFAQItemSchema = z.object({
  question: z.string().trim().min(1).max(220),
  answer: z.string().trim().min(1).max(700),
})

export const GenerateFullDraftOutputSchema = z.object({
  content: z.string().trim().min(1),
  quick_answer: z.string().trim().min(80).max(700),
  key_takeaways: z.array(z.string().trim().min(1).max(280)).min(3).max(5),
  faq: z.array(MobileReaderFAQItemSchema).min(3).max(5),
  editorial_format: EditorialFormatSchema.optional().default('mobile_reader'),
  word_count: z.number().optional(),
  suggested_slug: z.string().optional(),
  suggested_meta_title: z.string().optional(),
  suggested_meta_desc: z.string().optional(),
})
export type GenerateFullDraftOutput = z.infer<typeof GenerateFullDraftOutputSchema>

export const GenerateMobileReaderStructureInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(180, 'Title is too long'),
  content: z.string().trim().min(80, 'Content is required').max(50000, 'Content is too long'),
  description: z.string().trim().max(500, 'Description is too long').optional(),
})
export type GenerateMobileReaderStructureInput = z.infer<typeof GenerateMobileReaderStructureInputSchema>

export const GenerateMobileReaderStructureOutputSchema = z.object({
  quick_answer: z.string().trim().min(80).max(700),
  key_takeaways: z.array(z.string().trim().min(1).max(280)).min(3).max(5),
  faq: z.array(MobileReaderFAQItemSchema).min(3).max(5),
  editorial_format: z.enum(['mobile_reader', 'technical_guide']).default('mobile_reader'),
})
export type GenerateMobileReaderStructureOutput = z.infer<typeof GenerateMobileReaderStructureOutputSchema>

// ─── Generate Cluster Ideas ──────────────────────────────────────
export const GenerateImagePromptsInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(180, 'Title is too long'),
  content: z.string().trim().min(1, 'Content is required'),
  excerpt: z.string().trim().max(320, 'Excerpt is too long').optional(),
  focus_keyword: z.string().trim().max(120, 'Focus keyword is too long').optional(),
  category: z.string().trim().max(120, 'Category is too long').optional(),
})
export type GenerateImagePromptsInput = z.infer<typeof GenerateImagePromptsInputSchema>

export const ImagePromptItemSchema = z.object({
  label: z.string().trim().min(1).max(80),
  prompt: z.string().trim().min(1).max(2000),
})

export const GenerateImagePromptsOutputSchema = z.object({
  art_direction: z.string().trim().min(1).max(320),
  hero_prompts: z.array(ImagePromptItemSchema).min(3).max(4),
})
export type GenerateImagePromptsOutput = z.infer<typeof GenerateImagePromptsOutputSchema>

export const GenerateClusterIdeasInputSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  existing_titles: z.array(z.string()).optional(),
  source_title: z.string().optional(),
  source_slug: z.string().optional(),
  source_description: z.string().optional(),
  source_content: z.string().optional(),
  source_category: z.string().optional(),
  source_status: z.enum(['draft', 'published']).optional(),
})
export type GenerateClusterIdeasInput = z.infer<typeof GenerateClusterIdeasInputSchema>

export const ClusterIdeaSchema = z.object({
  title: z.string(),
  angle: z.string(),
  target_keyword: z.string(),
  content_type: z.enum(['post', 'panduan']).optional(),
})

export const GenerateClusterIdeasOutputSchema = z.object({
  pillar_topic: z.string(),
  ideas: z.array(ClusterIdeaSchema).min(1),
})
export type GenerateClusterIdeasOutput = z.infer<typeof GenerateClusterIdeasOutputSchema>

// --- Facebook Social Tracker ---
export const FacebookPostTypeSchema = z.enum([
  'narrative',
  'checklist',
  'carousel',
  'opinion',
  'article_link',
  'question',
  'poll',
  'recap',
  'short_video',
])

export const FacebookObjectiveSchema = z.enum([
  'awareness',
  'trust_building',
  'comment',
  'share',
  'save',
  'website_traffic',
  'audience_research',
  'community_building',
  'brand_positioning',
])

export const FacebookCarouselSlideDraftSchema = z.object({
  slide_number: z.number().int().min(1).max(12),
  purpose: z.string().trim().min(1).max(120),
  title_text: z.string().trim().min(1).max(140),
  paragraph_text: z.string().trim().max(360).optional().default(''),
  visual_prompt: z.string().trim().min(1).max(2200),
})
export type FacebookCarouselSlideDraft = z.infer<typeof FacebookCarouselSlideDraftSchema>

export const FacebookSocialPostDraftSchema = z.object({
  day: z.string().trim().min(1).max(40),
  scheduled_date: z.string().trim().min(1).max(20),
  scheduled_time: z.string().trim().min(1).max(10),
  post_type: FacebookPostTypeSchema,
  title: z.string().trim().min(1).max(180),
  hook: z.string().trim().min(1).max(320),
  body: z.string().trim().min(1).max(5000),
  cta: z.string().trim().min(1).max(500),
  objective: z.string().trim().min(1).max(120),
  content_pillar: z.string().trim().min(1).max(160),
  visual_prompt: z.string().trim().max(2200).optional().default(''),
  slides: z.array(FacebookCarouselSlideDraftSchema).max(10).optional().default([]),
})
export type FacebookSocialPostDraft = z.infer<typeof FacebookSocialPostDraftSchema>

export const GenerateFacebookWeeklyPlanInputSchema = z.object({
  campaign_title: z.string().trim().min(1, 'Campaign title is required').max(180),
  theme: z.string().trim().min(1, 'Theme is required').max(1200),
  start_date: z.string().trim().min(1, 'Start date is required').max(20),
  end_date: z.string().trim().max(20).optional(),
  primary_goal: z.string().trim().max(240).optional(),
  content_pillar: z.string().trim().max(180).optional(),
  tone_note: z.string().trim().max(500).optional(),
  source_title: z.string().trim().max(180).optional(),
  source_summary: z.string().trim().max(2200).optional(),
  source_url: z.string().trim().max(500).optional(),
})
export type GenerateFacebookWeeklyPlanInput = z.infer<typeof GenerateFacebookWeeklyPlanInputSchema>

export const GenerateFacebookWeeklyPlanOutputSchema = z.object({
  campaign_summary: z.string().trim().min(1).max(500),
  posts: z.array(FacebookSocialPostDraftSchema).min(7).max(7),
})
export type GenerateFacebookWeeklyPlanOutput = z.infer<typeof GenerateFacebookWeeklyPlanOutputSchema>

export const GenerateFacebookPostInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(180),
  post_type: FacebookPostTypeSchema,
  hook: z.string().trim().max(320).optional(),
  source_title: z.string().trim().max(180).optional(),
  source_summary: z.string().trim().max(2200).optional(),
  source_url: z.string().trim().max(500).optional(),
  primary_goal: z.string().trim().max(240).optional(),
  content_pillar: z.string().trim().max(180).optional(),
  tone_note: z.string().trim().max(500).optional(),
})
export type GenerateFacebookPostInput = z.infer<typeof GenerateFacebookPostInputSchema>

export const GenerateFacebookPostOutputSchema = z.object({
  title: z.string().trim().min(1).max(180),
  hook: z.string().trim().min(1).max(320),
  body: z.string().trim().min(1).max(5000),
  cta: z.string().trim().min(1).max(500),
  visual_prompt: z.string().trim().min(1).max(2200),
})
export type GenerateFacebookPostOutput = z.infer<typeof GenerateFacebookPostOutputSchema>

export const GenerateFacebookCarouselInputSchema = GenerateFacebookPostInputSchema.extend({
  slide_count: z.number().int().min(3).max(10).optional().default(7),
})
export type GenerateFacebookCarouselInput = z.infer<typeof GenerateFacebookCarouselInputSchema>

export const GenerateFacebookCarouselOutputSchema = z.object({
  slides: z.array(FacebookCarouselSlideDraftSchema).min(3).max(10),
})
export type GenerateFacebookCarouselOutput = z.infer<typeof GenerateFacebookCarouselOutputSchema>

export const GenerateFacebookVisualPromptInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(180),
  context: z.string().trim().min(1, 'Context is required').max(2000),
  layout_type: z.string().trim().max(120).optional(),
  tone_note: z.string().trim().max(500).optional(),
})
export type GenerateFacebookVisualPromptInput = z.infer<typeof GenerateFacebookVisualPromptInputSchema>

export const GenerateFacebookVisualPromptOutputSchema = z.object({
  visual_prompt: z.string().trim().min(1).max(2200),
})
export type GenerateFacebookVisualPromptOutput = z.infer<typeof GenerateFacebookVisualPromptOutputSchema>

// ─── Rewrite Section ─────────────────────────────────────────────
export const RewriteSectionInputSchema = z.object({
  section_text: z.string().min(1),
  instruction: z.string().optional(),
  tone: z.string().optional(),
})
export type RewriteSectionInput = z.infer<typeof RewriteSectionInputSchema>

export const RewriteSectionOutputSchema = z.object({
  rewritten_text: z.string().min(1),
})
export type RewriteSectionOutput = z.infer<typeof RewriteSectionOutputSchema>

// ─── Expand Section ──────────────────────────────────────────────
export const ExpandSectionInputSchema = z.object({
  section_text: z.string().min(1),
  direction: z.string().optional(),
})
export type ExpandSectionInput = z.infer<typeof ExpandSectionInputSchema>

export const ExpandSectionOutputSchema = z.object({
  expanded_text: z.string().min(1),
})
export type ExpandSectionOutput = z.infer<typeof ExpandSectionOutputSchema>

// ─── Generate FAQ ────────────────────────────────────────────────
export const GenerateFAQInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
})
export type GenerateFAQInput = z.infer<typeof GenerateFAQInputSchema>

export const FAQItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
})

export const GenerateFAQOutputSchema = z.object({
  faqs: z.array(FAQItemSchema).min(1),
})
export type GenerateFAQOutput = z.infer<typeof GenerateFAQOutputSchema>

// —— Research With Web (Core Contract) ————————————————————————————————————————
export const ResearchPrioritySchema = z.enum(['high', 'medium', 'low'])

export const ResearchWithWebInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(180, 'Title is too long'),
  content: z.string().trim().max(8000, 'Content is too long').optional(),
  question: z.string().trim().max(300, 'Question is too long').optional(),
  audience: z.string().trim().max(180, 'Audience is too long').optional(),
  notes: z.string().trim().max(1000, 'Notes are too long').optional(),
})
export type ResearchWithWebInput = z.infer<typeof ResearchWithWebInputSchema>

export const ResearchAgendaItemSchema = z.object({
  question: z.string().trim().min(1).max(240),
  reason: z.string().trim().min(1).max(320),
  suggested_query: z.string().trim().min(1).max(240),
  priority: ResearchPrioritySchema,
})

export const ResearchWithWebOutputSchema = z.object({
  research_goal: z.string().trim().min(1).max(320),
  recommended_queries: z.array(z.string().trim().min(1).max(240)).min(3).max(6),
  research_agenda: z.array(ResearchAgendaItemSchema).min(3).max(6),
  watchouts: z.array(z.string().trim().min(1).max(240)).max(5).default([]),
})
export type ResearchWithWebOutput = z.infer<typeof ResearchWithWebOutputSchema>

export const ResearchWithWebResponseJsonSchema = {
  type: 'object',
  properties: {
    research_goal: { type: 'string' },
    recommended_queries: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 6,
    },
    research_agenda: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          reason: { type: 'string' },
          suggested_query: { type: 'string' },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
          },
        },
        required: ['question', 'reason', 'suggested_query', 'priority'],
      },
    },
    watchouts: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['research_goal', 'recommended_queries', 'research_agenda', 'watchouts'],
} as const

// —— Verify Latest Facts (Core Contract) ———————————————————————————————————————
export const FactCheckStatusSchema = z.enum([
  'needs_web_verification',
  'needs_update',
  'unsupported',
  'uncertain',
])

export const VerificationSourceSchema = z.object({
  title: z.string().trim().min(1).max(240),
  url: z.string().trim().url().max(500).optional(),
  publisher: z.string().trim().max(180).optional(),
  note: z.string().trim().max(240).optional(),
})

export const VerifyLatestFactsInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(180, 'Title is too long'),
  content: z.string().trim().min(1, 'Content is required').max(12000, 'Content is too long'),
  excerpt: z.string().trim().max(320, 'Excerpt is too long').optional(),
  focus_area: z.string().trim().max(240, 'Focus area is too long').optional(),
})
export type VerifyLatestFactsInput = z.infer<typeof VerifyLatestFactsInputSchema>

export const VerifiedClaimSchema = z.object({
  claim: z.string().trim().min(1).max(500),
  status: FactCheckStatusSchema,
  reason: z.string().trim().min(1).max(500),
  suggested_revision: z.string().trim().max(800).optional(),
  sources: z.array(VerificationSourceSchema).max(5).default([]),
})

export const VerifyLatestFactsOutputSchema = z.object({
  summary: z.string().trim().min(1).max(500),
  checked_at: z.string().default(''),
  claims: z.array(VerifiedClaimSchema).min(1).max(8),
})
export type VerifyLatestFactsOutput = z.infer<typeof VerifyLatestFactsOutputSchema>

export const VerifyLatestFactsResponseJsonSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    checked_at: { type: 'string' },
    claims: {
      type: 'array',
      minItems: 1,
      maxItems: 8,
      items: {
        type: 'object',
        properties: {
          claim: { type: 'string' },
          status: {
            type: 'string',
            enum: ['needs_web_verification', 'needs_update', 'unsupported', 'uncertain'],
          },
          reason: { type: 'string' },
          suggested_revision: { type: 'string' },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                url: { type: 'string' },
                publisher: { type: 'string' },
                note: { type: 'string' },
              },
              required: ['title'],
            },
          },
        },
        required: ['claim', 'status', 'reason', 'sources'],
      },
    },
  },
  required: ['summary', 'checked_at', 'claims'],
} as const

// ─── Logger Schema ───────────────────────────────────────────────
export const AIGenerationLogSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  target_type: z.enum(['post', 'panduan', 'workspace']).nullable().optional(),
  target_id: z.string().uuid().nullable().optional(),
  operation: z.enum(AI_OPERATIONS),
  model: z.string(),
  status: z.enum(['success', 'error']).default('success'),
  input_json: z.any().default({}),
  output_json: z.any().default({}),
  prompt_version: z.string().default('v1'),
  error_message: z.string().nullable().optional(),
})
export type AIGenerationLog = z.infer<typeof AIGenerationLogSchema>
