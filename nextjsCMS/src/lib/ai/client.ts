/**
 * AI Client — Centralized OpenRouter API wrapper
 * All AI calls go through this single module.
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'deepseek/deepseek-v3.2'
const LOW_LATENCY_DEEPSEEK_PROVIDER = {
  order: ['alibaba'],
  allow_fallbacks: true,
  require_parameters: true,
} as const

/**
 * Send a completion request to OpenRouter.
 * Throws on non-OK responses.
 */
export async function callAI(
  messages: AIMessage[],
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in environment variables.')
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': siteUrl,
      'X-Title': 'Arkara CMS',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options?.model ?? DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      ...((options?.model ?? DEFAULT_MODEL) === DEFAULT_MODEL
        ? { provider: LOW_LATENCY_DEEPSEEK_PROVIDER }
        : {}),
      ...(options?.maxTokens && { max_tokens: options.maxTokens }),
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData?.error?.message || `OpenRouter API error: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  const choice = data.choices?.[0]

  if (!choice?.message?.content) {
    throw new Error('AI returned an empty response.')
  }

  return {
    content: choice.message.content,
    model: data.model || DEFAULT_MODEL,
    usage: data.usage,
  }
}
