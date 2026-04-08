"use server"

/**
 * AI Server Actions — /cms/ai workspace.
 *
 * Thin server action layer that delegates to src/lib/ai/operations.
 * These are callable from client components in the AI workspace.
 */

import {
  generateSlug,
  generateSeoPack,
  generateOutline,
  generateFullDraft,
  generateImagePrompts,
  generateClusterIdeas,
  rewriteSection,
  expandSection,
  generateFAQ,
  researchWithWeb,
  verifyLatestFacts,
} from '@/lib/ai/operations'
import type {
  GenerateSlugInput,
  GenerateSEOPackInput,
  GenerateOutlineInput,
  GenerateFullDraftInput,
  GenerateImagePromptsInput,
  GenerateClusterIdeasInput,
  RewriteSectionInput,
  ExpandSectionInput,
  GenerateFAQInput,
  ResearchWithWebInput,
  VerifyLatestFactsInput,
} from '@/lib/ai/schemas'

// ─── Workspace context (no specific target) ──────────────────────
const workspaceCtx = { targetType: 'workspace' as const }

export async function actionGenerateSlug(input: GenerateSlugInput) {
  return generateSlug(input, workspaceCtx)
}

export async function actionGenerateSeoPack(input: GenerateSEOPackInput) {
  return generateSeoPack(input, workspaceCtx)
}

export async function actionGenerateOutline(input: GenerateOutlineInput) {
  return generateOutline(input, workspaceCtx)
}

export async function actionGenerateFullDraft(input: GenerateFullDraftInput) {
  return generateFullDraft(input, workspaceCtx)
}

export async function actionGenerateImagePrompts(input: GenerateImagePromptsInput) {
  return generateImagePrompts(input, workspaceCtx)
}

export async function actionGenerateClusterIdeas(input: GenerateClusterIdeasInput) {
  return generateClusterIdeas(input, workspaceCtx)
}

export async function actionRewriteSection(input: RewriteSectionInput) {
  return rewriteSection(input, workspaceCtx)
}

export async function actionExpandSection(input: ExpandSectionInput) {
  return expandSection(input, workspaceCtx)
}

export async function actionGenerateFAQ(input: GenerateFAQInput) {
  return generateFAQ(input, workspaceCtx)
}

export async function actionResearchWithWeb(input: ResearchWithWebInput) {
  return researchWithWeb(input, workspaceCtx)
}

export async function actionVerifyLatestFacts(input: VerifyLatestFactsInput) {
  return verifyLatestFacts(input, workspaceCtx)
}
