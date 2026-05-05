import type { AIMessage } from './client'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_GROUNDED_MODEL = 'deepseek/deepseek-v4-pro'
const OPENROUTER_TIMEOUT_MS = 90000
const OPENROUTER_MAX_RETRIES = 2

interface OpenRouterAnnotation {
  type?: string
  url_citation?: {
    url?: string
    title?: string
    content?: string
  }
}

interface OpenRouterChoice {
  message?: {
    content?: string
    annotations?: OpenRouterAnnotation[]
  }
}

export interface GroundedSource {
  title: string
  url?: string
  publisher?: string
  note?: string
}

export interface GroundedAIResponse {
  content: string
  model: string
  annotations?: OpenRouterAnnotation[]
}

function buildMessages(messages: AIMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))
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
    : new Error('OpenRouter grounded request failed for an unknown reason.')
}

export function extractGroundedSources(
  annotations?: OpenRouterAnnotation[]
): GroundedSource[] {
  const seen = new Set<string>()
  const sources: GroundedSource[] = []

  for (const annotation of annotations ?? []) {
    if (annotation.type !== 'url_citation' || !annotation.url_citation) {
      continue
    }

    const url = annotation.url_citation.url?.trim()
    const title = annotation.url_citation.title?.trim()
    const note = annotation.url_citation.content?.trim()

    if (!title && !url) {
      continue
    }

    const dedupeKey = `${title ?? ''}::${url ?? ''}`.toLowerCase()
    if (seen.has(dedupeKey)) {
      continue
    }
    seen.add(dedupeKey)

    let publisher: string | undefined
    if (url) {
      try {
        publisher = new URL(url).hostname.replace(/^www\./, '')
      } catch {
        publisher = undefined
      }
    }

    sources.push({
      title: title || publisher || 'Sumber web',
      ...(url ? { url } : {}),
      ...(publisher ? { publisher } : {}),
      ...(note ? { note } : {}),
    })
  }

  return sources
}

export async function callGroundedJSON(
  messages: AIMessage[],
  options?: {
    model?: string
    temperature?: number
  }
): Promise<GroundedAIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const model = options?.model ?? process.env.OPENROUTER_GROUNDED_MODEL ?? DEFAULT_GROUNDED_MODEL

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
      messages: buildMessages(messages),
      temperature: options?.temperature ?? 0.2,
      tools: [
        {
          type: 'openrouter:web_search',
          parameters: {
            engine: 'auto',
            max_results: 5,
            max_total_results: 12,
            search_context_size: 'medium',
          },
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData?.error?.message || `OpenRouter grounded API error: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  const choice = (data.choices?.[0] ?? null) as OpenRouterChoice | null
  const content = choice?.message?.content?.trim()

  if (!content) {
    throw new Error('OpenRouter grounded verifier returned an empty response.')
  }

  return {
    content,
    model: data.model || model,
    annotations: choice?.message?.annotations,
  }
}
