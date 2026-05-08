/**
 * AI Parser — Main guardrail for structured output.
 *
 * Responsibilities:
 * 1. Extract JSON from raw LLM response (may be wrapped in markdown fences)
 * 2. Sanitize fenced code blocks (```json ... ```)
 * 3. Fallback if model returns plain text
 * 4. Validate extracted data against Zod schema
 * 5. Optionally retry with a repair prompt
 */

import { z } from 'zod'
import { callAI, type AIMessage } from './client'

function extractBalancedJSON(raw: string): string | null {
  let startIndex = -1
  let quote: '"' | "'" | null = null
  let escaped = false
  let depth = 0

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index]

    if (quote) {
      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\') {
        escaped = true
        continue
      }

      if (char === quote) {
        quote = null
      }

      continue
    }

    if (char === '"' || char === "'") {
      quote = char as '"' | "'"
      continue
    }

    if (startIndex === -1) {
      if (char === '{' || char === '[') {
        startIndex = index
        depth = 1
      }
      continue
    }

    if (char === '{' || char === '[') {
      depth += 1
      continue
    }

    if (char === '}' || char === ']') {
      depth -= 1

      if (depth === 0) {
        return raw.slice(startIndex, index + 1).trim()
      }
    }
  }

  return null
}

function escapeControlCharsInStrings(jsonString: string): string {
  let result = ''
  let inString = false
  let escaped = false

  for (const char of jsonString) {
    if (escaped) {
      result += char
      escaped = false
      continue
    }

    if (char === '\\') {
      result += char
      escaped = true
      continue
    }

    if (char === '"') {
      result += char
      inString = !inString
      continue
    }

    if (inString) {
      if (char === '\n') {
        result += '\\n'
        continue
      }
      if (char === '\r') {
        result += '\\r'
        continue
      }
      if (char === '\t') {
        result += '\\t'
        continue
      }
    }

    result += char
  }

  return result
}

/**
 * Extract the first JSON object or array from a string.
 * Handles markdown fenced blocks and raw JSON with balanced scanning.
 */
export function extractJSON(raw: string): string | null {
  const fencedMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/i)
  if (fencedMatch?.[1]) {
    const fencedContent = fencedMatch[1].trim()
    return extractBalancedJSON(fencedContent) ?? fencedContent
  }

  return extractBalancedJSON(raw)
}

/**
 * Attempt to fix common JSON issues from LLM output.
 */
function sanitizeJSON(jsonString: string): string {
  let cleaned = jsonString

  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')

  // Remove BOM and zero-width characters
  cleaned = cleaned.replace(/[\uFEFF\u200B\u200C\u200D]/g, '')

  // Fix unescaped newlines inside JSON string values
  // This is a heuristic — we replace literal newlines between quotes
  cleaned = cleaned.replace(/(?<=": ")([\s\S]*?)(?="[,\n\r\t ]*["}])/g, (match) => {
    return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
  })

  return cleaned
}

/**
 * Parse raw AI response text into a validated Zod schema.
 *
 * @param raw - Raw text from AI response
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated data
 * @throws Error if parsing or validation fails
 */
export function parseAIResponse<T>(raw: string, schema: z.ZodType<T>): T {
  const jsonString = extractJSON(raw)

  if (!jsonString) {
    throw new ParseError(
      'Could not extract JSON from AI response.',
      raw
    )
  }

  const sanitized = sanitizeJSON(escapeControlCharsInStrings(jsonString))

  let parsed: unknown
  try {
    parsed = JSON.parse(sanitized)
  } catch {
    throw new ParseError(
      'Failed to parse JSON from AI response.',
      sanitized
    )
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${(i.path as unknown[]).join('.')}: ${i.message}`)
      .join('; ')
    throw new ParseError(
      `AI output validation failed: ${issues}`,
      JSON.stringify(parsed, null, 2)
    )
  }

  return result.data
}

/**
 * Parse AI response with automatic retry using a repair prompt.
 * If the first parse fails, sends the error back to the AI to fix.
 */
export async function parseWithRetry<T>(
  raw: string,
  schema: z.ZodType<T>,
  options?: {
    maxRetries?: number
    repairInstruction?: string
    repairMaxTokens?: number
    repairTimeoutMs?: number
    repairMaxRetries?: number
    repairReasoning?: {
      effort?: 'xhigh' | 'high' | 'medium' | 'low' | 'minimal' | 'none'
      maxTokens?: number
      exclude?: boolean
      enabled?: boolean
    }
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 1

  try {
    return parseAIResponse(raw, schema)
  } catch (error) {
    if (maxRetries <= 0 || !(error instanceof ParseError)) {
      throw error
    }

    // Build repair prompt
    const repairMessages: AIMessage[] = [
      {
        role: 'system',
        content:
          'Anda diminta untuk memperbaiki output JSON yang rusak. Balas HANYA dengan JSON yang valid, tanpa penjelasan.',
      },
      {
        role: 'user',
        content: `Output JSON berikut gagal diparse atau validasi:

${error.rawContent}

Error: ${error.message}

${options?.repairInstruction ? `${options.repairInstruction}\n\n` : ''}Perbaiki dan balas HANYA dengan JSON yang valid sesuai struktur yang diminta.`,
      },
    ]

    const repairResponse = await callAI(repairMessages, {
      temperature: 0.1,
      maxTokens: options?.repairMaxTokens,
      timeoutMs: options?.repairTimeoutMs,
      maxRetries: options?.repairMaxRetries ?? 0,
      reasoning: options?.repairReasoning,
    })

    return parseAIResponse(repairResponse.content, schema)
  }
}

/**
 * Custom error class for parse failures, preserving raw content for debugging.
 */
export class ParseError extends Error {
  public rawContent: string

  constructor(message: string, rawContent: string) {
    super(message)
    this.name = 'ParseError'
    this.rawContent = rawContent
  }
}
