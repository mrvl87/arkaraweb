"use server"

import {
  generateSlug,
  generateSeoPack,
  generateFullDraft,
  generateMobileReaderStructure,
  generateImagePrompts,
  rewriteSection,
  expandSection,
  generateFAQ,
  researchWithWeb,
  verifyLatestFacts,
} from '@/lib/ai/operations'
import type {
  GenerateSlugInput,
  GenerateSEOPackInput,
  GenerateFullDraftInput,
  GenerateMobileReaderStructureInput,
  GenerateImagePromptsInput,
  RewriteSectionInput,
  ExpandSectionInput,
  GenerateFAQInput,
  ResearchWithWebInput,
  VerifyLatestFactsInput,
} from '@/lib/ai/schemas'

interface PanduanContext {
  panduanId?: string
}

export async function panduanAIGenerateSlug(input: GenerateSlugInput, ctx?: PanduanContext) {
  return generateSlug(input, {
    targetType: 'panduan',
    targetId: ctx?.panduanId,
  })
}

export async function panduanAIGenerateSeoPack(input: GenerateSEOPackInput, ctx?: PanduanContext) {
  return generateSeoPack(input, {
    targetType: 'panduan',
    targetId: ctx?.panduanId,
  })
}

export async function panduanAIGenerateFullDraft(input: GenerateFullDraftInput, ctx?: PanduanContext) {
  return generateFullDraft(input, {
    targetType: 'panduan',
    targetId: ctx?.panduanId,
  })
}

export async function panduanAIGenerateMobileReaderStructure(input: GenerateMobileReaderStructureInput, ctx?: PanduanContext) {
  return generateMobileReaderStructure(input, {
    targetType: 'panduan',
    targetId: ctx?.panduanId,
  })
}

export async function panduanAIGenerateImagePrompts(input: GenerateImagePromptsInput, ctx?: PanduanContext) {
  return generateImagePrompts(input, {
    targetType: 'panduan',
    targetId: ctx?.panduanId,
  })
}

export async function panduanAIRewriteSection(input: RewriteSectionInput, ctx?: PanduanContext) {
  return rewriteSection(input, {
    targetType: 'panduan',
    targetId: ctx?.panduanId,
  })
}

export async function panduanAIExpandSection(input: ExpandSectionInput, ctx?: PanduanContext) {
  return expandSection(input, {
    targetType: 'panduan',
    targetId: ctx?.panduanId,
  })
}

export async function panduanAIGenerateFAQ(input: GenerateFAQInput, ctx?: PanduanContext) {
  return generateFAQ(input, {
    targetType: 'panduan',
    targetId: ctx?.panduanId,
  })
}

export async function panduanAIResearchWithWeb(input: ResearchWithWebInput, ctx?: PanduanContext) {
  return researchWithWeb(input, {
    targetType: 'panduan',
    targetId: ctx?.panduanId,
  })
}

export async function panduanAIVerifyLatestFacts(input: VerifyLatestFactsInput, ctx?: PanduanContext) {
  return verifyLatestFacts(input, {
    targetType: 'panduan',
    targetId: ctx?.panduanId,
  })
}
