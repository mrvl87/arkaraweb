/**
 * AI Operations — Pure orchestration layer.
 *
 * These functions combine client, prompts, parser, context, and logger
 * into clean, reusable operations. They are NOT server actions.
 *
 * Server actions in /app/cms/ call these operations.
 * This keeps the AI logic portable and reusable across:
 * - /cms/ai workspace
 * - post-form
 * - panduan-form
 * - future route handlers
 */

import { z } from 'zod'
import { callAI } from './client'
import { parseWithRetry } from './parser'
import { logGeneration } from './logger'
import { getInternalLinksContext } from './context'
import { PROMPT_VERSION, type AIContentProfile } from './prompt-profiles'
import * as prompts from './prompt-profiles'
import {
  GenerateSlugInputSchema,
  GenerateSlugOutputSchema,
  GenerateSEOPackInputSchema,
  GenerateSEOPackOutputSchema,
  GenerateOutlineInputSchema,
  GenerateOutlineOutputSchema,
  GenerateFullDraftInputSchema,
  GenerateFullDraftOutputSchema,
  GenerateImagePromptsInputSchema,
  GenerateImagePromptsOutputSchema,
  GenerateClusterIdeasInputSchema,
  GenerateClusterIdeasOutputSchema,
  RewriteSectionInputSchema,
  RewriteSectionOutputSchema,
  ExpandSectionInputSchema,
  ExpandSectionOutputSchema,
  GenerateFAQInputSchema,
  GenerateFAQOutputSchema,
  type GenerateSlugInput,
  type GenerateSlugOutput,
  type GenerateSEOPackInput,
  type GenerateSEOPackOutput,
  type GenerateOutlineInput,
  type GenerateOutlineOutput,
  type GenerateFullDraftInput,
  type GenerateFullDraftOutput,
  type GenerateImagePromptsInput,
  type GenerateImagePromptsOutput,
  type GenerateClusterIdeasInput,
  type GenerateClusterIdeasOutput,
  type RewriteSectionInput,
  type RewriteSectionOutput,
  type ExpandSectionInput,
  type ExpandSectionOutput,
  type GenerateFAQInput,
  type GenerateFAQOutput,
  type AIOperation,
} from './schemas'

// ─── Shared types for operation results ──────────────────────────
export interface OperationResult<T> {
  success: true
  data: T
  model: string
}

export interface OperationError {
  success: false
  error: string
}

export type OperationResponse<T> = OperationResult<T> | OperationError

interface OperationContext {
  userId?: string | null
  targetType?: 'post' | 'panduan' | 'workspace' | null
  targetId?: string | null
}

function normalizeSingleLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizePromptText(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeImagePromptsOutput(output: GenerateImagePromptsOutput): GenerateImagePromptsOutput {
  const seenPrompts = new Set<string>()
  const seenLabels = new Map<string, number>()

  const heroPrompts = output.hero_prompts
    .map((item, index) => {
      const prompt = normalizePromptText(item.prompt)
      const baseLabel = normalizeSingleLine(item.label) || `Hero Prompt ${index + 1}`
      return {
        label: baseLabel,
        prompt,
      }
    })
    .filter((item) => {
      if (!item.prompt) {
        return false
      }

      const dedupeKey = item.prompt.toLowerCase()
      if (seenPrompts.has(dedupeKey)) {
        return false
      }

      seenPrompts.add(dedupeKey)
      return true
    })
    .slice(0, 4)
    .map((item, index) => {
      const count = (seenLabels.get(item.label) ?? 0) + 1
      seenLabels.set(item.label, count)

      return {
        label: count === 1 ? item.label : `${item.label} ${count}`,
        prompt: item.prompt,
      }
    })

  if (heroPrompts.length < 3) {
    throw new Error('AI menghasilkan prompt gambar yang terlalu mirip. Silakan generate ulang.')
  }

  return {
    art_direction: normalizeSingleLine(output.art_direction),
    hero_prompts: heroPrompts,
  }
}

function resolveProfile(targetType?: OperationContext['targetType']): AIContentProfile {
  if (targetType === 'post' || targetType === 'panduan') {
    return targetType
  }

  return 'workspace'
}

// ─── Generate Slug ───────────────────────────────────────────────
export async function generateSlug(
  rawInput: GenerateSlugInput,
  ctx?: OperationContext
): Promise<OperationResponse<GenerateSlugOutput>> {
  const profile = resolveProfile(ctx?.targetType)
  return runOperation('generate_slug', rawInput, GenerateSlugInputSchema, GenerateSlugOutputSchema, (input) => prompts.buildSlugPrompt(input, profile), undefined, ctx)
}

// ─── Generate SEO Pack ───────────────────────────────────────────
export async function generateSeoPack(
  rawInput: GenerateSEOPackInput,
  ctx?: OperationContext
): Promise<OperationResponse<GenerateSEOPackOutput>> {
  const profile = resolveProfile(ctx?.targetType)
  return runOperation('generate_seo_pack', rawInput, GenerateSEOPackInputSchema, GenerateSEOPackOutputSchema, (input) => prompts.buildSEOPackPrompt(input, profile), undefined, ctx)
}

// ─── Generate Outline ────────────────────────────────────────────
export async function generateOutline(
  rawInput: GenerateOutlineInput,
  ctx?: OperationContext
): Promise<OperationResponse<GenerateOutlineOutput>> {
  const profile = resolveProfile(ctx?.targetType)
  return runOperation('generate_outline', rawInput, GenerateOutlineInputSchema, GenerateOutlineOutputSchema, async (input) => {
    const internalLinks = await getInternalLinksContext(input)
    return prompts.buildOutlinePrompt(input, internalLinks, profile)
  }, undefined, ctx)
}

// ─── Generate Full Draft ─────────────────────────────────────────
export async function generateFullDraft(
  rawInput: GenerateFullDraftInput,
  ctx?: OperationContext
): Promise<OperationResponse<GenerateFullDraftOutput>> {
  const profile = resolveProfile(ctx?.targetType)
  return runOperation('generate_full_draft', rawInput, GenerateFullDraftInputSchema, GenerateFullDraftOutputSchema, async (input) => {
    const internalLinks = await getInternalLinksContext(input)
    return prompts.buildFullDraftPrompt(input, internalLinks, profile)
  }, undefined, ctx)
}

// ─── Generate Cluster Ideas ──────────────────────────────────────
export async function generateImagePrompts(
  rawInput: GenerateImagePromptsInput,
  ctx?: OperationContext
): Promise<OperationResponse<GenerateImagePromptsOutput>> {
  const profile = resolveProfile(ctx?.targetType)
  return runOperation(
    'generate_image_prompts',
    rawInput,
    GenerateImagePromptsInputSchema,
    GenerateImagePromptsOutputSchema,
    (input) => prompts.buildImagePromptsPrompt(input, profile),
    normalizeImagePromptsOutput,
    ctx
  )
}

export async function generateClusterIdeas(
  rawInput: GenerateClusterIdeasInput,
  ctx?: OperationContext
): Promise<OperationResponse<GenerateClusterIdeasOutput>> {
  const profile = resolveProfile(ctx?.targetType)
  return runOperation('generate_cluster_ideas', rawInput, GenerateClusterIdeasInputSchema, GenerateClusterIdeasOutputSchema, (input) => prompts.buildClusterIdeasPrompt(input, profile), undefined, ctx)
}

// ─── Rewrite Section ─────────────────────────────────────────────
export async function rewriteSection(
  rawInput: RewriteSectionInput,
  ctx?: OperationContext
): Promise<OperationResponse<RewriteSectionOutput>> {
  const profile = resolveProfile(ctx?.targetType)
  return runOperation('rewrite_section', rawInput, RewriteSectionInputSchema, RewriteSectionOutputSchema, (input) => prompts.buildRewritePrompt(input, profile), undefined, ctx)
}

// ─── Expand Section ──────────────────────────────────────────────
export async function expandSection(
  rawInput: ExpandSectionInput,
  ctx?: OperationContext
): Promise<OperationResponse<ExpandSectionOutput>> {
  const profile = resolveProfile(ctx?.targetType)
  return runOperation('expand_section', rawInput, ExpandSectionInputSchema, ExpandSectionOutputSchema, (input) => prompts.buildExpandPrompt(input, profile), undefined, ctx)
}

// ─── Generate FAQ ────────────────────────────────────────────────
export async function generateFAQ(
  rawInput: GenerateFAQInput,
  ctx?: OperationContext
): Promise<OperationResponse<GenerateFAQOutput>> {
  const profile = resolveProfile(ctx?.targetType)
  return runOperation('generate_faq', rawInput, GenerateFAQInputSchema, GenerateFAQOutputSchema, (input) => prompts.buildFAQPrompt(input, profile), undefined, ctx)
}

// ─── Generic operation runner ────────────────────────────────────
async function runOperation<TInput extends Record<string, unknown>, TOutput extends Record<string, unknown>>(
  operation: AIOperation,
  rawInput: TInput,
  inputSchema: z.ZodType<TInput>,
  outputSchema: z.ZodType<TOutput>,
  buildMessages: (input: TInput) => Promise<ReturnType<typeof prompts.buildSlugPrompt>> | ReturnType<typeof prompts.buildSlugPrompt>,
  transformOutput?: (data: TOutput) => TOutput,
  ctx?: OperationContext
): Promise<OperationResponse<TOutput>> {
  // 1. Validate input
  const inputResult = inputSchema.safeParse(rawInput)
  if (!inputResult.success) {
    const issues = inputResult.error.issues
      .map((i) => `${(i.path as unknown[]).join('.')}: ${i.message}`)
      .join('; ')
    return { success: false, error: `Input validation failed: ${issues}` }
  }
  const validInput = inputResult.data

  try {
    // 2. Build prompt messages (may be async for context fetching)
    const messages = await Promise.resolve(buildMessages(validInput))

    // 3. Call AI
    const aiResponse = await callAI(messages)

    // 4. Parse and validate output with retry
    const parsedData = await parseWithRetry(aiResponse.content, outputSchema)
    const data = transformOutput ? transformOutput(parsedData) : parsedData

    // 5. Log success
    await logGeneration({
      userId: ctx?.userId,
      targetType: ctx?.targetType,
      targetId: ctx?.targetId,
      operation,
      model: aiResponse.model,
      status: 'success',
      inputJson: validInput as Record<string, unknown>,
      outputJson: data as Record<string, unknown>,
      promptVersion: PROMPT_VERSION,
    })

    return { success: true, data, model: aiResponse.model }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log error
    await logGeneration({
      userId: ctx?.userId,
      targetType: ctx?.targetType,
      targetId: ctx?.targetId,
      operation,
      model: 'unknown',
      status: 'error',
      inputJson: validInput as Record<string, unknown>,
      outputJson: {},
      promptVersion: PROMPT_VERSION,
      errorMessage,
    })

    return { success: false, error: errorMessage }
  }
}
