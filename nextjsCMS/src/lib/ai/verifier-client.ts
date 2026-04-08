import type { AIMessage } from './client'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_GROUNDED_MODEL = 'openai/gpt-4o-mini-search-preview'

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

  const response = await fetch(OPENROUTER_API_URL, {
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
