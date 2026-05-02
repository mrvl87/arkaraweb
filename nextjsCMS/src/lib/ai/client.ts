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
const DEFAULT_MODEL = 'deepseek/deepseek-v4-pro'
const OPENROUTER_TIMEOUT_MS = 90000
const OPENROUTER_MAX_RETRIES = 2
const STABLE_DEEPSEEK_PROVIDER = {
  order: ['deepinfra'],
  allow_fallbacks: true,
  require_parameters: true,
} as const

function isRetryableOpenRouterError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  return (
    message.includes('econnreset') ||
    message.includes('terminated') ||
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('timeout') ||
    message.includes('timed out')
  )
}

async function fetchOpenRouter(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  let attempt = 0
  let lastError: unknown

  while (attempt <= OPENROUTER_MAX_RETRIES) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS)

    try {
      return await fetch(input, {
        cache: 'no-store',
        ...init,
        signal: controller.signal,
      })
    } catch (error) {
      lastError = error

      if (!isRetryableOpenRouterError(error) || attempt === OPENROUTER_MAX_RETRIES) {
        throw error
      }
    } finally {
      clearTimeout(timeout)
    }

    attempt += 1
    await new Promise((resolve) => setTimeout(resolve, 750 * attempt))
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('OpenRouter request failed for an unknown reason.')
}

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

  const response = await fetchOpenRouter(OPENROUTER_API_URL, {
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
        ? { provider: STABLE_DEEPSEEK_PROVIDER }
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
