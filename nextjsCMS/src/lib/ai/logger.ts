/**
 * AI Logger — Logs all AI generations to Supabase `ai_generations` table.
 *
 * Stores input_json + prompt_version (not raw prompt text) for efficiency.
 * Records model, status, output, and error messages for auditing.
 */

import { createClient } from '@/lib/supabase/server'
import type { AIOperation } from './schemas'

export interface LogGenerationParams {
  userId?: string | null
  targetType?: 'post' | 'panduan' | 'workspace' | null
  targetId?: string | null
  operation: AIOperation
  model: string
  status: 'success' | 'error'
  inputJson: Record<string, unknown>
  outputJson: Record<string, unknown>
  promptVersion?: string
  errorMessage?: string | null
}

/**
 * Insert a generation log entry into `ai_generations`.
 * This function does not throw — it logs errors silently so as not to
 * break the main AI flow if logging fails.
 */
export async function logGeneration(params: LogGenerationParams): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('ai_generations').insert({
      user_id: params.userId ?? null,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      operation: params.operation,
      model: params.model,
      status: params.status,
      input_json: params.inputJson,
      output_json: params.outputJson,
      prompt_version: params.promptVersion ?? 'v1',
      error_message: params.errorMessage ?? null,
    })

    if (error) {
      console.error('[AI Logger] Failed to log generation:', error.message)
    }
  } catch (err) {
    console.error('[AI Logger] Exception during logging:', err)
  }
}
