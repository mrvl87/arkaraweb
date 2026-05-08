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
    server_tool_use?: {
      web_search_requests?: number
    }
  }
}

interface OpenRouterWebSearchOptions {
  enabled: boolean
  engine?: 'auto' | 'native' | 'exa' | 'firecrawl' | 'parallel'
  maxResults?: number
  maxTotalResults?: number
  searchContextSize?: 'low' | 'medium' | 'high'
  allowedDomains?: string[]
  excludedDomains?: string[]
}

interface EmptyAIResponseDetails {
  model: string
  finishReason?: string
  nativeFinishReason?: string
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

export class EmptyAIResponseError extends Error {
  public details: EmptyAIResponseDetails

  constructor(details: EmptyAIResponseDetails) {
    const finishReason = details.finishReason ? ` finish_reason=${details.finishReason}` : ''
    const nativeFinishReason = details.nativeFinishReason ? ` native_finish_reason=${details.nativeFinishReason}` : ''
    super(`AI returned an empty response.${finishReason}${nativeFinishReason}`.trim())
    this.name = 'EmptyAIResponseError'
    this.details = details
  }
}

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

function extractMessageContent(content: unknown): string {
  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part
        }

        if (!part || typeof part !== 'object') {
          return ''
        }

        const typedPart = part as Record<string, unknown>
        if (typeof typedPart.text === 'string') {
          return typedPart.text
        }

        if (typeof typedPart.content === 'string') {
          return typedPart.content
        }

        return ''
      })
      .join('\n')
      .trim()
  }

  return ''
}

async function fetchOpenRouter(
  input: RequestInfo | URL,
  init: RequestInit,
  options?: { timeoutMs?: number; maxRetries?: number }
): Promise<Response> {
  let attempt = 0
  let lastError: unknown
  const timeoutMs = options?.timeoutMs ?? OPENROUTER_TIMEOUT_MS
  const maxRetries = options?.maxRetries ?? OPENROUTER_MAX_RETRIES

  while (attempt <= maxRetries) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      return await fetch(input, {
        cache: 'no-store',
        ...init,
        signal: controller.signal,
      })
    } catch (error) {
      lastError = error

      if (!isRetryableOpenRouterError(error) || attempt === maxRetries) {
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
    timeoutMs?: number
    maxRetries?: number
    webSearch?: OpenRouterWebSearchOptions
  }
): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const model = options?.model ?? DEFAULT_MODEL
  const webSearch = options?.webSearch?.enabled ? options.webSearch : undefined
  const webSearchTool = webSearch
    ? {
        type: 'openrouter:web_search',
        parameters: {
          engine: webSearch.engine ?? 'auto',
          max_results: webSearch.maxResults ?? 5,
          max_total_results: webSearch.maxTotalResults ?? 10,
          search_context_size: webSearch.searchContextSize ?? 'medium',
          ...(webSearch.allowedDomains?.length ? { allowed_domains: webSearch.allowedDomains } : {}),
          ...(webSearch.excludedDomains?.length ? { excluded_domains: webSearch.excludedDomains } : {}),
        },
      }
    : undefined
  const provider =
    model === DEFAULT_MODEL
      ? webSearch
        ? { order: STABLE_DEEPSEEK_PROVIDER.order, allow_fallbacks: STABLE_DEEPSEEK_PROVIDER.allow_fallbacks }
        : STABLE_DEEPSEEK_PROVIDER
      : undefined

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
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      ...(provider ? { provider } : {}),
      ...(webSearchTool ? { tools: [webSearchTool] } : {}),
      ...(options?.maxTokens && { max_tokens: options.maxTokens }),
    }),
  }, {
    timeoutMs: options?.timeoutMs,
    maxRetries: options?.maxRetries,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData?.error?.message || `OpenRouter API error: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  const choice = data.choices?.[0]
  const content = extractMessageContent(choice?.message?.content)

  if (!content) {
    throw new EmptyAIResponseError({
      model: data.model || model,
      finishReason: choice?.finish_reason,
      nativeFinishReason: choice?.native_finish_reason,
    })
  }

  return {
    content,
    model: data.model || DEFAULT_MODEL,
    usage: data.usage,
  }
}
