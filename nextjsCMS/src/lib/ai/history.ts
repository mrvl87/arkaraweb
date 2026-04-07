import { createClient } from '@/lib/supabase/server'
import {
  type AIOperation,
  GenerateFullDraftInputSchema,
  GenerateFullDraftOutputSchema,
  GenerateImagePromptsInputSchema,
  GenerateImagePromptsOutputSchema,
  GenerateSEOPackInputSchema,
  GenerateSEOPackOutputSchema,
  GenerateSlugInputSchema,
  GenerateSlugOutputSchema,
  type GenerateFullDraftInput,
  type GenerateFullDraftOutput,
  type GenerateImagePromptsInput,
  type GenerateImagePromptsOutput,
  type GenerateSEOPackInput,
  type GenerateSEOPackOutput,
  type GenerateSlugInput,
  type GenerateSlugOutput,
} from './schemas'

type TargetType = 'post' | 'panduan'

interface AIGenerationRow {
  operation: AIOperation
  input_json: unknown
  output_json: unknown
  model: string
  created_at: string
}

export interface RestoredGeneration<TInput, TOutput> {
  input: TInput
  output: TOutput
  model: string
  createdAt: string
}

export interface FormAIHistoryState {
  slug?: RestoredGeneration<GenerateSlugInput, GenerateSlugOutput>
  seoPack?: RestoredGeneration<GenerateSEOPackInput, GenerateSEOPackOutput>
  fullDraft?: RestoredGeneration<GenerateFullDraftInput, GenerateFullDraftOutput>
  imagePrompts?: RestoredGeneration<GenerateImagePromptsInput, GenerateImagePromptsOutput>
}

function parseGeneration<TInput, TOutput>(
  row: AIGenerationRow | undefined,
  inputSchema: { safeParse: (value: unknown) => { success: true; data: TInput } | { success: false } },
  outputSchema: { safeParse: (value: unknown) => { success: true; data: TOutput } | { success: false } }
): RestoredGeneration<TInput, TOutput> | undefined {
  if (!row) {
    return undefined
  }

  const inputResult = inputSchema.safeParse(row.input_json)
  const outputResult = outputSchema.safeParse(row.output_json)

  if (!inputResult.success || !outputResult.success) {
    return undefined
  }

  return {
    input: inputResult.data,
    output: outputResult.data,
    model: row.model,
    createdAt: row.created_at,
  }
}

export async function getFormAIHistoryState(
  targetType: TargetType,
  targetId: string,
  options?: {
    fallbackTitle?: string | null
    fallbackCreatedAt?: string | null
  }
): Promise<FormAIHistoryState> {
  const supabase = await createClient()
  const operations: AIOperation[] = [
    'generate_slug',
    'generate_seo_pack',
    'generate_full_draft',
    'generate_image_prompts',
  ]

  const { data, error } = await supabase
    .from('ai_generations')
    .select('operation, input_json, output_json, model, created_at')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('status', 'success')
    .in('operation', operations)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[AI History] Failed to fetch generation history:', error.message)
    return {}
  }

  let rows = (data ?? []) as AIGenerationRow[]

  if (rows.length === 0 && options?.fallbackTitle) {
    const fallbackQuery = supabase
      .from('ai_generations')
      .select('operation, input_json, output_json, model, created_at')
      .eq('target_type', targetType)
      .is('target_id', null)
      .eq('status', 'success')
      .in('operation', operations)
      .contains('input_json', { title: options.fallbackTitle })
      .order('created_at', { ascending: false })

    if (options.fallbackCreatedAt) {
      const createdAt = new Date(options.fallbackCreatedAt)
      const from = new Date(createdAt.getTime() - 6 * 60 * 60 * 1000).toISOString()
      const to = new Date(createdAt.getTime() + 10 * 60 * 1000).toISOString()
      fallbackQuery.gte('created_at', from).lte('created_at', to)
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery

    if (fallbackError) {
      console.error('[AI History] Failed to fetch fallback generation history:', fallbackError.message)
    } else {
      rows = (fallbackData ?? []) as AIGenerationRow[]
    }
  }

  if (rows.length === 0 && options?.fallbackCreatedAt) {
    const createdAt = new Date(options.fallbackCreatedAt)
    const from = new Date(createdAt.getTime() - 6 * 60 * 60 * 1000).toISOString()
    const to = new Date(createdAt.getTime() + 10 * 60 * 1000).toISOString()

    const { data: timeWindowData, error: timeWindowError } = await supabase
      .from('ai_generations')
      .select('operation, input_json, output_json, model, created_at')
      .eq('target_type', targetType)
      .is('target_id', null)
      .eq('status', 'success')
      .in('operation', operations)
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false })

    if (timeWindowError) {
      console.error('[AI History] Failed to fetch time-window generation history:', timeWindowError.message)
    } else {
      rows = (timeWindowData ?? []) as AIGenerationRow[]
    }
  }

  const latestByOperation = new Map<AIOperation, AIGenerationRow>()

  for (const row of rows) {
    if (!latestByOperation.has(row.operation)) {
      latestByOperation.set(row.operation, row)
    }
  }

  return {
    slug: parseGeneration(
      latestByOperation.get('generate_slug'),
      GenerateSlugInputSchema,
      GenerateSlugOutputSchema
    ),
    seoPack: parseGeneration(
      latestByOperation.get('generate_seo_pack'),
      GenerateSEOPackInputSchema,
      GenerateSEOPackOutputSchema
    ),
    fullDraft: parseGeneration(
      latestByOperation.get('generate_full_draft'),
      GenerateFullDraftInputSchema,
      GenerateFullDraftOutputSchema
    ),
    imagePrompts: parseGeneration(
      latestByOperation.get('generate_image_prompts'),
      GenerateImagePromptsInputSchema,
      GenerateImagePromptsOutputSchema
    ),
  }
}
