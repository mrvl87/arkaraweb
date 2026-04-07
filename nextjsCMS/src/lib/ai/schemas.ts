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
  'generate_image_prompts',
  'generate_cluster_ideas',
  'rewrite_section',
  'expand_section',
  'generate_faq',
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

export const GenerateFullDraftOutputSchema = z.object({
  content: z.string().min(1),
  word_count: z.number().optional(),
  suggested_slug: z.string().optional(),
  suggested_meta_title: z.string().optional(),
  suggested_meta_desc: z.string().optional(),
})
export type GenerateFullDraftOutput = z.infer<typeof GenerateFullDraftOutputSchema>

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
