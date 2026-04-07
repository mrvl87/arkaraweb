"use server"

/**
 * AI Server Actions — Post form integration.
 *
 * Thin server action layer specifically for post editing context.
 * Passes target_type='post' and target_id for accurate logging.
 */

import {
  generateSlug,
  generateSeoPack,
  generateOutline,
  generateFullDraft,
  generateImagePrompts,
  rewriteSection,
  expandSection,
  generateFAQ,
} from '@/lib/ai/operations'
import type {
  GenerateSlugInput,
  GenerateSEOPackInput,
  GenerateOutlineInput,
  GenerateFullDraftInput,
  GenerateImagePromptsInput,
  RewriteSectionInput,
  ExpandSectionInput,
  GenerateFAQInput,
} from '@/lib/ai/schemas'

interface PostContext {
  postId?: string
}

export async function postAIGenerateSlug(input: GenerateSlugInput, ctx?: PostContext) {
  return generateSlug(input, {
    targetType: 'post',
    targetId: ctx?.postId,
  })
}

export async function postAIGenerateSeoPack(input: GenerateSEOPackInput, ctx?: PostContext) {
  return generateSeoPack(input, {
    targetType: 'post',
    targetId: ctx?.postId,
  })
}

export async function postAIGenerateOutline(input: GenerateOutlineInput, ctx?: PostContext) {
  return generateOutline(input, {
    targetType: 'post',
    targetId: ctx?.postId,
  })
}

export async function postAIGenerateFullDraft(input: GenerateFullDraftInput, ctx?: PostContext) {
  return generateFullDraft(input, {
    targetType: 'post',
    targetId: ctx?.postId,
  })
}

export async function postAIGenerateImagePrompts(input: GenerateImagePromptsInput, ctx?: PostContext) {
  return generateImagePrompts(input, {
    targetType: 'post',
    targetId: ctx?.postId,
  })
}

export async function postAIRewriteSection(input: RewriteSectionInput, ctx?: PostContext) {
  return rewriteSection(input, {
    targetType: 'post',
    targetId: ctx?.postId,
  })
}

export async function postAIExpandSection(input: ExpandSectionInput, ctx?: PostContext) {
  return expandSection(input, {
    targetType: 'post',
    targetId: ctx?.postId,
  })
}

export async function postAIGenerateFAQ(input: GenerateFAQInput, ctx?: PostContext) {
  return generateFAQ(input, {
    targetType: 'post',
    targetId: ctx?.postId,
  })
}
